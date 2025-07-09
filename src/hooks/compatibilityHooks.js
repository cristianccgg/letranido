// hooks/compatibilityHooks.js - HOOKS DE COMPATIBILIDAD SIMPLIFICADOS
// Solo wrappers delgados alrededor del contexto unificado

import { useAppState } from "../contexts/AppStateContext";
import { useCallback } from "react";

// ✅ Hook de compatibilidad para useContests
export function useContests() {
  const {
    contests,
    currentContest,
    contestsLoading,
    contestsError,
    contestsInitialized,
    currentContestPhase,
    getContestPhase,
    refreshContests,
    getContestById,
  } = useAppState();

  // Funciones adicionales que algunos componentes esperan
  const getTimeLeft = useCallback(
    (contest, phase = null) => {
      if (!contest) return null;

      const currentPhase = phase || getContestPhase(contest);
      const now = new Date();
      let targetDate;

      switch (currentPhase) {
        case "submission":
          targetDate = new Date(contest.submission_deadline);
          break;
        case "voting":
          targetDate = new Date(contest.voting_deadline);
          break;
        default:
          return null;
      }

      const diff = targetDate - now;
      if (diff <= 0) return null;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return { days, hours, minutes, total: diff };
    },
    [getContestPhase]
  );

  const isContestActive = useCallback((contest) => {
    if (!contest) return false;

    const now = new Date();
    const endDate = new Date(contest.voting_deadline || contest.end_date);

    return (
      now <= endDate &&
      (contest.status === "active" ||
        contest.status === "submission" ||
        contest.status === "voting")
    );
  }, []);

  const canSubmitToContest = useCallback((contest) => {
    if (!contest) return false;

    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);

    return (
      now <= submissionDeadline &&
      (contest.status === "submission" || contest.status === "voting")
    );
  }, []);

  const canVoteInContest = useCallback(
    (contest) => {
      if (!contest) return false;

      const phase = getContestPhase(contest);
      return phase === "voting";
    },
    [getContestPhase]
  );

  return {
    contests,
    currentContest,
    loading: contestsLoading,
    error: contestsError,
    initialized: contestsInitialized,
    currentPhase: currentContestPhase,
    getContestPhase,
    getTimeLeft,
    isContestActive,
    canSubmitToContest,
    canVoteInContest,
    refetch: refreshContests,
    getContestById,
  };
}

// ✅ Hook de compatibilidad para useVotingStats - SIMPLIFICADO
export function useVotingStats() {
  const { votingStats, votingStatsLoading, refreshUserData } = useAppState();

  // Destructurar para mantener la interfaz exacta que esperan los componentes
  const {
    userVotesCount = 0,
    currentContestVotes = 0,
    userVotedStories = [],
    totalVotesGiven = 0,
  } = votingStats;

  return {
    // ✅ Propiedades individuales para compatibilidad
    userVotesCount,
    currentContestVotes,
    userVotedStories,
    totalVotesGiven,

    // ✅ Estado de carga
    loading: votingStatsLoading,

    // ✅ Funciones
    refreshStats: refreshUserData,
    refresh: refreshUserData,
  };
}
