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
          created_at
        `
        )
        .eq("contest_id", contestId)
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: true });

      if (storiesError) {
        throw new Error("Error obteniendo historias: " + storiesError.message);
      }

      if (!stories || stories.length === 0) {
        throw new Error("No hay historias en este concurso");
      }

      console.log(`📊 Encontradas ${stories.length} historias para finalizar`);

      // 1.5. Obtener información de los usuarios
      const userIds = stories.map(story => story.user_id).filter(Boolean);
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      if (usersError) {
        throw new Error("Error obteniendo perfiles de usuario: " + usersError.message);
      }

      // Combinar historias con perfiles de usuario
      const storiesWithUsers = stories.map(story => ({
        ...story,
        user_profiles: userProfiles?.find(profile => profile.id === story.user_id) || null
      }));

      // 2. Determinar ganadores (top 3)
      const winners = storiesWithUsers.slice(0, 3);

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

      // 4. Actualizar estadísticas de usuarios ganadores y asignar badges
      const userUpdates = winners.map(async (winner, index) => {
        const position = index + 1;

        // Solo actualizar wins_count para primer lugar
        if (position === 1) {
          // Primero obtener valores actuales
          const { data: currentUser, error: getUserError } = await supabase
            .from("user_profiles")
            .select("wins_count")
            .eq("id", winner.user_id)
            .single();

          if (getUserError) {
            console.error(
              `Error obteniendo datos del usuario ${winner.user_id}:`,
              getUserError
            );
            throw getUserError;
          }

          const newWinsCount = (currentUser.wins_count || 0) + 1;

          // Actualizar wins_count solo para primer lugar
          const { error: userUpdateError } = await supabase
            .from("user_profiles")
            .update({
              wins_count: newWinsCount,
            })
            .eq("id", winner.user_id);

          if (userUpdateError) {
            console.error(
              `Error actualizando usuario ${winner.user_id}:`,
              userUpdateError
            );
            throw userUpdateError;
          }
        }

        // 🏆 ASIGNAR BADGES DE GANADORES
        try {
          // Badge según posición
          const badgeType = position === 1 ? 'contest_winner' : 'contest_finalist';
          
          // Llamar función de base de datos para asignar badge
          const { error: badgeError } = await supabase.rpc('award_specific_badge', {
            target_user_id: winner.user_id,
            badge_type: badgeType,
            contest_id: contestId
          });

          if (badgeError) {
            console.error(`Error asignando badge ${badgeType} a usuario ${winner.user_id}:`, badgeError);
            // No lanzar error para no fallar todo el proceso, solo loggearlo
          } else {
            console.log(`🏅 Badge ${badgeType} asignado a ${winner.user_profiles?.display_name} (posición ${position})`);
          }

          // Badge de veterano SOLO si tiene 2+ primeros lugares (posición 1)
          if (position === 1) {
            // Obtener el newWinsCount actualizado solo para primer lugar
            const { data: updatedUser, error: getUpdatedUserError } = await supabase
              .from("user_profiles")
              .select("wins_count")
              .eq("id", winner.user_id)
              .single();
              
            // Badge de veterano: 2+ victorias (según documentación pública)
            if (!getUpdatedUserError && updatedUser.wins_count >= 2) {
              const { error: veteranBadgeError } = await supabase.rpc('award_specific_badge', {
                target_user_id: winner.user_id,
                badge_type: 'contest_winner_veteran',
                contest_id: contestId
              });

              if (veteranBadgeError) {
                console.error(`Error asignando badge veteran a usuario ${winner.user_id}:`, veteranBadgeError);
              } else {
                console.log(`🏆 Badge veterano asignado a ${winner.user_profiles?.display_name} (${updatedUser.wins_count} victorias)`);
              }
            }

            // 🆕 Badge de leyenda: 5+ victorias
            if (!getUpdatedUserError && updatedUser.wins_count >= 5) {
              const { error: legendBadgeError } = await supabase.rpc('award_specific_badge', {
                target_user_id: winner.user_id,
                badge_type: 'contest_winner_legend',
                contest_id: contestId
              });

              if (legendBadgeError) {
                console.error(`Error asignando badge leyenda a usuario ${winner.user_id}:`, legendBadgeError);
              } else {
                console.log(`👑 Badge leyenda asignado a ${winner.user_profiles?.display_name} (${updatedUser.wins_count} victorias)`);
              }
            }
          }

        } catch (badgeErr) {
          console.error(`Error en asignación de badges para usuario ${winner.user_id}:`, badgeErr);
          // Continuar sin fallar el proceso
        }

        if (position === 1) {
          console.log(
            `🎖️ Usuario ${winner.user_profiles?.display_name} actualizado: +1 victoria (1er lugar)`
          );
        } else {
          console.log(
            `🎖️ Usuario ${winner.user_profiles?.display_name}: posición ${position} (sin incremento wins_count)`
          );
        }
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

      // 7. Email de resultados se enviará manualmente desde admin panel

      console.log("🎉 Finalización completada exitosamente");

      setLoading(false);
      return {
        success: true,
        message: "Concurso finalizado exitosamente. Ganadores marcados y estadísticas actualizadas.",
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

        // 3. Revertir estadísticas de usuarios (solo wins_count para primer lugar)
        const userReverts = winnerStories.map(async (story) => {
          // Solo revertir wins_count para primer lugar (winner_position === 1)
          if (story.winner_position === 1) {
            // Primero obtener valores actuales
            const { data: currentUser, error: getUserError } = await supabase
              .from("user_profiles")
              .select("wins_count")
              .eq("id", story.user_id)
              .single();

            if (getUserError) {
              console.error(
                `Error obteniendo datos del usuario ${story.user_id}:`,
                getUserError
              );
              throw getUserError;
            }

            // Revertir solo wins_count para primer lugar
            const { error: userRevertError } = await supabase
              .from("user_profiles")
              .update({
                wins_count: Math.max((currentUser.wins_count || 0) - 1, 0),
              })
              .eq("id", story.user_id);

            if (userRevertError) {
              console.error(
                `Error revirtiendo usuario ${story.user_id}:`,
                userRevertError
              );
              throw userRevertError;
            }
            
            console.log(`↩️ Wins_count revertido para usuario ${story.user_id} (era 1er lugar)`);
          } else {
            console.log(`↩️ Sin cambios en wins_count para usuario ${story.user_id} (era posición ${story.winner_position})`);
          }
        });

        await Promise.all(userReverts);

        // 4. Eliminar badges de ganadores del concurso
        try {
          console.log("🏅 Eliminando badges de ganadores del concurso...");
          const { error: badgesError } = await supabase
            .from("user_badges")
            .delete()
            .eq("metadata->contest_id", contestId)
            .in("badge_id", ["contest_winner", "contest_finalist", "contest_winner_veteran"]);

          if (badgesError) {
            console.error("Error eliminando badges:", badgesError);
            // No lanzar error para no fallar todo el proceso
          } else {
            console.log("✅ Badges de ganadores eliminados correctamente");
          }
        } catch (badgeErr) {
          console.error("Error en eliminación de badges:", badgeErr);
          // Continuar sin fallar el proceso
        }
      }

      // 5. Revertir estado del concurso
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

      // 6. Refrescar datos del contexto
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

  const previewWinners = async (contestId) => {
    if (!isAuthenticated || !user?.is_admin) {
      setError("No tienes permisos para ver ganadores");
      return { success: false, error: "Sin permisos" };
    }

    setLoading(true);
    setError(null);

    try {
      console.log("👀 Obteniendo vista previa de ganadores para:", contestId);

      // Obtener todas las historias del concurso
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select(
          `
          id,
          title,
          user_id,
          likes_count,
          views_count,
          created_at
        `
        )
        .eq("contest_id", contestId)
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: true });

      if (storiesError) {
        throw new Error("Error obteniendo historias: " + storiesError.message);
      }

      if (!stories || stories.length === 0) {
        console.log("⚠️ No hay historias en este concurso");
        setLoading(false);
        return { success: true, winners: [] };
      }

      console.log(`📊 Encontradas ${stories.length} historias para vista previa`);

      // Obtener información de los usuarios
      const userIds = stories.map(story => story.user_id).filter(Boolean);
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      if (usersError) {
        throw new Error("Error obteniendo perfiles de usuario: " + usersError.message);
      }

      // Combinar historias con perfiles de usuario
      const storiesWithUsers = stories.map(story => ({
        ...story,
        user_profiles: userProfiles?.find(profile => profile.id === story.user_id) || null
      }));

      // DEBUG: Log del ordenamiento
      console.log("🔍 DEBUG Preview - Historias ordenadas:", 
        storiesWithUsers.slice(0, 5).map((s, i) => ({
          pos: i + 1,
          title: s.title?.substring(0, 20) + "...",
          likes: s.likes_count,
          created: s.created_at
        }))
      );

      // Determinar ganadores (top 3)
      const winners = storiesWithUsers.slice(0, 3);

      console.log(
        "🏆 Vista previa de ganadores:",
        winners.map((w) => w.title)
      );

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
      console.error("💥 Error en vista previa de ganadores:", err);
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
    previewWinners,
    revertFinalization,
    loading,
    error,
    setError,
  };
};
