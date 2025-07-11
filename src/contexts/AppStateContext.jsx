// contexts/AppStateContext.jsx - CONTEXTO COMPLETAMENTE UNIFICADO
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";

// ✅ ESTADO INICIAL
const initialState = {
  // Auth State (sincronizado con authStore)
  user: null,
  isAuthenticated: false,
  authLoading: false,
  authInitialized: false,

  // Contests State
  contests: [],
  currentContest: null,
  contestsLoading: true,
  contestsError: null,
  contestsInitialized: false,

  // User Data State
  userStories: [],
  userStoriesLoading: false,
  userStoriesError: null,

  // Voting Stats State
  votingStats: {
    userVotesCount: 0,
    userVotedStories: [],
    currentContestVotes: 0,
    totalVotesGiven: 0,
  },
  votingStatsLoading: false,

  // UI State
  globalLoading: true,
  notifications: [],

  // Initialization tracking
  hasInitialized: false,
  lastUserId: null,
};

// ✅ ACTIONS
const actions = {
  SET_AUTH_STATE: "SET_AUTH_STATE",
  SET_CONTESTS: "SET_CONTESTS",
  SET_CURRENT_CONTEST: "SET_CURRENT_CONTEST",
  SET_CONTESTS_LOADING: "SET_CONTESTS_LOADING",
  SET_CONTESTS_ERROR: "SET_CONTESTS_ERROR",
  SET_CONTESTS_INITIALIZED: "SET_CONTESTS_INITIALIZED",
  SET_USER_STORIES: "SET_USER_STORIES",
  SET_USER_STORIES_LOADING: "SET_USER_STORIES_LOADING",
  SET_USER_STORIES_ERROR: "SET_USER_STORIES_ERROR",
  SET_VOTING_STATS: "SET_VOTING_STATS",
  SET_VOTING_STATS_LOADING: "SET_VOTING_STATS_LOADING",
  SET_GLOBAL_LOADING: "SET_GLOBAL_LOADING",
  SET_INITIALIZED: "SET_INITIALIZED",
  RESET_USER_DATA: "RESET_USER_DATA",
};

// ✅ REDUCER
function appStateReducer(state, action) {
  switch (action.type) {
    case actions.SET_AUTH_STATE:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        authLoading: action.payload.loading || false,
        authInitialized: action.payload.initialized || false,
      };

    case actions.SET_CONTESTS:
      return { ...state, contests: action.payload };

    case actions.SET_CURRENT_CONTEST:
      return { ...state, currentContest: action.payload };

    case actions.SET_CONTESTS_LOADING:
      return { ...state, contestsLoading: action.payload };

    case actions.SET_CONTESTS_ERROR:
      return { ...state, contestsError: action.payload };

    case actions.SET_CONTESTS_INITIALIZED:
      return { ...state, contestsInitialized: action.payload };

    case actions.SET_USER_STORIES:
      return { ...state, userStories: action.payload };

    case actions.SET_USER_STORIES_LOADING:
      return { ...state, userStoriesLoading: action.payload };

    case actions.SET_USER_STORIES_ERROR:
      return { ...state, userStoriesError: action.payload };

    case actions.SET_VOTING_STATS:
      return { ...state, votingStats: action.payload };

    case actions.SET_VOTING_STATS_LOADING:
      return { ...state, votingStatsLoading: action.payload };

    case actions.SET_GLOBAL_LOADING:
      return { ...state, globalLoading: action.payload };

    case actions.SET_INITIALIZED:
      return {
        ...state,
        hasInitialized: true,
        lastUserId: action.payload.userId,
        globalLoading: false,
      };

    case actions.RESET_USER_DATA:
      return {
        ...state,
        userStories: [],
        votingStats: initialState.votingStats,
        userStoriesLoading: false,
        votingStatsLoading: false,
        lastUserId: null,
      };

    default:
      return state;
  }
}

// ✅ CONTEXT
const AppStateContext = createContext();

// ✅ PROVIDER COMPONENT
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    initialized: authInitialized,
  } = useAuthStore();

  // Referencias para control de ejecución
  const initializationInProgress = useRef(false);
  const loadingOperations = useRef(new Set()); // Track multiple loading operations
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Función para gestionar estados de loading
  const setLoadingOperation = useCallback((operationId, isLoading) => {
    if (isLoading) {
      loadingOperations.current.add(operationId);
    } else {
      loadingOperations.current.delete(operationId);
    }

    // Solo mostrar loading global si hay operaciones en progreso
    const hasAnyLoading = loadingOperations.current.size > 0;
    if (isMounted.current) {
      dispatch({ type: actions.SET_GLOBAL_LOADING, payload: hasAnyLoading });
    }
  }, []);

  // ✅ Sincronizar auth state del store con el contexto
  useEffect(() => {
    if (!isMounted.current) return;

    dispatch({
      type: actions.SET_AUTH_STATE,
      payload: {
        user,
        isAuthenticated,
        loading: authLoading,
        initialized: authInitialized,
      },
    });
  }, [user, isAuthenticated, authLoading, authInitialized]);

  // ✅ INICIALIZACIÓN PRINCIPAL - Solo cuando auth esté listo
  useEffect(() => {
    async function initializeApp() {
      // Solo inicializar si auth está listo y no está en progreso
      if (!authInitialized || initializationInProgress.current) {
        console.log("⏳ [APP_CONTEXT] Esperando auth o ya inicializando...");
        return;
      }

      // Si ya está inicializado para este usuario, no reinicializar
      if (state.hasInitialized && state.lastUserId === user?.id) {
        console.log("✅ [APP_CONTEXT] Ya inicializado para este usuario");
        setLoadingOperation("initialization", false);
        return;
      }

      // Si cambió el usuario, reset data
      if (state.lastUserId && state.lastUserId !== user?.id) {
        console.log("🔄 [APP_CONTEXT] Usuario cambió, reseteando datos...");
        dispatch({ type: actions.RESET_USER_DATA });
      }

      initializationInProgress.current = true;
      setLoadingOperation("initialization", true);
      console.log("🚀 [APP_CONTEXT] Inicializando aplicación...");

      try {
        // 1. Cargar contests (siempre, independiente del usuario)
        await loadContests();

        // 2. Si hay usuario, cargar datos específicos
        if (user?.id) {
          await Promise.all([
            loadUserStories(user.id),
            loadVotingStats(user.id),
          ]);
        }

        // 3. Marcar como inicializado
        if (isMounted.current) {
          dispatch({
            type: actions.SET_INITIALIZED,
            payload: { userId: user?.id || null },
          });
        }

        console.log("✅ [APP_CONTEXT] Inicialización completada");
      } catch (error) {
        console.error("💥 [APP_CONTEXT] Error en inicialización:", error);
      } finally {
        setLoadingOperation("initialization", false);
        initializationInProgress.current = false;
      }
    }

    initializeApp();
  }, [
    authInitialized,
    user?.id,
    state.hasInitialized,
    state.lastUserId,
    setLoadingOperation,
  ]);

  // ✅ FUNCIÓN: Cargar contests
  const loadContests = useCallback(async () => {
    if (!isMounted.current) return;

    const operationId = "load-contests";
    console.log("🏆 [APP_CONTEXT] Cargando contests...");

    setLoadingOperation(operationId, true);
    dispatch({ type: actions.SET_CONTESTS_LOADING, payload: true });

    try {
      const { data: allContests, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!isMounted.current) return;

      if (!allContests || allContests.length === 0) {
        dispatch({ type: actions.SET_CONTESTS, payload: [] });
        dispatch({ type: actions.SET_CURRENT_CONTEST, payload: null });
        return;
      }

      // Procesar contests
      const processedContests = [];

      for (const contest of allContests) {
        if (!isMounted.current) break;

        const { count: storiesCount } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", contest.id);

        processedContests.push({
          ...contest,
          participants_count: storiesCount || 0,
          submission_deadline:
            contest.submission_deadline ||
            new Date(contest.end_date).toISOString(),
          voting_deadline:
            contest.voting_deadline || new Date(contest.end_date).toISOString(),
          status: contest.status || "active",
        });
      }

      if (!isMounted.current) return;

      // Encontrar concurso actual
      const current =
        processedContests.find(
          (contest) =>
            contest.status === "active" ||
            contest.status === "submission" ||
            contest.status === "voting"
        ) ||
        processedContests[0] ||
        null;

      dispatch({ type: actions.SET_CONTESTS, payload: processedContests });
      dispatch({ type: actions.SET_CURRENT_CONTEST, payload: current });
      dispatch({ type: actions.SET_CONTESTS_INITIALIZED, payload: true });

      console.log(
        "✅ [APP_CONTEXT] Contests cargados:",
        processedContests.length
      );
    } catch (error) {
      console.error("❌ [APP_CONTEXT] Error cargando contests:", error);
      if (isMounted.current) {
        dispatch({ type: actions.SET_CONTESTS_ERROR, payload: error.message });
      }
    } finally {
      if (isMounted.current) {
        dispatch({ type: actions.SET_CONTESTS_LOADING, payload: false });
        setLoadingOperation(operationId, false);
      }
    }
  }, [setLoadingOperation]);

  // ✅ FUNCIÓN: Cargar historias del usuario
  const loadUserStories = useCallback(
    async (userId) => {
      if (!userId || !isMounted.current) return;

      const operationId = "load-user-stories";
      console.log("📚 [APP_CONTEXT] Cargando historias del usuario:", userId);

      setLoadingOperation(operationId, true);
      dispatch({ type: actions.SET_USER_STORIES_LOADING, payload: true });

      try {
        const { data: stories, error } = await supabase
          .from("stories")
          .select(
            `
          *,
          contests!inner(
            id,
            title,
            month,
            status,
            category
          )
        `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!isMounted.current) return;

        // Procesar historias
        const processedStories = (stories || []).map((story) => ({
          ...story,
          likes_count: story.likes_count || 0,
          views_count: story.views_count || 0,
          word_count: story.word_count || 0,
          excerpt: story.content
            ? story.content.substring(0, 200) + "..."
            : "Sin contenido disponible",
          readTime: Math.ceil((story.word_count || 0) / 200) + " min",
        }));

        dispatch({ type: actions.SET_USER_STORIES, payload: processedStories });

        console.log(
          "✅ [APP_CONTEXT] Historias del usuario cargadas:",
          processedStories.length
        );
      } catch (error) {
        console.error("❌ [APP_CONTEXT] Error cargando historias:", error);
        if (isMounted.current) {
          dispatch({
            type: actions.SET_USER_STORIES_ERROR,
            payload: error.message,
          });
        }
      } finally {
        if (isMounted.current) {
          dispatch({ type: actions.SET_USER_STORIES_LOADING, payload: false });
          setLoadingOperation(operationId, false);
        }
      }
    },
    [setLoadingOperation]
  );

  // ✅ FUNCIÓN: Cargar estadísticas de votación
  const loadVotingStats = useCallback(
    async (userId) => {
      if (!userId || !isMounted.current) return;

      const operationId = "load-voting-stats";
      console.log("📊 [APP_CONTEXT] Cargando stats de votación:", userId);

      setLoadingOperation(operationId, true);
      dispatch({ type: actions.SET_VOTING_STATS_LOADING, payload: true });

      try {
        const { data: allVotes, error } = await supabase
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
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!isMounted.current) return;

        const userVotedStories =
          allVotes?.map((vote) => ({
            storyId: vote.story_id,
            storyTitle: vote.stories?.title || "Historia sin título",
            contestTitle: vote.stories?.contests?.title || "Concurso",
            contestMonth: vote.stories?.contests?.month || "Mes",
            votedAt: vote.created_at,
          })) || [];

        // Contar votos en concurso actual
        let currentContestVotes = 0;
        if (state.currentContest && allVotes) {
          currentContestVotes = allVotes.filter(
            (vote) => vote.stories?.contest_id === state.currentContest.id
          ).length;
        }

        const votingStats = {
          userVotesCount: allVotes?.length || 0,
          userVotedStories,
          currentContestVotes,
          totalVotesGiven: allVotes?.length || 0,
        };

        dispatch({ type: actions.SET_VOTING_STATS, payload: votingStats });

        console.log("✅ [APP_CONTEXT] Stats de votación cargadas:", {
          total: allVotes?.length || 0,
          currentContest: currentContestVotes,
        });
      } catch (error) {
        console.error("❌ [APP_CONTEXT] Error cargando voting stats:", error);
      } finally {
        if (isMounted.current) {
          dispatch({ type: actions.SET_VOTING_STATS_LOADING, payload: false });
          setLoadingOperation(operationId, false);
        }
      }
    },
    [state.currentContest, setLoadingOperation]
  );

  // ✅ FUNCIONES PÚBLICAS
  const refreshContests = useCallback(async () => {
    console.log("🔄 [APP_CONTEXT] Refresh contests solicitado");
    await loadContests();
  }, [loadContests]);

  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    console.log("🔄 [APP_CONTEXT] Refresh user data solicitado");
    await Promise.all([loadUserStories(user.id), loadVotingStats(user.id)]);
    window.dispatchEvent(new CustomEvent("userDataUpdated"));
  }, [user?.id, loadUserStories, loadVotingStats]);

  // ✅ FUNCIÓN: Obtener contest por ID
  const getContestById = useCallback(
    async (id) => {
      try {
        console.log("🔍 [APP_CONTEXT] Fetching contest by ID:", id);

        // Primero buscar en contests ya cargados
        const existingContest = state.contests.find((c) => c.id === id);
        if (existingContest) {
          console.log("✅ [APP_CONTEXT] Contest encontrado en cache");
          return existingContest;
        }

        // Si no está en cache, hacer fetch directo
        const { data, error } = await supabase
          .from("contests")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("❌ [APP_CONTEXT] Contest by ID error:", error);
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
        };

        console.log(
          "✅ [APP_CONTEXT] Contest by ID processed:",
          processedContest.title
        );
        return processedContest;
      } catch (err) {
        console.error("💥 [APP_CONTEXT] Error fetching contest by ID:", err);
        throw err;
      }
    },
    [state.contests]
  );

  // Funciones de utilidad para contests
  const getContestPhase = useCallback((contest) => {
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
  }, []);

  const contextValue = {
    // State
    ...state,

    // Auth helpers
    isAuthReady: authInitialized && !authLoading,

    // Contest helpers
    currentContestPhase: state.currentContest
      ? getContestPhase(state.currentContest)
      : null,
    getContestPhase,
    getContestById,

    // Actions
    refreshContests,
    refreshUserData,
    loadUserStories: () =>
      user?.id ? loadUserStories(user.id) : Promise.resolve(),
    loadVotingStats: () =>
      user?.id ? loadVotingStats(user.id) : Promise.resolve(),
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// ✅ CUSTOM HOOK PRINCIPAL
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState debe usarse dentro de AppStateProvider");
  }
  return context;
}
