// contexts/GlobalAppContext.jsx - CONTEXTO COMPLETAMENTE UNIFICADO Y COMPLETO
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";

// ✅ DEFINICIONES DE BADGES
const BADGE_DEFINITIONS = {
  first_story: {
    id: "first_story",
    name: "Primera Historia",
    description: "Escribiste tu primera historia en LiteraLab",
    icon: "🎯",
    rarity: "common",
    points: 10,
  },
  contest_winner: {
    id: "contest_winner",
    name: "Ganador de Concurso",
    description: "Ganaste un concurso mensual",
    icon: "🏆",
    rarity: "rare",
    points: 100,
  },
  participation_streak_3: {
    id: "participation_streak_3",
    name: "Racha de Participación",
    description: "Participaste en 3 concursos consecutivos",
    icon: "🔥",
    rarity: "uncommon",
    points: 25,
  },
  participation_streak_5: {
    id: "participation_streak_5",
    name: "Escritor Consistente",
    description: "Participaste en 5 concursos consecutivos",
    icon: "⚡",
    rarity: "rare",
    points: 50,
  },
  participation_streak_10: {
    id: "participation_streak_10",
    name: "Leyenda Literaria",
    description: "Participaste en 10 concursos consecutivos",
    icon: "👑",
    rarity: "legendary",
    points: 100,
  },
  popular_author_50: {
    id: "popular_author_50",
    name: "Autor Popular",
    description: "Recibiste 50 likes en total",
    icon: "⭐",
    rarity: "uncommon",
    points: 30,
  },
  popular_author_100: {
    id: "popular_author_100",
    name: "Autor Querido",
    description: "Recibiste 100 likes en total",
    icon: "💫",
    rarity: "rare",
    points: 60,
  },
  popular_author_500: {
    id: "popular_author_500",
    name: "Fenómeno Literario",
    description: "Recibiste 500 likes en total",
    icon: "🌟",
    rarity: "legendary",
    points: 150,
  },
  early_adopter: {
    id: "early_adopter",
    name: "Adoptador Temprano",
    description: "Te uniste a LiteraLab en sus primeros días",
    icon: "🚀",
    rarity: "epic",
    points: 75,
  },
  community_supporter: {
    id: "community_supporter",
    name: "Soporte de la Comunidad",
    description: "Votaste por 50 historias diferentes",
    icon: "❤️",
    rarity: "uncommon",
    points: 40,
  },
  prolific_writer: {
    id: "prolific_writer",
    name: "Escritor Prolífico",
    description: "Publicaste 10 historias",
    icon: "📝",
    rarity: "rare",
    points: 80,
  },
};

// ✅ ESTADO INICIAL COMPLETO
const initialState = {
  // Auth State
  user: null,
  isAuthenticated: false,
  authLoading: false,
  authInitialized: false,

  // Contests State
  contests: [],
  currentContest: null,
  contestsLoading: false,
  contestsError: null,

  // User Stories State
  userStories: [],
  userStoriesLoading: false,

  // Voting Stats State
  votingStats: {
    userVotesCount: 0,
    userVotedStories: [],
    currentContestVotes: 0,
    totalVotesGiven: 0,
  },
  votingStatsLoading: false,

  // Gallery State (para evitar recargas innecesarias)
  galleryStories: [],
  galleryLoading: false,
  galleryFilters: {
    category: "all",
    sortBy: "recent",
    search: "",
  },

  // UI State
  notifications: [],
  globalLoading: false,

  // Badge Notifications State
  badgeNotifications: [],

  // Cache e inicialización
  dataFreshness: {
    lastUserStoriesUpdate: null,
    lastVotingStatsUpdate: null,
    lastContestsUpdate: null,
    lastGalleryUpdate: null,
  },
  initialized: false,
};

// ✅ ACTIONS CENTRALIZADAS
const actions = {
  // Auth
  SET_AUTH_STATE: "SET_AUTH_STATE",
  SET_AUTH_LOADING: "SET_AUTH_LOADING",

  // Contests
  SET_CONTESTS: "SET_CONTESTS",
  SET_CURRENT_CONTEST: "SET_CURRENT_CONTEST",
  SET_CONTESTS_LOADING: "SET_CONTESTS_LOADING",
  SET_CONTESTS_ERROR: "SET_CONTESTS_ERROR",

  // User Stories
  SET_USER_STORIES: "SET_USER_STORIES",
  SET_USER_STORIES_LOADING: "SET_USER_STORIES_LOADING",
  ADD_USER_STORY: "ADD_USER_STORY",
  UPDATE_USER_STORY: "UPDATE_USER_STORY",

  // Voting Stats
  SET_VOTING_STATS: "SET_VOTING_STATS",
  SET_VOTING_STATS_LOADING: "SET_VOTING_STATS_LOADING",
  INCREMENT_VOTE_COUNT: "INCREMENT_VOTE_COUNT",
  DECREMENT_VOTE_COUNT: "DECREMENT_VOTE_COUNT",

  // Gallery
  SET_GALLERY_STORIES: "SET_GALLERY_STORIES",
  SET_GALLERY_LOADING: "SET_GALLERY_LOADING",
  SET_GALLERY_FILTERS: "SET_GALLERY_FILTERS",
  UPDATE_STORY_IN_GALLERY: "UPDATE_STORY_IN_GALLERY",

  // Global
  SET_GLOBAL_LOADING: "SET_GLOBAL_LOADING",
  SET_INITIALIZED: "SET_INITIALIZED",
  UPDATE_DATA_FRESHNESS: "UPDATE_DATA_FRESHNESS",
  RESET_ALL_USER_DATA: "RESET_ALL_USER_DATA",

  // Badge Notifications
  ADD_BADGE_NOTIFICATION: "ADD_BADGE_NOTIFICATION",
  REMOVE_BADGE_NOTIFICATION: "REMOVE_BADGE_NOTIFICATION",
};

// ✅ REDUCER OPTIMIZADO
function globalAppReducer(state, action) {
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
      return {
        ...state,
        contests: action.payload,
        dataFreshness: {
          ...state.dataFreshness,
          lastContestsUpdate: Date.now(),
        },
      };

    case actions.SET_CURRENT_CONTEST:
      return { ...state, currentContest: action.payload };

    case actions.SET_CONTESTS_LOADING:
      return { ...state, contestsLoading: action.payload };

    case actions.SET_USER_STORIES:
      return {
        ...state,
        userStories: action.payload,
        dataFreshness: {
          ...state.dataFreshness,
          lastUserStoriesUpdate: Date.now(),
        },
      };

    case actions.SET_USER_STORIES_LOADING:
      return {
        ...state,
        userStoriesLoading: action.payload,
      };

    case actions.ADD_USER_STORY:
      return {
        ...state,
        userStories: [action.payload, ...state.userStories],
      };

    case actions.UPDATE_USER_STORY:
      return {
        ...state,
        userStories: state.userStories.map((story) =>
          story.id === action.payload.id
            ? { ...story, ...action.payload }
            : story
        ),
        galleryStories: state.galleryStories.map((story) =>
          story.id === action.payload.id
            ? { ...story, ...action.payload }
            : story
        ),
      };

    case actions.SET_VOTING_STATS:
      return {
        ...state,
        votingStats: action.payload,
        dataFreshness: {
          ...state.dataFreshness,
          lastVotingStatsUpdate: Date.now(),
        },
      };

    case actions.SET_VOTING_STATS_LOADING:
      return {
        ...state,
        votingStatsLoading: action.payload,
      };

    case actions.INCREMENT_VOTE_COUNT:
      return {
        ...state,
        votingStats: {
          ...state.votingStats,
          userVotesCount: state.votingStats.userVotesCount + 1,
          currentContestVotes: action.payload.isCurrentContest
            ? state.votingStats.currentContestVotes + 1
            : state.votingStats.currentContestVotes,
        },
      };

    case actions.DECREMENT_VOTE_COUNT:
      return {
        ...state,
        votingStats: {
          ...state.votingStats,
          userVotesCount: Math.max(0, state.votingStats.userVotesCount - 1),
          currentContestVotes: action.payload.isCurrentContest
            ? Math.max(0, state.votingStats.currentContestVotes - 1)
            : state.votingStats.currentContestVotes,
        },
      };

    case actions.SET_GALLERY_STORIES:
      return {
        ...state,
        galleryStories: action.payload,
        dataFreshness: {
          ...state.dataFreshness,
          lastGalleryUpdate: Date.now(),
        },
      };

    case actions.SET_GALLERY_LOADING:
      return { ...state, galleryLoading: action.payload };

    case actions.UPDATE_STORY_IN_GALLERY:
      return {
        ...state,
        galleryStories: state.galleryStories.map((story) =>
          story.id === action.payload.id
            ? { ...story, ...action.payload.updates }
            : story
        ),
      };

    case actions.SET_GALLERY_FILTERS:
      return {
        ...state,
        galleryFilters: { ...state.galleryFilters, ...action.payload },
      };

    case actions.SET_INITIALIZED:
      return {
        ...state,
        initialized: action.payload !== undefined ? action.payload : true,
        globalLoading: action.payload !== false ? false : state.globalLoading,
      };

    case actions.ADD_BADGE_NOTIFICATION:
      return {
        ...state,
        badgeNotifications: [...state.badgeNotifications, action.payload],
      };

    case actions.REMOVE_BADGE_NOTIFICATION:
      return {
        ...state,
        badgeNotifications: state.badgeNotifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };

    case actions.RESET_ALL_USER_DATA:
      return {
        ...state,
        userStories: [],
        votingStats: initialState.votingStats,
        galleryStories: [], // También limpiar gallery
        badgeNotifications: [], // También limpiar notificaciones de badges
        dataFreshness: {
          ...state.dataFreshness,
          lastUserStoriesUpdate: null,
          lastVotingStatsUpdate: null,
          lastGalleryUpdate: null,
        },
      };

    default:
      return state;
  }
}

// ✅ CONTEXT
const GlobalAppContext = createContext();

// ✅ PROVIDER PRINCIPAL
export function GlobalAppProvider({ children }) {
  const [state, dispatch] = useReducer(globalAppReducer, initialState);
  const isMounted = useRef(true);
  const initializationInProgress = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ AUTH LISTENER Y SINCRONIZACIÓN
  useEffect(() => {
    let authListener;

    const initializeAuth = async () => {
      try {
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { loading: true, initialized: false },
        });

        // Obtener sesión actual
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              user: null,
              isAuthenticated: false,
              loading: false,
              initialized: true,
            },
          });
          return;
        }

        // Procesar usuario si hay sesión
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.warn("⚠️ Error fetching user profile:", profileError);
            // Solo forzar logout en errores serios, no en usuarios nuevos sin perfil
            if (profileError.status === 401 || profileError.status === 403) {
              console.log("🚨 Error de autorización, forzando logout");
              await supabase.auth.signOut();
              return;
            }
            // Para error 406 o usuario no encontrado, continuar sin perfil
            console.log(
              "ℹ️ Perfil no encontrado, continuando sin datos de perfil"
            );
          }

          const userData = {
            id: session.user.id,
            email: session.user.email,
            name:
              profile?.display_name ||
              session.user.user_metadata?.display_name ||
              session.user.email?.split("@")[0] ||
              "Usuario",
            display_name:
              profile?.display_name ||
              session.user.user_metadata?.display_name ||
              "Usuario",
            avatar: profile?.avatar_url || null,
            is_admin: profile?.is_admin || false,
            is_founder: profile?.is_founder || false,
            badges: profile?.badges || [],
            // Solo agregar datos del perfil si existe
            ...(profile ? profile : {}),
          };

          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              user: userData,
              isAuthenticated: true,
              loading: false,
              initialized: true,
            },
          });
        } else {
          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              user: null,
              isAuthenticated: false,
              loading: false,
              initialized: true,
            },
          });
        }

        // Configurar listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("🔄 Auth state changed:", event);

            // Solo procesar SIGNED_IN si no es parte de la inicialización
            if (event === "SIGNED_IN" && session?.user) {
              // Solo cargar datos si es un login real (no parte de INITIAL_SESSION)
              console.log(
                "🔄 SIGNED_IN event - usuario ya autenticado, saltando carga duplicada"
              );
              return;
            }

            if (event === "INITIAL_SESSION" && session?.user) {
              // Reset solo para datos específicos del usuario, no el estado global
              if (state.user && state.user.id !== session.user.id) {
                dispatch({ type: actions.RESET_ALL_USER_DATA });
              }

              const { data: profile, error: profileError } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

              if (profileError) {
                console.warn(
                  "⚠️ Error fetching profile in auth listener:",
                  profileError
                );
                // Solo forzar logout en errores serios, no en usuarios nuevos sin perfil
                if (
                  profileError.status === 401 ||
                  profileError.status === 403
                ) {
                  console.log(
                    "🚨 Error de autorización en listener, forzando logout"
                  );
                  await supabase.auth.signOut();
                  return;
                }
                // Para error 406 o usuario no encontrado, continuar sin perfil
                console.log(
                  "ℹ️ Perfil no encontrado en listener, continuando sin datos de perfil"
                );
              }

              const userData = {
                id: session.user.id,
                email: session.user.email,
                name:
                  profile?.display_name ||
                  session.user.user_metadata?.display_name ||
                  session.user.email?.split("@")[0] ||
                  "Usuario",
                display_name:
                  profile?.display_name ||
                  session.user.user_metadata?.display_name ||
                  "Usuario",
                avatar: profile?.avatar_url || null,
                is_admin: profile?.is_admin || false,
                is_founder: profile?.is_founder || false,
                badges: profile?.badges || [],
                // Solo agregar datos del perfil si existe
                ...(profile ? profile : {}),
              };

              dispatch({
                type: actions.SET_AUTH_STATE,
                payload: {
                  user: userData,
                  isAuthenticated: true,
                  loading: false,
                  initialized: true,
                },
              });

              // ✅ Poner authInitialized: true ANTES de cargar datos
              dispatch({
                type: actions.SET_AUTH_STATE,
                payload: {
                  user: userData,
                  isAuthenticated: true,
                  loading: false,
                  initialized: true,
                },
              });

              console.log(
                "✅ Usuario autenticado, cargando datos con manejo de errores..."
              );

              // Cargar datos de usuario SIEMPRE en SIGNED_IN e INITIAL_SESSION
              const loadWithTimeout = async (loadFunction, name, userId) => {
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`${name} timeout`)), 10000)
                );
                try {
                  console.log(`🔄 Iniciando carga de ${name}...`);
                  await Promise.race([loadFunction(userId), timeoutPromise]);
                  console.log(`✅ ${name} cargadas`);
                } catch (error) {
                  console.error(`❌ Error cargando ${name}:`, error);
                  dispatch({
                    type: actions.SET_USER_STORIES_LOADING,
                    payload: false,
                  });
                  dispatch({
                    type: actions.SET_VOTING_STATS_LOADING,
                    payload: false,
                  });
                }
              };

              await Promise.all([
                loadWithTimeout(loadUserStories, "userStories", userData.id),
                loadWithTimeout(loadVotingStats, "votingStats", userData.id),
              ]);

              console.log("✅ Proceso de login completado");
            } else if (event === "SIGNED_OUT") {
              dispatch({
                type: actions.SET_AUTH_STATE,
                payload: {
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  initialized: true,
                },
              });
              dispatch({ type: actions.RESET_ALL_USER_DATA });
            }
          }
        );

        return authListener.subscription.unsubscribe;
      } catch (error) {
        console.error("Error initializing auth:", error);
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: {
            user: null,
            isAuthenticated: false,
            loading: false,
            initialized: true,
          },
        });
      }
    };

    initializeAuth().then((unsubscribe) => {
      authListener = unsubscribe;
    });

    return () => {
      if (authListener) authListener();
    };
  }, []);

  // ✅ INICIALIZACIÓN PRINCIPAL (solo una vez después de auth)
  useEffect(() => {
    const initializeApp = async () => {
      // Solo ejecutar si auth está inicializado, no hay inicialización en progreso,
      // y no estamos ya inicializados
      if (
        !state.authInitialized ||
        initializationInProgress.current ||
        state.initialized
      ) {
        return;
      }

      console.log("🚀 Iniciando inicialización de la app...");

      initializationInProgress.current = true;
      dispatch({ type: actions.SET_GLOBAL_LOADING, payload: true });

      try {
        // 1. Cargar contests (siempre)
        console.log("🔄 Cargando contests...");
        await loadContests();
        console.log("✅ Contests cargados, marcando app como inicializada");

        // 2. Los datos del usuario se cargan en el auth listener, no aquí
        // Esto evita re-ejecuciones cuando cambia el usuario

        dispatch({ type: actions.SET_INITIALIZED, payload: true });
        console.log("✅ App marcada como inicializada");
      } catch (error) {
        console.error("❌ Error initializing app:", error);
        // Marcar como inicializada aún con error para no bloquear la UI
        dispatch({ type: actions.SET_INITIALIZED, payload: true });
        dispatch({ type: actions.SET_GLOBAL_LOADING, payload: false });
      } finally {
        initializationInProgress.current = false;
      }
    };

    initializeApp();
  }, [state.authInitialized]); // Solo depende de authInitialized

  // ✅ FUNCIONES DE CARGA DE DATOS

  const loadContests = useCallback(async () => {
    if (!isMounted.current) return;

    console.log("🔄 loadContests iniciado");
    dispatch({ type: actions.SET_CONTESTS_LOADING, payload: true });

    try {
      console.log("📊 Fetching contests from Supabase...");
      const { data: allContests, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log(`📊 Contests fetched: ${allContests?.length || 0} contests`);

      if (!allContests || allContests.length === 0) {
        dispatch({ type: actions.SET_CONTESTS, payload: [] });
        dispatch({ type: actions.SET_CURRENT_CONTEST, payload: null });
        console.log("✅ loadContests completado (sin contests)");
        return;
      }

      // Procesar contests con conteo de participantes
      const processedContests = await Promise.all(
        allContests.map(async (contest) => {
          const { count } = await supabase
            .from("stories")
            .select("*", { count: "exact", head: true })
            .eq("contest_id", contest.id);

          return {
            ...contest,
            participants_count: count || 0,
            submission_deadline:
              contest.submission_deadline ||
              new Date(contest.end_date).toISOString(),
            voting_deadline:
              contest.voting_deadline ||
              new Date(contest.end_date).toISOString(),
            status: contest.status || "active",
          };
        })
      );

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

      if (isMounted.current) {
        dispatch({ type: actions.SET_CONTESTS, payload: processedContests });
        dispatch({ type: actions.SET_CURRENT_CONTEST, payload: current });
        console.log("✅ loadContests completado exitosamente");
      }
    } catch (error) {
      console.error("❌ Error loading contests:", error);
      if (isMounted.current) {
        dispatch({ type: actions.SET_CONTESTS_ERROR, payload: error.message });
      }
      throw error; // Re-throw para que el initializeApp lo capture
    } finally {
      if (isMounted.current) {
        dispatch({ type: actions.SET_CONTESTS_LOADING, payload: false });
      }
    }
  }, []);

  const loadUserStories = useCallback(async (userId) => {
    if (!userId || !isMounted.current) return;

    console.log("🔄 loadUserStories iniciando para:", userId);
    dispatch({ type: actions.SET_USER_STORIES_LOADING, payload: true });

    try {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(
          `
          *,
          contests!inner(id, title, month, status, category)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

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

      if (isMounted.current) {
        dispatch({ type: actions.SET_USER_STORIES, payload: processedStories });
        console.log(
          "✅ loadUserStories completado, historias cargadas:",
          processedStories.length
        );
      }
    } catch (error) {
      console.error("❌ Error loading user stories:", error);
    } finally {
      if (isMounted.current) {
        console.log(
          "🔄 loadUserStories finalizando, poniendo loading en false"
        );
        dispatch({ type: actions.SET_USER_STORIES_LOADING, payload: false });
      }
    }
  }, []);

  const loadVotingStats = useCallback(
    async (userId) => {
      if (!userId || !isMounted.current) return;

      console.log("🔄 loadVotingStats iniciando para:", userId);
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
            contests!inner(id, title, month, status)
          )
        `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

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

        if (isMounted.current) {
          dispatch({ type: actions.SET_VOTING_STATS, payload: votingStats });
          console.log(
            "✅ loadVotingStats completado, votos cargados:",
            votingStats.userVotesCount
          );
        }
      } catch (error) {
        console.error("❌ Error loading voting stats:", error);
      } finally {
        if (isMounted.current) {
          console.log(
            "🔄 loadVotingStats finalizando, poniendo loading en false"
          );
          dispatch({ type: actions.SET_VOTING_STATS_LOADING, payload: false });
        }
      }
    },
    [state.currentContest?.id]
  );

  // ✅ NUEVAS FUNCIONES COMPLETAS PARA STORIES

  const getStoriesByContest = useCallback(async (contestId) => {
    if (!contestId) {
      return { success: false, error: "ID de concurso requerido" };
    }

    try {
      console.log("🔍 Buscando historias para concurso:", contestId);

      // Primero obtener las historias básicas
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("contest_id", contestId)
        .order("created_at", { ascending: false });

      if (storiesError) {
        console.error("❌ Error fetching stories:", storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log("ℹ️ No se encontraron historias para este concurso");
        return { success: true, stories: [] };
      }

      console.log("✅ Historias encontradas:", stories.length);

      // Obtener información de los usuarios
      const userIds = [...new Set(stories.map((story) => story.user_id))];
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);

      if (usersError) {
        console.warn("⚠️ Error fetching user profiles:", usersError);
      }

      // Obtener información del concurso
      const { data: contest, error: contestError } = await supabase
        .from("contests")
        .select("*")
        .eq("id", contestId)
        .single();

      if (contestError) {
        console.warn("⚠️ Error fetching contest:", contestError);
      }

      // Combinar datos manualmente
      const processedStories = stories.map((story) => {
        const userProfile = userProfiles?.find(
          (profile) => profile.id === story.user_id
        );

        return {
          ...story,
          // Asegurar que todos los campos numéricos existan
          likes_count: story.likes_count || 0,
          views_count: story.views_count || 0,
          word_count: story.word_count || 0,
          // Datos del usuario
          user_profiles: userProfile
            ? {
                id: userProfile.id,
                display_name:
                  userProfile.display_name || userProfile.name || "Usuario",
                wins_count: userProfile.wins_count || 0,
                total_likes: userProfile.total_likes || 0,
              }
            : {
                id: story.user_id,
                display_name: "Usuario",
                wins_count: 0,
                total_likes: 0,
              },
          // Datos del concurso
          contests: contest
            ? {
                id: contest.id,
                title: contest.title,
                status: contest.status,
                month: contest.month,
                category: contest.category,
              }
            : {
                id: contestId,
                title: "Concurso",
                status: "unknown",
                month: "Mes",
                category: "Ficción",
              },
          // Campos calculados
          excerpt: story.content
            ? story.content.substring(0, 200) + "..."
            : "Sin contenido disponible",
          readTime: Math.ceil((story.word_count || 0) / 200) + " min",
          author: userProfile?.display_name || userProfile?.name || "Usuario",
          authorId: story.user_id,
          authorWins: userProfile?.wins_count || 0,
          authorTotalLikes: userProfile?.total_likes || 0,
          contestTitle: contest?.title || "Concurso",
          contestStatus: contest?.status || "unknown",
          contestMonth: contest?.month || "Mes",
          contestCategory: contest?.category || "Ficción",
        };
      });

      return { success: true, stories: processedStories };
    } catch (err) {
      console.error("💥 Error fetching stories:", err);
      return {
        success: false,
        error: err.message || "Error al cargar las historias",
      };
    }
  }, []);

  const getStoryById = useCallback(async (storyId) => {
    if (!storyId) {
      return { success: false, error: "ID de historia requerido" };
    }

    try {
      console.log("🔍 Buscando historia por ID:", storyId);

      const { data: story, error: storyError } = await supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single();

      if (storyError) {
        console.error("❌ Error fetching story:", storyError);
        if (storyError.code === "PGRST116") {
          throw new Error("Historia no encontrada");
        }
        throw storyError;
      }

      console.log("✅ Historia encontrada:", story.title);

      // Obtener información del usuario
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", story.user_id)
        .single();

      // Obtener información del concurso
      const { data: contest } = await supabase
        .from("contests")
        .select("*")
        .eq("id", story.contest_id)
        .single();

      // Procesar la historia
      const processedStory = {
        ...story,
        // Asegurar que todos los campos numéricos existan
        likes_count: story.likes_count || 0,
        views_count: story.views_count || 0,
        word_count: story.word_count || 0,
        // Tiempo de lectura estimado
        readTime: Math.ceil((story.word_count || 0) / 200) + " min",
        // Formatear datos del autor
        author: {
          id: story.user_id,
          name: userProfile?.display_name || userProfile?.name || "Usuario",
          bio: userProfile?.bio || "Sin biografía disponible",
          wins: userProfile?.wins_count || 0,
          totalLikes: userProfile?.total_likes || 0,
          joinedAt: userProfile?.created_at || new Date().toISOString(),
        },
        // Formatear datos del concurso
        contest: {
          id: story.contest_id,
          title: contest?.title || "Concurso",
          description: contest?.description || "Sin descripción",
          month: contest?.month || "Mes",
          category: contest?.category || "Ficción",
          status: contest?.status || "unknown",
        },
      };

      return { success: true, story: processedStory };
    } catch (err) {
      console.error("💥 Error fetching story:", err);
      return {
        success: false,
        error: err.message || "Error al cargar la historia",
      };
    }
  }, []);

  const recordStoryView = useCallback(
    async (storyId) => {
      if (!storyId) {
        return { success: false, error: "ID de historia requerido" };
      }

      try {
        console.log("📊 Registrando vista para historia:", storyId);

        // Intentar insertar una vista
        const { error } = await supabase.from("story_views").insert([
          {
            story_id: storyId,
            user_id: state.user?.id || null,
            view_date: new Date().toISOString().split("T")[0],
          },
        ]);

        if (error) {
          // Si la tabla no existe o hay constraint duplicate, no es crítico
          if (error.code === "42P01") {
            console.log(
              "ℹ️ Tabla story_views no existe, saltando registro de vista"
            );
            return { success: true };
          }
          if (error.code === "23505") {
            console.log("ℹ️ Vista ya registrada hoy para este usuario");
            return { success: true };
          }
          console.warn("⚠️ Error recording view:", error);
          return { success: false, error: error.message };
        }

        console.log("✅ Vista registrada exitosamente");
        return { success: true };
      } catch (err) {
        console.warn("⚠️ Error recording view:", err);
        return { success: false, error: err.message };
      }
    },
    [state.user?.id]
  );

  const checkUserLike = useCallback(
    async (storyId) => {
      if (!state.user || !storyId) {
        console.log("🚫 checkUserLike: Sin usuario o storyId");
        return { success: true, liked: false };
      }

      try {
        console.log("🔍 Verificando like:", {
          userId: state.user.id,
          storyId,
        });

        const { data, error } = await supabase
          .from("votes")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", state.user.id);

        if (error) {
          console.warn("⚠️ Error checking vote:", error);
          return { success: true, liked: false };
        }

        const hasLiked = data && data.length > 0;
        console.log("❤️ Resultado verificación like:", {
          hasLiked,
          votesFound: data?.length,
        });

        return { success: true, liked: hasLiked };
      } catch (err) {
        console.warn("💥 Error inesperado checking vote:", err);
        return { success: true, liked: false };
      }
    },
    [state.user?.id]
  );

  const canVoteInStory = useCallback(
    async (storyId) => {
      if (!storyId) {
        return { canVote: false, reason: "Historia no encontrada" };
      }

      try {
        // Obtener la historia para saber el concurso
        const { data: story, error: storyError } = await supabase
          .from("stories")
          .select("contest_id, user_id")
          .eq("id", storyId)
          .single();

        if (storyError) {
          return { canVote: false, reason: "Historia no encontrada" };
        }

        // Verificar que el usuario no vote por su propia historia
        if (story.user_id === state.user?.id) {
          return {
            canVote: false,
            reason: "No puedes votar por tu propia historia",
          };
        }

        // Obtener información del concurso
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", story.contest_id)
          .single();

        if (contestError) {
          return { canVote: false, reason: "Concurso no encontrado" };
        }

        // Determinar la fase actual
        const now = new Date();
        const submissionDeadline = new Date(
          contest.submission_deadline || contest.end_date
        );
        const votingDeadline = new Date(
          contest.voting_deadline || contest.end_date
        );

        let currentPhase;
        if (now <= submissionDeadline) {
          currentPhase = "submission";
        } else if (now <= votingDeadline) {
          currentPhase = "voting";
        } else {
          currentPhase = "results";
        }

        if (currentPhase === "submission") {
          return {
            canVote: false,
            reason: "La votación aún no ha comenzado",
            phase: "submission",
            votingStartsAt: submissionDeadline,
          };
        } else if (currentPhase === "results") {
          return {
            canVote: false,
            reason: "La votación ha terminado",
            phase: "results",
          };
        } else {
          return {
            canVote: true,
            reason: "Votación activa",
            phase: "voting",
            votingEndsAt: votingDeadline,
          };
        }
      } catch (err) {
        console.error("Error checking voting permissions:", err);
        return { canVote: false, reason: "Error al verificar permisos" };
      }
    },
    [state.user?.id]
  );

  // ✅ FUNCIÓN PARA CARGAR GALLERY STORIES
  const loadGalleryStories = useCallback(
    async (filters = {}) => {
      if (!isMounted.current) return;

      dispatch({ type: actions.SET_GALLERY_LOADING, payload: true });

      try {
        console.log("🔍 Cargando historias para galería:", filters);

        // Construir query básico
        let query = supabase.from("stories").select("*");

        // Aplicar filtros básicos
        if (filters.contestId) {
          query = query.eq("contest_id", filters.contestId);
        }

        // Ordenamiento
        switch (filters.sortBy) {
          case "popular":
            query = query.order("views_count", { ascending: false });
            break;
          case "liked":
            query = query.order("likes_count", { ascending: false });
            break;
          case "viewed":
            query = query.order("views_count", { ascending: false });
            break;
          case "recent":
          default:
            query = query.order("created_at", { ascending: false });
            break;
        }

        const { data: stories, error: storiesError } = await query;

        if (storiesError) {
          console.error("❌ Error fetching gallery stories:", storiesError);
          throw storiesError;
        }

        if (!stories || stories.length === 0) {
          console.log("ℹ️ No se encontraron historias");
          dispatch({ type: actions.SET_GALLERY_STORIES, payload: [] });
          return { success: true, stories: [] };
        }

        console.log("✅ Historias de galería encontradas:", stories.length);

        // Obtener información de los usuarios
        const userIds = [...new Set(stories.map((story) => story.user_id))];
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("*")
          .in("id", userIds);

        // Obtener información de los concursos
        const contestIds = [
          ...new Set(stories.map((story) => story.contest_id)),
        ];
        const { data: contests } = await supabase
          .from("contests")
          .select("*")
          .in("id", contestIds);

        // Combinar datos manualmente
        let processedStories = stories.map((story) => {
          const userProfile = userProfiles?.find(
            (profile) => profile.id === story.user_id
          );
          const contest = contests?.find(
            (contest) => contest.id === story.contest_id
          );

          return {
            ...story,
            // Asegurar que todos los campos numéricos existan
            likes_count: story.likes_count || 0,
            views_count: story.views_count || 0,
            word_count: story.word_count || 0,
            // Campos calculados
            excerpt: story.content
              ? story.content.substring(0, 300) + "..."
              : "Sin contenido disponible",
            readTime: Math.ceil((story.word_count || 0) / 200) + " min",
            author: userProfile?.display_name || userProfile?.name || "Usuario",
            authorId: story.user_id,
            authorWins: userProfile?.wins_count || 0,
            authorTotalLikes: userProfile?.total_likes || 0,
            contestTitle: contest?.title || "Concurso",
            contestMonth: contest?.month || "Mes",
            contestCategory: contest?.category || "Ficción",
            // Marcar si el usuario actual ya votó por esta historia
            isLiked: false, // Se actualizará después
          };
        });

        // Aplicar filtros adicionales después de cargar los datos
        if (filters.category && filters.category !== "all") {
          processedStories = processedStories.filter(
            (story) => story.contestCategory === filters.category
          );
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          processedStories = processedStories.filter(
            (story) =>
              story.title.toLowerCase().includes(searchLower) ||
              story.author.toLowerCase().includes(searchLower) ||
              story.excerpt.toLowerCase().includes(searchLower)
          );
        }

        // Si hay usuario autenticado, verificar qué historias ya votó
        if (state.user?.id && processedStories.length > 0) {
          const storyIds = processedStories.map((s) => s.id);
          const { data: userVotes } = await supabase
            .from("votes")
            .select("story_id")
            .eq("user_id", state.user.id)
            .in("story_id", storyIds);

          const votedStoryIds = new Set(
            userVotes?.map((v) => v.story_id) || []
          );

          processedStories = processedStories.map((story) => ({
            ...story,
            isLiked: votedStoryIds.has(story.id),
          }));
        }

        if (isMounted.current) {
          dispatch({
            type: actions.SET_GALLERY_STORIES,
            payload: processedStories,
          });
          dispatch({ type: actions.SET_GALLERY_FILTERS, payload: filters });
        }

        return { success: true, stories: processedStories };
      } catch (err) {
        console.error("💥 Error fetching gallery stories:", err);
        if (isMounted.current) {
          dispatch({ type: actions.SET_GALLERY_STORIES, payload: [] });
        }
        return {
          success: false,
          error: err.message || "Error al cargar las historias",
        };
      } finally {
        if (isMounted.current) {
          dispatch({ type: actions.SET_GALLERY_LOADING, payload: false });
        }
      }
    },
    [state.user?.id]
  );

  // ✅ FUNCIONES PÚBLICAS OPTIMIZADAS

  const refreshUserData = useCallback(async () => {
    if (!state.user?.id) return;

    await Promise.all([
      loadUserStories(state.user.id),
      loadVotingStats(state.user.id),
    ]);

    // Emitir evento para componentes que lo necesiten
    window.dispatchEvent(new CustomEvent("userDataUpdated"));
  }, [state.user?.id, loadUserStories, loadVotingStats]);

  const refreshContests = useCallback(async () => {
    console.log("🔄 Refresh contests solicitado");
    await loadContests();
  }, [loadContests]);

  const submitStory = useCallback(
    async (storyData) => {
      if (!state.user) {
        return {
          success: false,
          error: "Debes iniciar sesión para enviar una historia",
        };
      }

      try {
        // Verificar concurso existe
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", storyData.contestId)
          .single();

        if (contestError) throw new Error("Concurso no encontrado");

        // Verificar no hay historia duplicada
        const { data: existingStory, error: checkError } = await supabase
          .from("stories")
          .select("id")
          .eq("contest_id", storyData.contestId)
          .eq("user_id", state.user.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") throw checkError;
        if (existingStory)
          throw new Error("Ya has enviado una historia para este concurso");

        // Insertar historia
        const storyToInsert = {
          title: storyData.title.trim(),
          content: storyData.content.trim(),
          word_count: storyData.wordCount,
          user_id: state.user.id,
          contest_id: storyData.contestId,
          is_mature: storyData.hasMatureContent || false,
          published_at: new Date().toISOString(),
        };

        const { data: newStory, error: insertError } = await supabase
          .from("stories")
          .insert([storyToInsert])
          .select("*")
          .single();

        if (insertError) throw insertError;

        // Agregar al estado local
        const processedStory = {
          ...newStory,
          likes_count: 0,
          views_count: 0,
          excerpt: newStory.content.substring(0, 200) + "...",
          readTime: Math.ceil(newStory.word_count / 200) + " min",
          contests: contest,
        };

        dispatch({ type: actions.ADD_USER_STORY, payload: processedStory });

        // Actualizar contador de participantes en concurso actual
        if (state.currentContest?.id === storyData.contestId) {
          const updatedContest = {
            ...state.currentContest,
            participants_count:
              (state.currentContest.participants_count || 0) + 1,
          };
          dispatch({
            type: actions.SET_CURRENT_CONTEST,
            payload: updatedContest,
          });
        }

        return {
          success: true,
          story: processedStory,
          message: "¡Tu historia ha sido enviada exitosamente al concurso!",
        };
      } catch (err) {
        console.error("Error submitting story:", err);
        return {
          success: false,
          error: err.message || "Error inesperado al enviar la historia",
        };
      }
    },
    [state.user, state.currentContest]
  );

  const toggleLike = useCallback(
    async (storyId) => {
      if (!state.user) {
        return { success: false, error: "Debes iniciar sesión para dar like" };
      }

      try {
        // Verificar si existe el voto
        const { data: existingVote, error: checkError } = await supabase
          .from("votes")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", state.user.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") throw checkError;

        let liked;
        let isCurrentContest = false;

        // Verificar si es del concurso actual para las estadísticas
        if (state.galleryStories.length > 0) {
          const story = state.galleryStories.find((s) => s.id === storyId);
          isCurrentContest = story?.contest_id === state.currentContest?.id;
        }

        if (existingVote) {
          // Remover voto
          const { error: deleteError } = await supabase
            .from("votes")
            .delete()
            .eq("id", existingVote.id);

          if (deleteError) throw deleteError;
          liked = false;

          dispatch({
            type: actions.DECREMENT_VOTE_COUNT,
            payload: { isCurrentContest },
          });
        } else {
          // Agregar voto
          const { error: insertError } = await supabase
            .from("votes")
            .insert([{ story_id: storyId, user_id: state.user.id }]);

          if (insertError) throw insertError;
          liked = true;

          dispatch({
            type: actions.INCREMENT_VOTE_COUNT,
            payload: { isCurrentContest },
          });
        }

        // Actualizar historia en gallery si está cargada
        const likesChange = liked ? 1 : -1;
        dispatch({
          type: actions.UPDATE_STORY_IN_GALLERY,
          payload: {
            id: storyId,
            updates: {
              likes_count:
                (state.galleryStories.find((s) => s.id === storyId)
                  ?.likes_count || 0) + likesChange,
              isLiked: liked,
            },
          },
        });

        return { success: true, liked };
      } catch (err) {
        console.error("Error toggling like:", err);
        return {
          success: false,
          error: err.message || "Error al procesar el like",
        };
      }
    },
    [state.user, state.galleryStories, state.currentContest?.id]
  );

  // ✅ FUNCIONES DE AUTENTICACIÓN
  // ✅ FUNCIONES DE AUTENTICACIÓN
  const login = useCallback(async (email, password) => {
    dispatch({
      type: actions.SET_AUTH_STATE,
      payload: { loading: true },
    });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { loading: false },
        });
        return {
          success: false,
          error: getErrorMessage(error.message),
        };
      }

      const session = data.session;

      if (!session?.user) {
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { loading: false },
        });
        return { success: false, error: "Sesión inválida" };
      }

      const user = session.user;

      // 🔍 Obtener perfil desde user_profiles
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn("⚠️ Error cargando perfil tras login:", profileError);
      }

      const userData = {
        id: user.id,
        email: user.email,
        name:
          profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Usuario",
        display_name:
          profile?.display_name ||
          user.user_metadata?.display_name ||
          "Usuario",
        avatar: profile?.avatar_url || null,
        is_admin: profile?.is_admin || false,
        is_founder: profile?.is_founder || false,
        badges: profile?.badges || [],
        ...(profile || {}),
      };

      dispatch({
        type: actions.SET_AUTH_STATE,
        payload: {
          user: userData,
          isAuthenticated: true,
          loading: false,
          initialized: true,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      dispatch({
        type: actions.SET_AUTH_STATE,
        payload: { loading: false },
      });
      return {
        success: false,
        error: "Error inesperado. Intenta nuevamente.",
      };
    }
  }, []);

  const register = useCallback(async (email, name, password) => {
    dispatch({
      type: actions.SET_AUTH_STATE,
      payload: { loading: true },
    });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: name.trim(),
          },
        },
      });

      if (error) {
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { loading: false },
        });
        return {
          success: false,
          error: getErrorMessage(error.message),
        };
      }

      // Crear perfil en user_profiles si no existe
      let userId = data.user?.id || data.session?.user?.id;
      if (userId) {
        // Verificar si ya existe el perfil
        let existingProfile = null;
        let retries = 0;
        const maxRetries = 5;
        while (retries < maxRetries) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("id", userId)
            .single();
          if (profile) {
            existingProfile = profile;
            break;
          }
          // Si no existe, intentar crear
          if (retries === 0) {
            const { error: profileError } = await supabase
              .from("user_profiles")
              .insert([
                {
                  id: userId,
                  email: email.trim().toLowerCase(),
                  display_name: name.trim(),
                  created_at: new Date().toISOString(),
                },
              ]);
            if (profileError && profileError.code !== "23505") {
              dispatch({
                type: actions.SET_AUTH_STATE,
                payload: { loading: false },
              });
              return {
                success: false,
                error:
                  "Error creando perfil de usuario: " + profileError.message,
              };
            }
          }
          // Esperar 500ms antes de reintentar
          await new Promise((resolve) => setTimeout(resolve, 500));
          retries++;
        }
        if (!existingProfile) {
          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: { loading: false },
          });
          return {
            success: false,
            error: "No se pudo crear el perfil de usuario. Intenta nuevamente.",
          };
        }
      }

      // 👇 Si la sesión existe, el usuario ya está autenticado
      if (data.session && data.session.user) {
        // Fuerza actualización del estado de autenticación tras registro
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: {
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              name:
                data.session.user.user_metadata?.display_name ||
                data.session.user.email?.split("@")[0] ||
                "Usuario",
              display_name:
                data.session.user.user_metadata?.display_name || "Usuario",
              avatar: null,
              is_admin: false,
              is_founder: false,
              badges: [],
            },
            isAuthenticated: true,
            loading: false,
            initialized: true, // 👈 Marca inicializado
          },
        });
        return { success: true };
      }

      // 👇 Si no hay sesión, intentar login automático con retry
      if (data.user && !data.session) {
        let loginResult = await login(email, password);
        if (!loginResult.success) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          loginResult = await login(email, password);
        }
        // El login ya actualiza el estado correctamente
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { loading: false },
        });
        if (loginResult.success) {
          return { success: true };
        }
        return {
          success: true,
          message:
            "✅ Registro exitoso, pero no se pudo iniciar sesión automáticamente. Por favor, inicia sesión.",
          requiresConfirmation: false,
        };
      }

      dispatch({
        type: actions.SET_AUTH_STATE,
        payload: { loading: false },
      });
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      dispatch({
        type: actions.SET_AUTH_STATE,
        payload: { loading: false },
      });
      return {
        success: false,
        error: "Error inesperado. Intenta nuevamente.",
      };
    }
  }, []);

  const updateUser = useCallback(
    (newUserData) => {
      if (state.user) {
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: {
            user: {
              ...state.user,
              ...newUserData,
            },
            isAuthenticated: true,
          },
        });
      }
    },
    [state.user]
  );

  const getErrorMessage = useCallback((errorMessage) => {
    const errorMap = {
      "Invalid login credentials":
        "Email o contraseña incorrectos. ¿No tienes cuenta? Regístrate primero.",
      "Email not confirmed": "Debes confirmar tu email antes de iniciar sesión",
      "User already registered":
        "Este email ya está registrado. ¿Ya tienes cuenta? Inicia sesión.",
      "Password should be at least 6 characters":
        "La contraseña debe tener al menos 6 caracteres",
      "Unable to validate email address: invalid format":
        "Formato de email inválido",
      "signup is disabled": "El registro está temporalmente deshabilitado",
      "User not found":
        "No existe una cuenta con este email. ¿Quieres registrarte?",
      "Email rate limit exceeded":
        "Demasiados intentos. Espera un momento antes de intentar nuevamente.",
    };

    return errorMap[errorMessage] || errorMessage || "Error desconocido";
  }, []);

  // ✅ FUNCIÓN DE LOGOUT MEJORADA
  const logout = useCallback(async () => {
    try {
      console.log("🚪 Cerrando sesión...");

      // Limpiar localStorage de Supabase manualmente
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut();
      // El listener de auth se encarga del resto
    } catch (error) {
      console.error("Error logging out:", error);
      // Force logout local si falla
      dispatch({
        type: actions.SET_AUTH_STATE,
        payload: {
          user: null,
          isAuthenticated: false,
          loading: false,
          initialized: true,
        },
      });
      dispatch({ type: actions.RESET_ALL_USER_DATA });
    }
  }, []);

  // ✅ FUNCIONES DE BADGE NOTIFICATIONS
  // Funciones de badges movidas al contexto para evitar dependencia circular
  const getBadgeDefinition = useCallback((badgeId) => {
    return BADGE_DEFINITIONS[badgeId] || null;
  }, []);

  const hasUserBadge = useCallback(async (userId, badgeId) => {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking user badge:", error);
      return false;
    }
  }, []);

  const awardBadge = useCallback(async (userId, badgeId, metadata = {}) => {
    if (!state.isAuthenticated) {
      return { success: false, error: "No authenticated" };
    }

    try {
      // Verificar si el usuario ya tiene este badge
      const alreadyHas = await hasUserBadge(userId, badgeId);
      if (alreadyHas) {
        return { success: true, newBadge: false };
      }

      const badgeDefinition = getBadgeDefinition(badgeId);
      if (!badgeDefinition) {
        return { success: false, error: "Badge definition not found" };
      }

      // Otorgar el badge
      const { error: insertError } = await supabase.from("user_badges").insert([
        {
          user_id: userId,
          badge_id: badgeId,
          metadata: metadata,
          earned_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // Actualizar puntos del usuario
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          total_points: supabase.raw(
            `total_points + ${badgeDefinition.points}`
          ),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Actualizar el contexto del usuario si es el usuario actual
      if (state.user && state.user.id === userId) {
        updateUser({
          total_points: (state.user.total_points || 0) + badgeDefinition.points,
        });
      }

      console.log(
        `🎖️ Badge awarded: ${badgeDefinition.name} to user ${userId}`
      );

      return {
        success: true,
        newBadge: true,
        badge: badgeDefinition,
      };
    } catch (error) {
      console.error("Error awarding badge:", error);
      return { success: false, error: error.message };
    }
  }, [state.isAuthenticated, state.user, hasUserBadge, getBadgeDefinition]);

  const showBadgeNotification = useCallback((badge) => {
    const notification = {
      id: Date.now(),
      badge,
      timestamp: Date.now(),
    };

    dispatch({
      type: actions.ADD_BADGE_NOTIFICATION,
      payload: notification,
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      dispatch({
        type: actions.REMOVE_BADGE_NOTIFICATION,
        payload: notification.id,
      });
    }, 5000);
  }, []);

  const removeBadgeNotification = useCallback((notificationId) => {
    dispatch({
      type: actions.REMOVE_BADGE_NOTIFICATION,
      payload: notificationId,
    });
  }, []);

  const checkFirstStoryBadge = useCallback(async (userId) => {
    if (!state.isAuthenticated || !state.user) return;

    try {
      const result = await awardBadge(userId, "first_story");
      if (result.success && result.newBadge) {
        showBadgeNotification(result.badge);
      }
    } catch (error) {
      console.error("Error checking first story badge:", error);
    }
  }, [state.isAuthenticated, state.user, awardBadge, showBadgeNotification]);

  const checkWinnerBadge = useCallback(async (userId, contestTitle) => {
    if (!state.isAuthenticated || !state.user) return;

    try {
      const result = await awardBadge(userId, "contest_winner", {
        contestTitle,
      });
      if (result.success && result.newBadge) {
        showBadgeNotification(result.badge);
      }
    } catch (error) {
      console.error("Error checking winner badge:", error);
    }
  }, [state.isAuthenticated, state.user, awardBadge, showBadgeNotification]);

  const checkStreakBadge = useCallback(async (userId, streakCount) => {
    if (!state.isAuthenticated || !state.user) return;

    try {
      let badgeType = null;
      if (streakCount >= 3) badgeType = "participation_streak_3";
      if (streakCount >= 5) badgeType = "participation_streak_5";
      if (streakCount >= 10) badgeType = "participation_streak_10";

      if (badgeType) {
        const result = await awardBadge(userId, badgeType, { streakCount });
        if (result.success && result.newBadge) {
          showBadgeNotification(result.badge);
        }
      }
    } catch (error) {
      console.error("Error checking streak badge:", error);
    }
  }, [state.isAuthenticated, state.user, awardBadge, showBadgeNotification]);

  const checkPopularityBadge = useCallback(async (userId, totalLikes) => {
    if (!state.isAuthenticated || !state.user) return;

    try {
      let badgeType = null;
      if (totalLikes >= 50) badgeType = "popular_author_50";
      if (totalLikes >= 100) badgeType = "popular_author_100";
      if (totalLikes >= 500) badgeType = "popular_author_500";

      if (badgeType) {
        const result = await awardBadge(userId, badgeType, { totalLikes });
        if (result.success && result.newBadge) {
          showBadgeNotification(result.badge);
        }
      }
    } catch (error) {
      console.error("Error checking popularity badge:", error);
    }
  }, [state.isAuthenticated, state.user, awardBadge, showBadgeNotification]);

  const showFounderWelcome = useCallback(() => {
    if (!state.user?.is_founder) return;

    const founderBadge = {
      id: "founder",
      name: "Miembro Fundador",
      description: "Parte de los primeros usuarios de LiteraLab",
      icon: "🚀",
      rarity: "legendary",
      isSpecial: true,
    };

    showBadgeNotification(founderBadge);
  }, [state.user?.is_founder, showBadgeNotification]);

  // ✅ UTILIDADES DE CONTESTS
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

  const getContestById = useCallback(
    async (id) => {
      try {
        console.log("🔍 Fetching contest by ID:", id);

        // Primero buscar en contests ya cargados
        const existingContest = state.contests.find((c) => c.id === id);
        if (existingContest) {
          console.log("✅ Contest encontrado en cache");
          return existingContest;
        }

        // Si no está en cache, hacer fetch directo
        const { data, error } = await supabase
          .from("contests")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("❌ Contest by ID error:", error);
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

        console.log("✅ Contest by ID processed:", processedContest.title);
        return processedContest;
      } catch (err) {
        console.error("💥 Error fetching contest by ID:", err);
        throw err;
      }
    },
    [state.contests]
  );

  // ✅ VALOR DEL CONTEXTO
  // ✅ FUNCIÓN DE DEBUG
  const debugAuth = useCallback(async () => {
    console.log("🔍 DEBUG: Verificando estado de Supabase...");
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    console.log("🔍 DEBUG: Sesión actual:", session);
    console.log("🔍 DEBUG: Error de sesión:", error);
    console.log("🔍 DEBUG: Estado local:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      authInitialized: state.authInitialized,
      initialized: state.initialized,
    });
  }, [state]);

  const contextValue = {
    // Estado completo
    ...state,

    // Computed values
    isLoading: state.authLoading,
    isAuthReady: state.authInitialized && !state.authLoading,
    currentContestPhase: state.currentContest
      ? getContestPhase(state.currentContest)
      : null,

    // Funciones de autenticación
    login,
    register,
    logout,
    updateUser,

    // Funciones de datos principales
    refreshUserData,
    refreshContests,
    loadContests,
    submitStory,
    toggleLike,

    // Funciones de stories
    getStoriesByContest,
    getStoryById,
    recordStoryView,
    checkUserLike,
    canVoteInStory,
    loadGalleryStories,

    // Utilidades
    getContestPhase,
    getContestById,
    debugAuth,

    // Badge Notifications
    badgeNotifications: state.badgeNotifications,
    showBadgeNotification,
    removeBadgeNotification,
    checkFirstStoryBadge,
    checkWinnerBadge,
    checkStreakBadge,
    checkPopularityBadge,
    showFounderWelcome,

    // Dispatch para casos especiales
    dispatch,
  };

  return (
    <GlobalAppContext.Provider value={contextValue}>
      {children}
    </GlobalAppContext.Provider>
  );
}

// ✅ HOOK PRINCIPAL
export function useGlobalApp() {
  const context = useContext(GlobalAppContext);
  if (!context) {
    throw new Error("useGlobalApp debe usarse dentro de GlobalAppProvider");
  }
  return context;
}
