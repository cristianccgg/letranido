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

  // Auth Modal State
  showAuthModal: false,
  authModalMode: "login",
  authModalErrors: {},

  // Cookie Consent State
  cookieConsent: null,
  showCookieBanner: false,

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

  // Auth Modal
  SET_AUTH_MODAL: "SET_AUTH_MODAL",

  // Cookie Consent
  SET_COOKIE_CONSENT: "SET_COOKIE_CONSENT",
  SET_SHOW_COOKIE_BANNER: "SET_SHOW_COOKIE_BANNER",

  // Global
  SET_GLOBAL_LOADING: "SET_GLOBAL_LOADING",
  SET_INITIALIZED: "SET_INITIALIZED",
  UPDATE_DATA_FRESHNESS: "UPDATE_DATA_FRESHNESS",
  RESET_ALL_USER_DATA: "RESET_ALL_USER_DATA",
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

    case actions.RESET_ALL_USER_DATA:
      return {
        ...state,
        userStories: [],
        votingStats: initialState.votingStats,
        galleryStories: [], // También limpiar gallery
        dataFreshness: {
          ...state.dataFreshness,
          lastUserStoriesUpdate: null,
          lastVotingStatsUpdate: null,
          lastGalleryUpdate: null,
        },
      };

    case actions.SET_AUTH_MODAL:
      return {
        ...state,
        showAuthModal:
          action.payload.show !== undefined
            ? action.payload.show
            : state.showAuthModal,
        authModalMode: action.payload.mode || state.authModalMode,
        authModalErrors:
          action.payload.errors !== undefined
            ? action.payload.errors
            : state.authModalErrors,
      };

    case actions.SET_COOKIE_CONSENT:
      return {
        ...state,
        cookieConsent: action.payload,
      };

    case actions.SET_SHOW_COOKIE_BANNER:
      return {
        ...state,
        showCookieBanner: action.payload,
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

            // Forzar logout en errores de autorización
            if (profileError.status === 401 || profileError.status === 403) {
              console.log("🚨 Error de autorización, forzando logout");
              await supabase.auth.signOut();
              return;
            }

            // Para error PGRST116 (usuario no encontrado), también hacer logout
            // Esto previene usuarios "fantasma" que fueron eliminados de la DB
            if (profileError.code === "PGRST116") {
              console.log(
                "🚨 Usuario no encontrado en base de datos, forzando logout por seguridad"
              );

              try {
                await supabase.auth.signOut();
              } catch (logoutError) {
                console.error("❌ Error en logout automático:", logoutError);
                console.log("🔄 Forzando logout local por seguridad");
              }

              // Forzar logout local independientemente del resultado de Supabase
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
              return;
            }

            // Para otros errores, continuar sin perfil
            console.log(
              "ℹ️ Error de perfil no crítico, continuando sin datos de perfil"
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
              console.log(
                "🚪 SIGNED_OUT event - manteniendo authInitialized como true"
              );
              dispatch({
                type: actions.SET_AUTH_STATE,
                payload: {
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  initialized: true, // Mantener authInitialized como true
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

        // 2. Verificar consentimiento de cookies
        const cookieConsent = localStorage.getItem('cookie-consent');
        if (cookieConsent) {
          try {
            const parsedConsent = JSON.parse(cookieConsent);
            dispatch({ type: actions.SET_COOKIE_CONSENT, payload: parsedConsent });
            dispatch({ type: actions.SET_SHOW_COOKIE_BANNER, payload: false });
          } catch (e) {
            console.warn("Error parsing cookie consent, showing banner");
            dispatch({ type: actions.SET_SHOW_COOKIE_BANNER, payload: true });
          }
        } else {
          dispatch({ type: actions.SET_SHOW_COOKIE_BANNER, payload: true });
        }

        // 3. Los datos del usuario se cargan en el auth listener, no aquí
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

      // Encontrar concurso actual con lógica híbrida
      const current = findCurrentContest(processedContests);

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
          contests!inner(id, title, month, status, category, submission_deadline, voting_deadline)
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
        const isAuthenticated = !!state.user?.id;
        const today = new Date().toISOString().split("T")[0];
        console.log(
          "📊 Registrando vista para historia:",
          storyId,
          isAuthenticated ? "(usuario registrado)" : "(visitante)",
          "fecha:",
          today
        );

        // Verificar si ya se contó una vista hoy para este usuario/historia
        const viewKey = `view_${storyId}_${state.user?.id || "anon"}_${today}`;
        const alreadyViewed = localStorage.getItem(viewKey);

        console.log("📋 Verificando vista:", {
          viewKey,
          alreadyViewed: !!alreadyViewed,
        });

        let viewAlreadyExists = false;

        if (alreadyViewed) {
          console.log("ℹ️ Vista ya registrada hoy para este usuario");
          viewAlreadyExists = true;
        } else {
          // Actualizar views_count directamente en stories
          console.log("🔄 Actualizando views_count directamente...");

          try {
            // Obtener contador actual
            const { data: currentStory, error: fetchError } = await supabase
              .from("stories")
              .select("views_count")
              .eq("id", storyId)
              .single();

            if (fetchError) {
              console.warn("⚠️ Error obteniendo views_count:", fetchError);
              return { success: false, error: fetchError.message };
            }

            const newCount = (currentStory.views_count || 0) + 1;

            // Actualizar contador
            const { error: updateError } = await supabase
              .from("stories")
              .update({ views_count: newCount })
              .eq("id", storyId);

            if (updateError) {
              console.warn("⚠️ Error actualizando views_count:", updateError);
              return { success: false, error: updateError.message };
            }

            // Marcar como visto en localStorage
            localStorage.setItem(viewKey, "true");
            console.log(
              `✅ views_count actualizado: ${currentStory.views_count || 0} → ${newCount}`
            );

            // Actualizar también galleryStories para sincronización inmediata
            if (state.galleryStories.length > 0) {
              const currentGalleryStory = state.galleryStories.find(
                (s) => s.id === storyId
              );
              if (currentGalleryStory) {
                dispatch({
                  type: actions.UPDATE_STORY_IN_GALLERY,
                  payload: {
                    id: storyId,
                    updates: {
                      views_count: newCount,
                    },
                  },
                });
                console.log(
                  "✅ Estado galleryStories actualizado inmediatamente"
                );
              }
            }
          } catch (err) {
            console.warn("⚠️ Error en actualización directa:", err);
            return { success: false, error: err.message };
          }
        }

        // Manejar actualización del contador de vistas - IGUAL QUE LIKES
        if (!viewAlreadyExists) {
          const userType = isAuthenticated ? "usuario registrado" : "visitante";
          console.log(
            `✅ Nueva vista de ${userType} registrada - trigger actualizará views_count`
          );

          // Actualizar estado local inmediatamente (como hace toggleLike)
          if (state.galleryStories.length > 0) {
            const currentStory = state.galleryStories.find(
              (s) => s.id === storyId
            );
            if (currentStory) {
              dispatch({
                type: actions.UPDATE_STORY_IN_GALLERY,
                payload: {
                  id: storyId,
                  updates: {
                    views_count: (currentStory.views_count || 0) + 1,
                  },
                },
              });
              console.log("✅ Estado local actualizado inmediatamente");
            }
          }

          // Recargar después para sincronizar con BD (como hace toggleLike)
          setTimeout(async () => {
            if (state.currentContest?.id) {
              console.log(
                "⏰ Recargando galleryStories para sincronización de vistas"
              );
              await loadGalleryStories({ contestId: state.currentContest.id });
              console.log("✅ GalleryStories recargada - views sincronizadas");
            }
          }, 200);
        } else {
          const userType = isAuthenticated ? "usuario registrado" : "visitante";
          console.log(
            `✅ Vista de ${userType} ya existía para hoy - contador no se incrementa`
          );
        }

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

        // Verificar si es del concurso actual - PRIMERO buscar en galleryStories,
        // luego hacer consulta directa si galleryStories está vacía
        if (state.galleryStories.length > 0) {
          const story = state.galleryStories.find((s) => s.id === storyId);
          isCurrentContest = story?.contest_id === state.currentContest?.id;
        } else if (state.currentContest?.id) {
          // GalleryStories está vacía, consultar directamente la historia para verificar concurso
          try {
            const { data: story, error } = await supabase
              .from("stories")
              .select("contest_id")
              .eq("id", storyId)
              .single();

            if (!error && story) {
              isCurrentContest = story.contest_id === state.currentContest.id;
            }
          } catch (err) {
            console.warn("Error verificando concurso de la historia:", err);
          }
        }

        console.log("🔍 Análisis de voto:", {
          storyId,
          isCurrentContest,
          currentContestId: state.currentContest?.id,
          galleryStoriesCount: state.galleryStories.length,
          existingVote: !!existingVote,
        });

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

        // SIEMPRE actualizar galleryStories si es concurso actual para máxima sincronización
        const likesChange = liked ? 1 : -1;

        if (isCurrentContest) {
          console.log(
            "🔄 Sincronizando voto en concurso actual - galleryStories:",
            state.galleryStories.length > 0 ? "cargada" : "vacía"
          );

          if (state.galleryStories.length > 0) {
            // Gallery ya está cargada, actualizar directamente
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
            console.log("✅ GalleryStories actualizada directamente");
          }

          // SIEMPRE recargar para asegurar sincronización perfecta
          setTimeout(async () => {
            console.log(
              "⏰ Recargando galleryStories para sincronización perfecta"
            );
            await loadGalleryStories({ contestId: state.currentContest?.id });
            console.log(
              "✅ GalleryStories recargada - sincronización completa"
            );
          }, 200);
        } else if (state.galleryStories.length > 0) {
          // No es concurso actual pero gallery está cargada (concursos históricos)
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
        }

        return { success: true, liked };
      } catch (err) {
        console.error("Error toggling like:", err);
        return {
          success: false,
          error: err.message || "Error al procesar el like",
        };
      }
    },
    [
      state.user,
      state.galleryStories,
      state.currentContest?.id,
      loadGalleryStories,
    ]
  );

  // ✅ FUNCIONES PARA AUTH MODAL (deben ir antes de las funciones de auth)
  const openAuthModal = useCallback((mode = "login") => {
    console.log("📱 Abriendo modal de auth:", mode);
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { show: true, mode },
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    console.log("📱 Cerrando modal de auth");
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { show: false, errors: {} },
    });
  }, []);

  const setAuthModalError = useCallback((error) => {
    console.log("❌ Estableciendo error en modal:", error);
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { errors: { general: error } },
    });
  }, []);

  const clearAuthModalErrors = useCallback(() => {
    console.log("🧹 Limpiando errores del modal");
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { errors: {} },
    });
  }, []);

  // ✅ FUNCIONES PARA COOKIE CONSENT
  const setCookieConsent = useCallback((consent) => {
    console.log("🍪 Estableciendo consentimiento de cookies:", consent);
    localStorage.setItem('cookie-consent', JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString()
    }));
    dispatch({ type: actions.SET_COOKIE_CONSENT, payload: consent });
    dispatch({ type: actions.SET_SHOW_COOKIE_BANNER, payload: false });
  }, []);

  const showCookieBannerAgain = useCallback(() => {
    console.log("🍪 Mostrando banner de cookies nuevamente");
    dispatch({ type: actions.SET_SHOW_COOKIE_BANNER, payload: true });
  }, []);

  const resetCookieConsent = useCallback(() => {
    console.log("🍪 Reseteando consentimiento de cookies");
    localStorage.removeItem('cookie-consent');
    dispatch({ type: actions.SET_COOKIE_CONSENT, payload: null });
    dispatch({ type: actions.SET_SHOW_COOKIE_BANNER, payload: true });
  }, []);

  // ✅ FUNCIONES DE AUTENTICACIÓN
  const login = useCallback(
    async (email, password) => {
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
          console.log("🚨 Error de login de Supabase:", error);
          const errorMessage = getErrorMessage(error.message);

          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              loading: false,
              // Preservar authInitialized - no cambiarlo durante errores de login
              initialized: state.authInitialized,
            },
          });

          // Establecer error en el modal global
          setAuthModalError(errorMessage);

          return {
            success: false,
            error: errorMessage,
          };
        }

        const session = data.session;

        if (!session?.user) {
          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              loading: false,
              // Preservar authInitialized - no cambiarlo durante errores de login
              initialized: state.authInitialized,
            },
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
        console.error("💥 Login error inesperado:", error);
        console.error("💥 Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: {
            loading: false,
            // Preservar authInitialized - no cambiarlo durante errores de login
            initialized: state.authInitialized,
          },
        });
        return {
          success: false,
          error: "Error inesperado. Intenta nuevamente.",
        };
      }
    },
    [state.authInitialized, setAuthModalError]
  );

  const register = useCallback(
    async (email, name, password, emailNotifications = true) => {
      console.log(
        "🔍 register() recibió emailNotifications:",
        emailNotifications,
        typeof emailNotifications
      );

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
          console.log("🚨 Error de registro de Supabase:", error);
          const errorMessage = getErrorMessage(error.message);

          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              loading: false,
              // Preservar authInitialized - no cambiarlo durante errores de registro
              initialized: state.authInitialized,
            },
          });

          // Establecer error en el modal global
          setAuthModalError(errorMessage);

          return {
            success: false,
            error: errorMessage,
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
              console.log("👤 Perfil existente encontrado:", profile);

              // Actualizar perfil existente con email y email_notifications
              console.log(
                "📧 Actualizando perfil existente con emailNotifications:",
                emailNotifications
              );
              const updateData = {
                email_notifications: emailNotifications,
              };

              // Solo guardar email si el usuario quiere notificaciones
              if (emailNotifications) {
                updateData.email = email.trim().toLowerCase();
              } else {
                updateData.email = null; // Limpiar email si no quiere notificaciones
              }

              console.log("📧 Datos de actualización:", updateData);
              const { error: updateError } = await supabase
                .from("user_profiles")
                .update(updateData)
                .eq("id", userId);

              if (updateError) {
                console.error(
                  "❌ Error actualizando email en perfil:",
                  updateError
                );
              } else {
                console.log("✅ Email actualizado en perfil existente");
              }
              
              existingProfile = profile;
              break;
            }
            // Si no existe, intentar crear
            if (retries === 0) {
              const profileData = {
                id: userId,
                email: email.trim().toLowerCase(),
                display_name: name.trim(),
                email_notifications: emailNotifications,
                created_at: new Date().toISOString(),
              };

              console.log("👤 Creando perfil de usuario:", profileData);

              const { error: profileError } = await supabase
                .from("user_profiles")
                .insert([profileData]);

              if (profileError) {
                console.error("❌ Error creando perfil:", profileError);
                if (profileError.code !== "23505") {
                  dispatch({
                    type: actions.SET_AUTH_STATE,
                    payload: { loading: false },
                  });
                  return {
                    success: false,
                    error:
                      "Error creando perfil de usuario: " + profileError.message,
                  };
                } else {
                  // Si es error 23505 (duplicado), el perfil ya existe
                  console.log("✅ Perfil ya existe (error 23505), continuando...");
                  existingProfile = { id: userId }; // Marcar como existente
                  break;
                }
              } else {
                // Si no hay error, el perfil fue creado exitosamente
                console.log("✅ Perfil creado exitosamente");
                existingProfile = { id: userId }; // Marcar como existente
                break;
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
      }
    } catch (error) {
        console.error("💥 Registration error inesperado:", error);
        console.error("💥 Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: {
            loading: false,
            // Preservar authInitialized - no cambiarlo durante errores de registro
            initialized: state.authInitialized,
          },
        });

        // Establecer error en el modal global
        setAuthModalError("Error inesperado. Intenta nuevamente.");

        return {
          success: false,
          error: "Error inesperado. Intenta nuevamente.",
        };
      }
    },
    [state.authInitialized, setAuthModalError]
  );

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
      // Agregar más variaciones de errores de login
      "Invalid credentials": "Email o contraseña incorrectos",
      "Wrong email or password": "Email o contraseña incorrectos",
      "Authentication failed": "Email o contraseña incorrectos",
      "Bad Request": "Email o contraseña incorrectos",
    };

    // Logging para debug
    console.log("🐛 Error original de Supabase:", errorMessage);

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

  // ✅ FUNCIONES DE COMENTARIOS
  const getStoryComments = useCallback(async (storyId) => {
    try {
      console.log("📝 Fetching comments for story:", storyId);

      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          user_id,
          story_id,
          parent_id,
          likes_count,
          is_featured,
          created_at,
          updated_at
        `
        )
        .eq("story_id", storyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching comments:", error);
        return { success: false, error: error.message, comments: [] };
      }

      console.log("✅ Comments loaded:", data?.length || 0);
      return { success: true, comments: data || [] };
    } catch (err) {
      console.error("💥 Error fetching comments:", err);
      return { success: false, error: err.message, comments: [] };
    }
  }, []);

  const addComment = useCallback(
    async (storyId, content, parentId = null) => {
      if (!state.isAuthenticated || !state.user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      if (!content?.trim()) {
        return { success: false, error: "El comentario no puede estar vacío" };
      }

      try {
        console.log("📝 Adding comment to story:", storyId);

        const { data, error } = await supabase
          .from("comments")
          .insert({
            story_id: storyId,
            user_id: state.user.id,
            content: content.trim(),
            parent_id: parentId,
          })
          .select(
            `
          id,
          content,
          user_id,
          story_id,
          parent_id,
          likes_count,
          is_featured,
          created_at,
          updated_at
        `
          )
          .single();

        if (error) {
          console.error("❌ Error adding comment:", error);
          return { success: false, error: error.message };
        }

        console.log("✅ Comment added:", data.id);
        return { success: true, comment: data };
      } catch (err) {
        console.error("💥 Error adding comment:", err);
        return { success: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  const deleteComment = useCallback(
    async (commentId) => {
      if (!state.isAuthenticated || !state.user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      try {
        console.log("🗑️ Deleting comment:", commentId);

        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", state.user.id); // Solo el autor puede eliminar

        if (error) {
          console.error("❌ Error deleting comment:", error);
          return { success: false, error: error.message };
        }

        console.log("✅ Comment deleted:", commentId);
        return { success: true };
      } catch (err) {
        console.error("💥 Error deleting comment:", err);
        return { success: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  const toggleCommentLike = useCallback(
    async (commentId) => {
      if (!state.isAuthenticated || !state.user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      try {
        console.log("❤️ Toggling comment like:", commentId);

        // Versión simplificada: solo incrementar/decrementar el contador
        // TODO: Implementar tabla comment_likes para tracking real de usuarios

        // Obtener comentario actual
        const { data: currentComment, error: fetchError } = await supabase
          .from("comments")
          .select("likes_count")
          .eq("id", commentId)
          .single();

        if (fetchError) throw fetchError;

        // Por ahora, simplemente alternar entre incrementar/decrementar
        // En una implementación real, verificaríamos si el usuario ya dio like
        const currentCount = currentComment.likes_count || 0;
        const newCount = currentCount + 1; // Siempre incrementar por ahora

        const { error: updateError } = await supabase
          .from("comments")
          .update({ likes_count: newCount })
          .eq("id", commentId);

        if (updateError) throw updateError;

        console.log("❤️ Comment like toggled");
        return { success: true, liked: true };
      } catch (err) {
        console.error("💥 Error toggling comment like:", err);
        return { success: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  // ✅ FUNCIONES DE REPORTES
  const reportComment = useCallback(
    async (commentId, reason, description = '') => {
      if (!state.isAuthenticated || !state.user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      try {
        console.log("🚩 Reporting comment:", commentId, "Reason:", reason);

        const { error } = await supabase
          .from("reports")
          .insert([{
            reporter_id: state.user.id,
            reported_comment_id: commentId,
            reason,
            description,
            status: 'pending'
          }]);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            return { success: false, error: "Ya has reportado este comentario" };
          }
          throw error;
        }

        console.log("✅ Comment reported successfully");
        return { success: true };
      } catch (err) {
        console.error("💥 Error reporting comment:", err);
        return { success: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  const getReports = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.is_admin) {
      return { success: false, error: "Solo administradores pueden ver reportes" };
    }

    try {
      console.log("📋 Fetching all reports for admin...");

      const { data: reports, error } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:user_profiles!reporter_id(display_name, email),
          reported_comment:comments!reported_comment_id(
            content,
            user_id,
            story_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`📋 Found ${reports?.length || 0} reports`);
      return { success: true, data: reports || [] };
    } catch (err) {
      console.error("💥 Error fetching reports:", err);
      return { success: false, error: err.message };
    }
  }, [state.isAuthenticated, state.user]);

  const updateReportStatus = useCallback(
    async (reportId, status, adminNotes = '') => {
      if (!state.isAuthenticated || !state.user?.is_admin) {
        return { success: false, error: "Solo administradores pueden actualizar reportes" };
      }

      try {
        console.log("🔄 Updating report status:", reportId, "to:", status);

        const updateData = {
          status,
          admin_notes: adminNotes
        };

        if (status === 'resolved' || status === 'dismissed') {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = state.user.id;
        }

        const { error } = await supabase
          .from("reports")
          .update(updateData)
          .eq("id", reportId);

        if (error) throw error;

        console.log("✅ Report status updated successfully");
        return { success: true };
      } catch (err) {
        console.error("💥 Error updating report status:", err);
        return { success: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  // ✅ FUNCIONES DE ADMIN - LIMPIEZA DE DATOS
  const clearAllComments = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.is_admin) {
      return {
        success: false,
        error: "Solo administradores pueden realizar esta acción",
      };
    }

    try {
      console.log("🗑️ Admin: Eliminando todos los comentarios...");

      const { error } = await supabase
        .from("comments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Eliminar todos

      if (error) throw error;

      console.log("✅ Admin: Todos los comentarios eliminados");
      return { success: true };
    } catch (err) {
      console.error("❌ Admin: Error eliminando comentarios:", err);
      return { success: false, error: err.message };
    }
  }, [state.isAuthenticated, state.user]);

  const clearAllStoryLikes = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.is_admin) {
      return {
        success: false,
        error: "Solo administradores pueden realizar esta acción",
      };
    }

    try {
      console.log("🗑️ Admin: Reiniciando contadores de likes...");

      // Reiniciar contadores de likes a 0
      const { error: updateError } = await supabase
        .from("stories")
        .update({ likes_count: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (updateError) throw updateError;

      console.log("✅ Admin: Todos los likes han sido reiniciados a 0");
      return { success: true };
    } catch (err) {
      console.error("❌ Admin: Error reiniciando likes:", err);
      return { success: false, error: err.message };
    }
  }, [state.isAuthenticated, state.user]);

  const clearAllStoryViews = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.is_admin) {
      return {
        success: false,
        error: "Solo administradores pueden realizar esta acción",
      };
    }

    try {
      console.log("🗑️ Admin: Eliminando todas las vistas de historias...");

      // Eliminar registros de vistas (si existe la tabla)
      try {
        const { error: deleteViewsError } = await supabase
          .from("story_views")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteViewsError && deleteViewsError.code !== "42P01") {
          // 42P01 = tabla no existe
          throw deleteViewsError;
        }
      } catch (viewError) {
        console.log(
          "ℹ️ Tabla story_views no existe, solo reiniciando contadores"
        );
      }

      // Reiniciar contadores
      const { error: updateError } = await supabase
        .from("stories")
        .update({ views_count: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (updateError) throw updateError;

      // Limpiar localStorage de vistas
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("view_")) {
          localStorage.removeItem(key);
        }
      });

      console.log("✅ Admin: Todas las vistas eliminadas");
      return { success: true };
    } catch (err) {
      console.error("❌ Admin: Error eliminando vistas:", err);
      return { success: false, error: err.message };
    }
  }, [state.isAuthenticated, state.user]);

  const clearAllTestData = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.is_admin) {
      return {
        success: false,
        error: "Solo administradores pueden realizar esta acción",
      };
    }

    try {
      console.log("🗑️ Admin: Eliminando TODOS los datos de prueba...");

      const commentsResult = await clearAllComments();
      const likesResult = await clearAllStoryLikes();
      const viewsResult = await clearAllStoryViews();

      const errors = [];
      if (!commentsResult.success)
        errors.push(`Comentarios: ${commentsResult.error}`);
      if (!likesResult.success) errors.push(`Likes: ${likesResult.error}`);
      if (!viewsResult.success) errors.push(`Vistas: ${viewsResult.error}`);

      if (errors.length > 0) {
        return { success: false, error: errors.join(", ") };
      }

      console.log("✅ Admin: Todos los datos de prueba eliminados");
      return { success: true };
    } catch (err) {
      console.error("❌ Admin: Error eliminando datos:", err);
      return { success: false, error: err.message };
    }
  }, [
    state.isAuthenticated,
    state.user,
    clearAllComments,
    clearAllStoryLikes,
    clearAllStoryViews,
  ]);

  // ✅ UTILIDAD DE CONTESTS (movida antes para evitar error de inicialización)
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

  // ✅ FUNCIÓN PARA ELIMINAR HISTORIA DE USUARIO
  const deleteUserStory = useCallback(
    async (storyId) => {
      if (!state.isAuthenticated || !state.user?.id) {
        return {
          success: false,
          error: "Debes estar autenticado para eliminar una historia",
        };
      }

      try {
        console.log("🗑️ Eliminando historia del usuario:", storyId);

        // Verificar que la historia pertenece al usuario
        const { data: story, error: fetchError } = await supabase
          .from("stories")
          .select(
            "user_id, contest_id, contests!inner(status, submission_deadline, voting_deadline)"
          )
          .eq("id", storyId)
          .single();

        if (fetchError) {
          console.error("❌ Error verificando historia:", fetchError);
          return { success: false, error: "Historia no encontrada" };
        }

        if (story.user_id !== state.user.id) {
          return {
            success: false,
            error: "No puedes eliminar una historia que no es tuya",
          };
        }

        // Verificar que el concurso esté en período de envío (o que sea admin)
        const contestPhase = getContestPhase(story.contests);
        const isAdmin = state.user?.is_admin;

        if (contestPhase !== "submission" && !isAdmin) {
          return {
            success: false,
            error: `Solo puedes eliminar historias durante el período de envío. Fase actual: ${contestPhase}`,
          };
        }

        // Eliminar la historia
        const { data: deleteData, error: deleteError } = await supabase
          .from("stories")
          .delete()
          .eq("id", storyId)
          .eq("user_id", state.user.id)
          .select();

        if (deleteError) {
          console.error("❌ Error eliminando historia:", deleteError);
          return { success: false, error: "Error al eliminar la historia" };
        }

        // Verificar si realmente se eliminó algo
        if (!deleteData || deleteData.length === 0) {
          return {
            success: false,
            error: "No se pudo eliminar la historia. Verifica los permisos.",
          };
        }

        // Actualizar el estado local eliminando la historia
        dispatch({
          type: actions.SET_USER_STORIES,
          payload: state.userStories.filter((story) => story.id !== storyId),
        });

        // También actualizar galleryStories si está cargada
        if (state.galleryStories.length > 0) {
          dispatch({
            type: actions.SET_GALLERY_STORIES,
            payload: state.galleryStories.filter(
              (story) => story.id !== storyId
            ),
          });
        }

        console.log("✅ Historia eliminada exitosamente");
        return { success: true };
      } catch (err) {
        console.error("❌ Error eliminando historia:", err);
        return {
          success: false,
          error: "Error inesperado al eliminar la historia",
        };
      }
    },
    [
      state.isAuthenticated,
      state.user,
      state.userStories,
      state.galleryStories,
      getContestPhase,
    ]
  );

  // ✅ FUNCIÓN PARA ACTUALIZAR DISPLAY NAME
  const updateDisplayName = useCallback(
    async (newDisplayName) => {
      if (!state.isAuthenticated || !state.user?.id) {
        return {
          success: false,
          error: "Debes estar autenticado para actualizar tu nombre",
        };
      }

      // Validaciones
      if (!newDisplayName || typeof newDisplayName !== "string") {
        return { success: false, error: "El nombre es requerido" };
      }

      const trimmedName = newDisplayName.trim();
      if (trimmedName.length < 2) {
        return {
          success: false,
          error: "El nombre debe tener al menos 2 caracteres",
        };
      }

      if (trimmedName.length > 50) {
        return {
          success: false,
          error: "El nombre no puede tener más de 50 caracteres",
        };
      }

      // Validar caracteres especiales problemáticos
      const invalidChars = /[<>{}[\]\\\/]/;
      if (invalidChars.test(trimmedName)) {
        return {
          success: false,
          error: "El nombre contiene caracteres no válidos",
        };
      }

      try {
        console.log("🔄 Actualizando display_name del usuario:", trimmedName);

        // Actualizar en Supabase
        const { error } = await supabase
          .from("user_profiles")
          .update({ display_name: trimmedName })
          .eq("id", state.user.id);

        if (error) {
          console.error("❌ Error actualizando display_name:", error);
          return { success: false, error: "Error al actualizar el nombre" };
        }

        // Actualizar estado local preservando el estado de auth
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: {
            user: {
              ...state.user,
              display_name: trimmedName,
              name: trimmedName, // También actualizar name para consistencia
            },
            isAuthenticated: true,
            initialized: state.authInitialized, // Preservar authInitialized (el reducer usa 'initialized')
          },
        });

        console.log("✅ Display name actualizado exitosamente");
        return { success: true };
      } catch (err) {
        console.error("❌ Error inesperado actualizando nombre:", err);
        return {
          success: false,
          error: "Error inesperado al actualizar el nombre",
        };
      }
    },
    [state.isAuthenticated, state.user]
  );

  // Cerrar modal automáticamente cuando el usuario se autentica exitosamente
  useEffect(() => {
    if (state.isAuthenticated && state.showAuthModal) {
      console.log(
        "🎉 Usuario autenticado exitosamente, cerrando modal automáticamente"
      );
      closeAuthModal();
    }
  }, [state.isAuthenticated, state.showAuthModal, closeAuthModal]);

  // ✅ UTILIDADES DE CONTESTS

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

    // Funciones de comentarios
    getStoryComments,
    addComment,
    deleteComment,
    toggleCommentLike,

    // Funciones de reportes
    reportComment,
    getReports,
    updateReportStatus,

    // Funciones de admin
    clearAllComments,
    clearAllStoryLikes,
    clearAllStoryViews,
    clearAllTestData,

    // Funciones de usuario
    deleteUserStory,
    updateDisplayName,

    // Funciones de Auth Modal
    openAuthModal,
    closeAuthModal,
    setAuthModalError,
    clearAuthModalErrors,

    // Funciones de Cookie Consent
    setCookieConsent,
    showCookieBannerAgain,
    resetCookieConsent,

    // Utilidades
    getContestPhase,
    getContestById,
    debugAuth,

    // Dispatch para casos especiales
    dispatch,
  };

  return (
    <GlobalAppContext.Provider value={contextValue}>
      {children}
    </GlobalAppContext.Provider>
  );
}

// Función para determinar si un concurso es de prueba
const isTestContest = (contest) => {
  if (!contest?.title) return false;
  const title = contest.title.toLowerCase();
  return title.includes('test') || title.includes('prueba') || title.includes('demo');
};

// Función para encontrar el concurso actual con lógica híbrida
const findCurrentContest = (contests) => {
  if (!contests || contests.length === 0) return null;
  
  const now = new Date();
  
  // Separar concursos de prueba y producción
  const testContests = contests.filter(contest => 
    isTestContest(contest) && contest.finalized_at === null
  );
  const productionContests = contests.filter(contest => 
    !isTestContest(contest) && contest.finalized_at === null
  );
  
  console.log(`🔍 Concursos de prueba activos: ${testContests.length}`);
  console.log(`🔍 Concursos de producción activos: ${productionContests.length}`);
  
  // PRIORIDAD 1: Concursos de prueba (más reciente)
  if (testContests.length > 0) {
    const current = testContests
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    console.log(`🎭 Usando concurso de prueba: "${current.title}"`);
    return current;
  }
  
  // PRIORIDAD 2: Concursos de producción (por fechas)
  if (productionContests.length > 0) {
    // Buscar concursos que deberían estar activos ahora
    const activeNow = productionContests.filter(contest => {
      const submissionDeadline = new Date(contest.submission_deadline);
      const votingDeadline = new Date(contest.voting_deadline);
      
      // El concurso está activo si aún no ha terminado la votación
      return now <= votingDeadline;
    });
    
    if (activeNow.length > 0) {
      // Ordenar por fecha de submission (el que debería empezar primero)
      const current = activeNow
        .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))[0];
      console.log(`🏗️ Usando concurso de producción: "${current.title}"`);
      return current;
    }
    
    // Si no hay concursos activos por fecha, usar el más reciente
    const current = productionContests
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    console.log(`🏗️ Usando concurso de producción (fallback): "${current.title}"`);
    return current;
  }
  
  // FALLBACK: Cualquier concurso disponible
  const fallback = contests.find(contest => 
    contest.status === "active" || 
    contest.status === "submission" || 
    contest.status === "voting"
  ) || contests[0] || null;
  
  if (fallback) {
    console.log(`🔄 Usando concurso fallback: "${fallback.title}"`);
  }
  
  return fallback;
};

// ✅ HOOK PRINCIPAL
export function useGlobalApp() {
  const context = useContext(GlobalAppContext);
  if (!context) {
    throw new Error("useGlobalApp debe usarse dentro de GlobalAppProvider");
  }
  return context;
}
