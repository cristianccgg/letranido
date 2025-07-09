// store/contestsStore.js - STORE GLOBAL PARA CONTESTS
import { create } from "zustand";
import { supabase } from "../lib/supabase";

// Variables globales para controlar la inicialización
let isInitializing = false;
let hasInitialized = false;
let initPromise = null;

export const useContestsStore = create((set, get) => ({
  contests: [],
  currentContest: null,
  loading: true,
  error: null,
  initialized: false,

  // ✅ Inicialización centralizada
  initialize: async () => {
    const state = get();

    // ✅ Si ya hay una inicialización en progreso, esperar a que termine
    if (initPromise) {
      console.log("⏳ [CONTESTS] Esperando inicialización en progreso...");
      return await initPromise;
    }

    // ✅ Si ya está inicializado, no hacer nada
    if (hasInitialized && state.initialized) {
      console.log("✅ [CONTESTS] Ya inicializado");
      return;
    }

    // ✅ Crear y guardar el promise de inicialización
    initPromise = performInitialization();

    try {
      await initPromise;
    } finally {
      initPromise = null;
    }
  },

  // ✅ Refetch manual
  refetch: async () => {
    console.log("🔄 [CONTESTS] Refetch manual solicitado");
    hasInitialized = false;
    initPromise = null;
    await get().initialize();
  },

  // ✅ Cleanup
  cleanup: () => {
    console.log("🧹 [CONTESTS] Limpiando store...");
    isInitializing = false;
    hasInitialized = false;
    initPromise = null;

    set({
      contests: [],
      currentContest: null,
      loading: true,
      error: null,
      initialized: false,
    });
  },

  // ✅ Función para obtener contest por ID
  getContestById: async (id) => {
    try {
      console.log("🔍 [CONTESTS] Fetching contest by ID:", id);

      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ [CONTESTS] Contest by ID error:", error);
        if (error.code === "PGRST116") {
          throw new Error("Concurso no encontrado");
        }
        throw error;
      }

      const { count: storiesCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("contest_id", id);

      const processedContest = {
        ...data,
        participants_count: storiesCount || 0,
        submission_deadline:
          data.submission_deadline || new Date(data.end_date).toISOString(),
        voting_deadline:
          data.voting_deadline || new Date(data.end_date).toISOString(),
        status: data.status || "active",
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        submission_deadline_date: new Date(
          data.submission_deadline || data.end_date
        ),
        voting_deadline_date: new Date(data.voting_deadline || data.end_date),
      };

      console.log(
        "✅ [CONTESTS] Contest by ID processed:",
        processedContest.title
      );
      return processedContest;
    } catch (err) {
      console.error("💥 [CONTESTS] Error fetching contest by ID:", err);
      throw err;
    }
  },

  // ✅ Funciones de utilidad
  getContestPhase: (contest) => {
    if (!contest) return "unknown";

    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);
    const votingDeadline = new Date(contest.voting_deadline);

    if (now <= submissionDeadline) {
      return "submission";
    } else if (now <= votingDeadline) {
      return "voting";
    } else {
      return "results";
    }
  },

  getTimeLeft: (contest, phase = null) => {
    if (!contest) return null;

    const currentPhase = phase || get().getContestPhase(contest);
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
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days,
      hours,
      minutes,
      total: diff,
    };
  },

  isContestActive: (contest) => {
    if (!contest) return false;

    const now = new Date();
    const endDate = new Date(contest.voting_deadline || contest.end_date);

    return (
      now <= endDate &&
      (contest.status === "active" ||
        contest.status === "submission" ||
        contest.status === "voting")
    );
  },

  canSubmitToContest: (contest) => {
    if (!contest) return false;

    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);

    return (
      now <= submissionDeadline &&
      (contest.status === "submission" || contest.status === "voting")
    );
  },

  canVoteInContest: (contest) => {
    if (!contest) return false;

    const phase = get().getContestPhase(contest);
    return phase === "voting";
  },
}));

// ✅ FUNCIÓN DE INICIALIZACIÓN INTERNA
async function performInitialization() {
  if (isInitializing || hasInitialized) {
    console.log("🚫 [CONTESTS] Inicialización ya en progreso o completada");
    return;
  }

  isInitializing = true;
  console.log("🚀 [CONTESTS] Iniciando store (ÚNICA VEZ)...");

  const { getState, setState } = useContestsStore;
  setState({ loading: true, error: null });

  try {
    console.log("🔍 [CONTESTS] Fetching contests...");

    const { data: allContests, error: contestsError } = await supabase
      .from("contests")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("📊 [CONTESTS] Contests response:", {
      allContests,
      contestsError,
    });

    if (contestsError) {
      console.error("❌ [CONTESTS] Contests error details:", contestsError);
      throw contestsError;
    }

    if (!allContests || allContests.length === 0) {
      console.log("ℹ️ [CONTESTS] No se encontraron concursos");
      setState({
        contests: [],
        currentContest: null,
        loading: false,
        initialized: true,
      });
      return;
    }

    // ✅ Procesar concursos
    const processedContests = [];

    for (const contest of allContests) {
      try {
        const { count: storiesCount } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", contest.id);

        const processedContest = {
          ...contest,
          participants_count: storiesCount || 0,
          submission_deadline:
            contest.submission_deadline ||
            new Date(contest.end_date).toISOString(),
          voting_deadline:
            contest.voting_deadline || new Date(contest.end_date).toISOString(),
          status: contest.status || "active",
          start_date: new Date(contest.start_date),
          end_date: new Date(contest.end_date),
          submission_deadline_date: new Date(
            contest.submission_deadline || contest.end_date
          ),
          voting_deadline_date: new Date(
            contest.voting_deadline || contest.end_date
          ),
        };

        processedContests.push(processedContest);
      } catch (err) {
        console.warn(
          `⚠️ [CONTESTS] Error procesando concurso ${contest.id}:`,
          err
        );
      }
    }

    console.log("✅ [CONTESTS] Contests processed:", processedContests.length);

    // ✅ Encontrar el concurso actual
    const current =
      processedContests.find(
        (contest) =>
          contest.status === "active" ||
          contest.status === "submission" ||
          contest.status === "voting"
      ) ||
      processedContests[0] ||
      null;

    console.log("🎯 [CONTESTS] Current contest:", current?.title || "None");

    setState({
      contests: processedContests,
      currentContest: current,
      loading: false,
      initialized: true,
    });

    hasInitialized = true;
    console.log("✅ [CONTESTS] Store inicializado exitosamente");
  } catch (error) {
    console.error("💥 [CONTESTS] Error initializing:", error);
    setState({
      contests: [],
      currentContest: null,
      loading: false,
      error: error.message || "Error al cargar los concursos",
      initialized: true,
    });
  } finally {
    isInitializing = false;
  }
}

// ✅ INICIALIZACIÓN AUTOMÁTICA SOLO EN BROWSER
if (typeof window !== "undefined") {
  if (import.meta.env.DEV) {
    window.__contestsStoreCleanup = () => {
      console.log("🧹 [CONTESTS] Manual cleanup desde DevTools");
      useContestsStore.getState().cleanup();
    };
  }

  // ✅ Inicializar automáticamente con delay
  setTimeout(() => {
    if (!hasInitialized && !isInitializing) {
      console.log("🎬 [CONTESTS] Auto-inicializando store...");
      useContestsStore.getState().initialize();
    }
  }, 200); // Delay pequeño para evitar conflictos
}
