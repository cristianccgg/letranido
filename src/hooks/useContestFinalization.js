// hooks/useContestFinalization.js - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useState } from "react";
import { useGlobalApp } from "../contexts/GlobalAppContext"; // ✅ CAMBIADO
import { supabase } from "../lib/supabase";

export const useContestFinalization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ USO DEL CONTEXTO GLOBAL EN LUGAR DE AUTHSTORE
  const { user, isAuthenticated, refreshContests } = useGlobalApp();

  const finalizeContest = async (contestId) => {
    if (!isAuthenticated || !user?.is_admin) {
      setError("No tienes permisos para finalizar concursos");
      return { success: false, error: "Sin permisos" };
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🏁 Iniciando finalización del concurso:", contestId);

      // 1. Obtener todas las historias del concurso
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select(
          `
          id,
          title,
          user_id,
          likes_count,
          views_count,
          user_profiles(id, display_name, email)
        `
        )
        .eq("contest_id", contestId)
        .order("likes_count", { ascending: false });

      if (storiesError) {
        throw new Error("Error obteniendo historias: " + storiesError.message);
      }

      if (!stories || stories.length === 0) {
        throw new Error("No hay historias en este concurso");
      }

      console.log(`📊 Encontradas ${stories.length} historias para finalizar`);

      // 2. Determinar ganadores (top 3)
      const winners = stories.slice(0, 3);
      console.log(
        "🏆 Ganadores determinados:",
        winners.map((w) => w.title)
      );

      // 3. Marcar historias ganadoras
      const winnerUpdates = winners.map(async (winner, index) => {
        const position = index + 1;
        const { error: updateError } = await supabase
          .from("stories")
          .update({
            is_winner: true,
            winner_position: position,
          })
          .eq("id", winner.id);

        if (updateError) {
          console.error(`Error marcando ganador ${position}:`, updateError);
          throw updateError;
        }

        console.log(
          `✅ Historia "${winner.title}" marcada como ganador #${position}`
        );
        return { ...winner, position };
      });

      await Promise.all(winnerUpdates);

      // 4. Actualizar estadísticas de usuarios ganadores
      const userUpdates = winners.map(async (winner, index) => {
        const position = index + 1;
        const pointsAwarded = position === 1 ? 100 : position === 2 ? 50 : 25;

        // Actualizar wins_count y total_points
        const { error: userUpdateError } = await supabase
          .from("user_profiles")
          .update({
            wins_count: supabase.raw(`wins_count + 1`),
            total_points: supabase.raw(`total_points + ${pointsAwarded}`),
          })
          .eq("id", winner.user_id);

        if (userUpdateError) {
          console.error(
            `Error actualizando usuario ${winner.user_id}:`,
            userUpdateError
          );
          throw userUpdateError;
        }

        console.log(
          `🎖️ Usuario ${winner.user_profiles?.display_name} actualizado: +1 victoria, +${pointsAwarded} puntos`
        );
      });

      await Promise.all(userUpdates);

      // 5. Actualizar estado del concurso a "results"
      const { error: contestUpdateError } = await supabase
        .from("contests")
        .update({
          status: "results",
          finalized_at: new Date().toISOString(),
        })
        .eq("id", contestId);

      if (contestUpdateError) {
        throw new Error(
          "Error actualizando concurso: " + contestUpdateError.message
        );
      }

      console.log("🎯 Concurso marcado como finalizado");

      // 6. Refrescar datos del contexto
      await refreshContests();

      console.log("🎉 Finalización completada exitosamente");

      setLoading(false);
      return {
        success: true,
        winners: winners.map((winner, index) => ({
          ...winner,
          position: index + 1,
        })),
        totalStories: stories.length,
      };
    } catch (err) {
      console.error("💥 Error en finalización del concurso:", err);
      setError(err.message);
      setLoading(false);
      return {
        success: false,
        error: err.message,
      };
    }
  };

  const revertFinalization = async (contestId) => {
    if (!isAuthenticated || !user?.is_admin) {
      setError("No tienes permisos para revertir finalización");
      return { success: false, error: "Sin permisos" };
    }

    setLoading(true);
    setError(null);

    try {
      console.log("↩️ Revirtiendo finalización del concurso:", contestId);

      // 1. Obtener historias ganadoras para revertir
      const { data: winnerStories, error: winnersError } = await supabase
        .from("stories")
        .select("id, user_id, winner_position")
        .eq("contest_id", contestId)
        .eq("is_winner", true);

      if (winnersError) {
        throw new Error("Error obteniendo ganadores: " + winnersError.message);
      }

      // 2. Revertir marcas de ganador en historias
      if (winnerStories && winnerStories.length > 0) {
        const { error: revertStoriesError } = await supabase
          .from("stories")
          .update({
            is_winner: false,
            winner_position: null,
          })
          .eq("contest_id", contestId)
          .eq("is_winner", true);

        if (revertStoriesError) {
          throw new Error(
            "Error revirtiendo historias: " + revertStoriesError.message
          );
        }

        // 3. Revertir estadísticas de usuarios
        const userReverts = winnerStories.map(async (story) => {
          const pointsToRemove =
            story.winner_position === 1
              ? 100
              : story.winner_position === 2
              ? 50
              : 25;

          const { error: userRevertError } = await supabase
            .from("user_profiles")
            .update({
              wins_count: supabase.raw(`GREATEST(wins_count - 1, 0)`),
              total_points: supabase.raw(
                `GREATEST(total_points - ${pointsToRemove}, 0)`
              ),
            })
            .eq("id", story.user_id);

          if (userRevertError) {
            console.error(
              `Error revirtiendo usuario ${story.user_id}:`,
              userRevertError
            );
            throw userRevertError;
          }
        });

        await Promise.all(userReverts);
      }

      // 4. Revertir estado del concurso
      const { error: contestRevertError } = await supabase
        .from("contests")
        .update({
          status: "voting",
          finalized_at: null,
        })
        .eq("id", contestId);

      if (contestRevertError) {
        throw new Error(
          "Error revirtiendo concurso: " + contestRevertError.message
        );
      }

      // 5. Refrescar datos del contexto
      await refreshContests();

      console.log("✅ Finalización revertida exitosamente");

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error("💥 Error revirtiendo finalización:", err);
      setError(err.message);
      setLoading(false);
      return {
        success: false,
        error: err.message,
      };
    }
  };

  return {
    finalizeContest,
    revertFinalization,
    loading,
    error,
    setError,
  };
};
