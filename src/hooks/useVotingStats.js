// hooks/useVotingStats.js - ARREGLADO sin loops
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export const useVotingStats = () => {
  const [stats, setStats] = useState({
    userVotesCount: 0,
    userVotedStories: [],
    currentContestVotes: 0,
    totalVotesGiven: 0,
    loading: true,
  });

  const { user } = useAuthStore();

  // ✅ useRef para evitar cargas múltiples
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

  const loadUserVotingStats = useCallback(async () => {
    if (!user?.id) {
      if (isMounted.current) setStats((prev) => ({ ...prev, loading: false }));
      return;
    }

    // Evitar cargas múltiples para el mismo usuario
    if (
      isLoading.current ||
      (hasLoaded.current && currentUserId.current === user.id)
    ) {
      console.log("⏳ Stats ya cargadas para este usuario, saltando...");
      return;
    }

    isLoading.current = true;

    try {
      console.log(
        "📊 Cargando estadísticas de votación para usuario:",
        user.id
      );

      // Obtener todos los votos del usuario
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

      if (votesError) throw votesError;

      // Procesar estadísticas
      const userVotedStories =
        allVotes?.map((vote) => ({
          storyId: vote.story_id,
          storyTitle: vote.stories.title,
          contestTitle: vote.stories.contests.title,
          contestMonth: vote.stories.contests.month,
          votedAt: vote.created_at,
        })) || [];

      // Contar votos en concurso actual (buscar concurso activo)
      const { data: currentContest } = await supabase
        .from("contests")
        .select("id")
        .in("status", ["submission", "voting"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let currentContestVotes = 0;
      if (currentContest && allVotes) {
        currentContestVotes = allVotes.filter(
          (vote) => vote.stories.contest_id === currentContest.id
        ).length;
      }

      if (!isMounted.current) return; // <--- Añadido

      setStats({
        userVotesCount: allVotes?.length || 0,
        userVotedStories,
        currentContestVotes,
        totalVotesGiven: allVotes?.length || 0,
        loading: false,
      });

      hasLoaded.current = true;
      currentUserId.current = user.id;

      console.log("✅ Estadísticas de votación cargadas:", {
        total: allVotes?.length || 0,
        currentContest: currentContestVotes,
      });
    } catch (err) {
      console.error("💥 Error cargando estadísticas de votación:", err);
      if (isMounted.current) setStats((prev) => ({ ...prev, loading: false }));
    } finally {
      isLoading.current = false;
    }
  }, [user?.id]);

  // ✅ Solo cargar cuando cambie el usuario
  useEffect(() => {
    // Reset si cambió el usuario
    if (currentUserId.current !== user?.id) {
      hasLoaded.current = false;
      currentUserId.current = user?.id;
    }

    // Solo cargar si no se ha cargado para este usuario
    if (!hasLoaded.current && !isLoading.current) {
      loadUserVotingStats();
    }
  }, [user?.id, loadUserVotingStats]);

  const refreshStats = useCallback(() => {
    console.log("🔄 Refresh manual de estadísticas de votación");
    hasLoaded.current = false;
    loadUserVotingStats();
  }, [loadUserVotingStats]);

  return {
    ...stats,
    refreshStats,
  };
};
