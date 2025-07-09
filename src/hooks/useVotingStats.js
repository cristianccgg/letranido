// hooks/useVotingStats.js - VERSIÓN SIMPLIFICADA SIN DEPENDENCIAS
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useContestsStore } from "../store/contestsStore";

export const useVotingStats = () => {
  const [stats, setStats] = useState({
    userVotesCount: 0,
    userVotedStories: [],
    currentContestVotes: 0,
    totalVotesGiven: 0,
    loading: true,
  });

  const { user } = useAuthStore();
  const { currentContest } = useContestsStore(); // ✅ Usar el store directamente

  // ✅ Referencias para control de ejecución
  const hasLoaded = useRef(false);
  const currentUserId = useRef(null);
  const isLoading = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Función principal SIN dependencias de otros hooks
  const loadUserVotingStats = useCallback(async () => {
    if (!user?.id) {
      if (isMounted.current) {
        setStats({
          userVotesCount: 0,
          userVotedStories: [],
          currentContestVotes: 0,
          totalVotesGiven: 0,
          loading: false,
        });
      }
      return;
    }

    // ✅ Evitar cargas múltiples
    if (
      isLoading.current ||
      (hasLoaded.current && currentUserId.current === user.id)
    ) {
      console.log("⏳ Stats ya cargadas para este usuario, saltando...");
      return;
    }

    if (!isMounted.current) return;

    isLoading.current = true;

    try {
      console.log(
        "📊 Cargando estadísticas de votación para usuario:",
        user.id
      );

      // ✅ Obtener todos los votos del usuario
      const { data: allVotes, error: votesError } = await supabase
        .from("votes")
        .select(
          `
          id,
          story_id,
          created_at,
          stories!inner(
            id,
            title,
            contest_id,
            contests!inner(
              id,
              title,
              month,
              status
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (votesError) {
        console.error("❌ Error obteniendo votos:", votesError);
        throw votesError;
      }

      if (!isMounted.current) return;

      // ✅ Procesar estadísticas básicas
      const userVotedStories =
        allVotes?.map((vote) => ({
          storyId: vote.story_id,
          storyTitle: vote.stories?.title || "Historia sin título",
          contestTitle: vote.stories?.contests?.title || "Concurso",
          contestMonth: vote.stories?.contests?.month || "Mes",
          votedAt: vote.created_at,
        })) || [];

      // ✅ Usar concurso del store en lugar de búsqueda directa
      let currentContestVotes = 0;
      if (currentContest && allVotes) {
        currentContestVotes = allVotes.filter(
          (vote) => vote.stories?.contest_id === currentContest.id
        ).length;
      }

      if (!isMounted.current) return;

      // ✅ Actualizar estado
      setStats({
        userVotesCount: allVotes?.length || 0,
        userVotedStories,
        currentContestVotes,
        totalVotesGiven: allVotes?.length || 0,
        loading: false,
      });

      // ✅ Marcar como cargado
      hasLoaded.current = true;
      currentUserId.current = user.id;

      console.log("✅ Estadísticas de votación cargadas:", {
        total: allVotes?.length || 0,
        currentContest: currentContestVotes,
      });
    } catch (err) {
      console.error("💥 Error cargando estadísticas de votación:", err);
      if (isMounted.current) {
        setStats({
          userVotesCount: 0,
          userVotedStories: [],
          currentContestVotes: 0,
          totalVotesGiven: 0,
          loading: false,
        });
      }
    } finally {
      isLoading.current = false;
    }
  }, [user?.id, currentContest?.id]); // ✅ También depender del currentContest

  // ✅ Effect simple que solo se ejecuta cuando cambia el usuario
  useEffect(() => {
    // ✅ Reset si cambió el usuario
    if (currentUserId.current !== user?.id) {
      console.log("🔄 Usuario cambió, reseteando stats...");
      hasLoaded.current = false;
      currentUserId.current = user?.id;

      if (isMounted.current) {
        setStats({
          userVotesCount: 0,
          userVotedStories: [],
          currentContestVotes: 0,
          totalVotesGiven: 0,
          loading: true,
        });
      }
    }

    // ✅ Cargar si no está cargado
    if (!hasLoaded.current && !isLoading.current && user?.id) {
      // ✅ Solo cargar si también tenemos el concurso o no lo necesitamos
      loadUserVotingStats();
    } else if (!user?.id) {
      // ✅ Limpiar si no hay usuario
      if (isMounted.current) {
        setStats({
          userVotesCount: 0,
          userVotedStories: [],
          currentContestVotes: 0,
          totalVotesGiven: 0,
          loading: false,
        });
      }
      hasLoaded.current = true; // Evitar loops
    }
  }, [user?.id, currentContest?.id, loadUserVotingStats]);

  // ✅ Función de refresh manual
  const refreshStats = useCallback(() => {
    if (!isMounted.current) return;

    console.log("🔄 Refresh manual de estadísticas de votación");
    hasLoaded.current = false;
    isLoading.current = false;
    loadUserVotingStats();
  }, [loadUserVotingStats]);

  return {
    ...stats,
    refreshStats,
  };
};
