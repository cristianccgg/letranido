// hooks/useContests.js - HOOK SIMPLIFICADO QUE USA EL STORE
import { useEffect } from "react";
import { useContestsStore } from "../store/contestsStore";

export const useContests = () => {
  const {
    contests,
    currentContest,
    loading,
    error,
    initialized,
    initialize,
    refetch,
    getContestById,
    getContestPhase,
    getTimeLeft,
    isContestActive,
    canSubmitToContest,
    canVoteInContest,
  } = useContestsStore();

  // ✅ Solo inicializar UNA VEZ al usar el hook por primera vez
  useEffect(() => {
    if (!initialized && !loading) {
      console.log("🎯 [useContests] Solicitando inicialización del store...");
      initialize();
    }
  }, [initialized, loading, initialize]);

  return {
    contests,
    currentContest,
    loading,
    error,
    refetch,
    getContestById,
    getContestPhase,
    getTimeLeft,
    isContestActive,
    canSubmitToContest,
    canVoteInContest,
  };
};
