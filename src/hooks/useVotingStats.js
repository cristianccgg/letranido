// hooks/useVotingStats.js
import { useState, useEffect, useCallback } from "react";
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

  const loadUserVotingStats = useCallback(async () => {
    if (!user) {
      setStats((prev) => ({ ...prev, loading: false }));
      return;
    }

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

      setStats({
        userVotesCount: allVotes?.length || 0,
        userVotedStories,
        currentContestVotes,
        totalVotesGiven: allVotes?.length || 0,
        loading: false,
      });

      console.log("✅ Estadísticas de votación cargadas:", {
        total: allVotes?.length || 0,
        currentContest: currentContestVotes,
      });
    } catch (err) {
      console.error("💥 Error cargando estadísticas de votación:", err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserVotingStats();
  }, [loadUserVotingStats]);

  const refreshStats = () => {
    loadUserVotingStats();
  };

  return {
    ...stats,
    refreshStats,
  };
};
