// contexts/GlobalAppContext.jsx - CONTEXTO COMPLETAMENTE UNIFICADO Y COMPLETO
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import logger, { devLog } from "../lib/logger";
import { SITE_CONFIG } from "../lib/config";

// ✅ ESTADO INICIAL COMPLETO
const initialState = {
  // Auth State
  user: null,
  isAuthenticated: false,
  authLoading: false,
  authInitialized: false,
  isPasswordResetPending: false, // 🛡️ Estado para reset password temporal

  // Contests State
  contests: [],
  currentContest: null,
  nextContest: null,
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
  resetPasswordSuccess: false,

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
  
  // Cache de retos finalizados
  finishedContestsCache: {},
  finishedContestsCacheTimestamp: null,
  
  // Cache de historias individuales de retos cerrados
  finishedStoriesCache: {},
  finishedStoriesCacheTimestamp: null,
  
  // Estadísticas globales con cache
  globalStats: {
    totalUsers: null,
    totalStories: null,
    totalWords: null,
    lastUpdated: null,
  },
  globalStatsLoading: false,
  
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
  SET_NEXT_CONTEST: "SET_NEXT_CONTEST",
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
  
  // Password Reset Security
  SET_PASSWORD_RESET_PENDING: "SET_PASSWORD_RESET_PENDING",

  // Cookie Consent
  SET_COOKIE_CONSENT: "SET_COOKIE_CONSENT",
  SET_SHOW_COOKIE_BANNER: "SET_SHOW_COOKIE_BANNER",

  // Cache de retos finalizados
  SET_FINISHED_CONTESTS_CACHE: "SET_FINISHED_CONTESTS_CACHE",
  CLEAR_FINISHED_CONTESTS_CACHE: "CLEAR_FINISHED_CONTESTS_CACHE",
  
  // Cache de historias individuales
  SET_FINISHED_STORIES_CACHE: "SET_FINISHED_STORIES_CACHE",
  CLEAR_FINISHED_STORIES_CACHE: "CLEAR_FINISHED_STORIES_CACHE",

  // Estadísticas globales
  SET_GLOBAL_STATS: "SET_GLOBAL_STATS",
  SET_GLOBAL_STATS_LOADING: "SET_GLOBAL_STATS_LOADING",
  INVALIDATE_GLOBAL_STATS: "INVALIDATE_GLOBAL_STATS",

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
      // Recalcular currentContestVotes cuando cambia el reto actual
      let newCurrentContestVotes = 0;
      if (action.payload && state.votingStats.userVotedStories.length > 0) {
        // Contar votos que pertenecen al nuevo reto actual
        newCurrentContestVotes = state.votingStats.userVotedStories.filter(
          vote => {
            // Buscar si este voto pertenece al nuevo reto actual
            // Necesitamos verificar via contestId si está disponible
            return vote.contestId === action.payload.id;
          }
        ).length;
      }
      
      return { 
        ...state, 
        currentContest: action.payload,
        votingStats: {
          ...state.votingStats,
          currentContestVotes: newCurrentContestVotes
        }
      };

    case actions.SET_NEXT_CONTEST:
      return { ...state, nextContest: action.payload };

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
        // Invalidar stats cuando se agrega una nueva historia
        globalStats: {
          ...state.globalStats,
          lastUpdated: null, // Forzar recarga en próxima consulta
        },
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
    
    case actions.SET_FINISHED_CONTESTS_CACHE:
      return {
        ...state,
        finishedContestsCache: {
          ...state.finishedContestsCache,
          ...action.payload.cache,
        },
        finishedContestsCacheTimestamp: action.payload.timestamp,
      };
    
    case actions.CLEAR_FINISHED_CONTESTS_CACHE:
      return {
        ...state,
        finishedContestsCache: {},
        finishedContestsCacheTimestamp: null,
      };
    
    case actions.SET_FINISHED_STORIES_CACHE:
      return {
        ...state,
        finishedStoriesCache: {
          ...state.finishedStoriesCache,
          ...action.payload.cache,
        },
        finishedStoriesCacheTimestamp: action.payload.timestamp,
      };
    
    case actions.CLEAR_FINISHED_STORIES_CACHE:
      return {
        ...state,
        finishedStoriesCache: {},
        finishedStoriesCacheTimestamp: null,
      };

    case actions.SET_GLOBAL_STATS:
      return {
        ...state,
        globalStats: {
          ...action.payload,
          lastUpdated: Date.now(),
        },
        globalStatsLoading: false,
      };

    case actions.SET_GLOBAL_STATS_LOADING:
      return {
        ...state,
        globalStatsLoading: action.payload,
      };

    case actions.INVALIDATE_GLOBAL_STATS:
      return {
        ...state,
        globalStats: {
          ...state.globalStats,
          lastUpdated: null, // Forzar recarga
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
        resetPasswordSuccess:
          action.payload.resetSuccess !== undefined
            ? action.payload.resetSuccess
            : state.resetPasswordSuccess,
      };

    case actions.SET_PASSWORD_RESET_PENDING:
      return {
        ...state,
        isPasswordResetPending: action.payload,
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
  
  // ✅ REF PARA ESTADO ACTUAL - Evita recreaciones de useCallback
  const stateRef = useRef(state);
  stateRef.current = state;
  
  // ✅ FLAG PARA DISTINGUIR REFRESH POR VISIBILITY DE LOGIN REAL
  const isRefreshingFromVisibility = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ LISTENER PARA DETECTAR CAMBIO DE PESTAÑA Y RECUPERAR SESIÓN
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && stateRef.current.isAuthenticated) {
        console.log("👁️ Pestaña visible - verificando sesión después de cambio de pestaña");
        
        // Verificar si la sesión sigue siendo válida
        const sessionResult = await verifyAndRecoverSession();
        if (!sessionResult.success) {
          console.warn("⚠️ Sesión perdida después de cambio de pestaña, intentando recargar datos");
          
          // Si hay un usuario autenticado pero sin sesión válida, intentar recargar datos críticos
          if (stateRef.current.user?.id && stateRef.current.currentContest?.id) {
            console.log("🔄 Recargando datos críticos tras recuperación de sesión");
            
            // Recargar historias de galería si estamos en la página del concurso
            if (window.location.pathname.includes('/contest')) {
              console.log("📚 Recargando historias de galería tras cambio de pestaña");
              await loadGalleryStories({ contestId: stateRef.current.currentContest.id });
            }
          }
        } else {
          console.log("✅ Sesión válida después de cambio de pestaña");
          
          // Marcar que vamos a hacer refresh por visibility para evitar recargas innecesarias
          isRefreshingFromVisibility.current = true;
          
          try {
            console.log("🔄 Haciendo refresh preventivo de sesión");
            await supabase.auth.refreshSession();
            console.log("✅ Refresh preventivo completado");
          } catch (error) {
            console.warn("⚠️ Error en refresh preventivo:", error);
            isRefreshingFromVisibility.current = false; // Resetear flag si falla
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Sin dependencias para evitar recreación

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
          logger.error('AUTH', 'Error getting session:', error);
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
            logger.warn('AUTH', 'Error fetching user profile:', profileError);

            // Forzar logout en errores de autorización
            if (profileError.status === 401 || profileError.status === 403) {
              logger.warn('AUTH', 'Authorization error, forcing logout');
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

        // ✅ LISTENER SIMPLIFICADO PARA DETECTAR CUANDO EL USUARIO REGRESA A LA TAB
        const handleVisibilityChange = async () => {
          // Solo log mínimo para evitar re-renders
          if (document.visibilityState === 'visible') {
            console.log("👁️ Usuario regresó a la tab");
            
            // Esperar que el navegador se estabilice antes de hacer verificaciones
            setTimeout(async () => {
              try {
                // Solo verificar sesión si está autenticado
                if (state.isAuthenticated) {
                  const { data: { session }, error } = await supabase.auth.getSession();
                  
                  if (error || !session) {
                    console.warn("⚠️ Sesión perdida, intentando recuperar...");
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    
                    if (refreshError || !refreshData.session) {
                      console.error("❌ No se pudo recuperar la sesión");
                      // NO forzar logout aquí para evitar re-renders
                    } else {
                      console.log("✅ Sesión recuperada exitosamente");
                    }
                  }
                }
              } catch (error) {
                console.error("💥 Error verificando sesión:", error);
              }
            }, 1000); // Esperar más tiempo para evitar conflictos
          }
        };

        // TEMPORALMENTE DESHABILITADO para debugging
        // document.addEventListener('visibilitychange', handleVisibilityChange);

        // Configurar listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("🔄 Auth state changed:", event);

            // Solo procesar SIGNED_IN si no es parte de la inicialización
            if (event === "SIGNED_IN" && session?.user) {
              // 🛡️ DETECTAR FLUJO DE RESET PASSWORD
              // LOGS YA HABILITADOS GLOBALMENTE
              
              // Si estamos en /reset-password, SIEMPRE bloquear autenticación
              const isResetPasswordFlow = window.location.pathname === '/reset-password';
              
              // TAMBIÉN detectar si estamos en la raíz con tokens (caso problemático)
              const isRootWithTokens = window.location.pathname === '/' && 
                                      (window.location.hash.includes('access_token') || 
                                       window.location.search.includes('access_token'));
              
              // DETECTAR si estamos en raíz con parámetro rp=1 (reset password)
              const isRootWithResetMode = window.location.pathname === '/' && 
                                         window.location.search.includes('rp=1');
              
              
              if (isResetPasswordFlow || isRootWithTokens || isRootWithResetMode) {
                sessionStorage.setItem('password_reset_pending', 'true');
                sessionStorage.setItem('reset_user_id', session.user.id);
                dispatch({
                  type: actions.SET_PASSWORD_RESET_PENDING,
                  payload: true,
                });
                
                // Si estamos en la raíz con tokens o con mode=reset-password, redirigir
                if (isRootWithTokens || isRootWithResetMode) {
                  // Remover rp=1 del query string y mantener solo los tokens
                  let cleanSearch = window.location.search.replace('rp=1', '').replace('&rp=1', '').replace('?rp=1&', '?').replace('?rp=1', '');
                  if (cleanSearch === '?' || cleanSearch === '&') cleanSearch = '';
                  
                  const newUrl = '/reset-password' + window.location.hash + cleanSearch;
                  window.location.replace(newUrl);
                  return;
                }
                
                // SEGURIDAD: Si estamos en reset-password, NO continuar con autenticación
                return;
              }
              
              // ✅ VERIFICAR SI ES REFRESH POR VISIBILITY (evitar recargas innecesarias)
              if (isRefreshingFromVisibility.current) {
                console.log("✅ SIGNED_IN por refresh de visibility - omitiendo recarga");
                isRefreshingFromVisibility.current = false; // Resetear flag
                return;
              }
              
              // Verificar si es el mismo usuario Y si los datos ya fueron cargados completamente
              if (state.user && 
                  state.user.id === session.user.id && 
                  !state.userStoriesLoading && 
                  state.authInitialized) {
                console.log(
                  "🔄 SIGNED_IN event - mismo usuario con datos ya cargados, saltando"
                );
                return;
              }
              console.log(
                "🔄 SIGNED_IN event - usuario nuevo o datos no cargados, cargando..."
              );
              
              // Procesar el SIGNED_IN igual que INITIAL_SESSION para cargar datos del usuario
              const { data: profile, error: profileError } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: profile?.display_name || session.user.user_metadata?.name,
                display_name: profile?.display_name,
                avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                created_at: profile?.created_at || session.user.created_at,
                is_admin: profile?.is_admin || false,
                ...profile,
              };

              dispatch({
                type: actions.SET_AUTH_STATE,
                payload: {
                  user: userData,
                  isAuthenticated: true,
                  authLoading: false,
                  authInitialized: true,
                },
              });

              // Cargar datos del usuario inmediatamente
              console.log("🔄 Cargando datos del usuario después de SIGNED_IN");
              const loadWithTimeout = async (loadFn, name, ...args) => {
                const timeoutId = setTimeout(() => {
                  console.warn(`⚠️ ${name} está tardando más de lo esperado...`);
                }, 3000);
                try {
                  await loadFn(...args);
                  clearTimeout(timeoutId);
                } catch (error) {
                  clearTimeout(timeoutId);
                  console.error(`❌ Error loading ${name}:`, error);
                }
              };
              
              await Promise.all([
                loadWithTimeout(loadUserStories, "userStories", userData.id),
                loadWithTimeout(loadVotingStats, "votingStats", userData.id),
              ]);
              console.log("✅ Proceso de SIGNED_IN completado");
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
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
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

        // 4. Cargar estadísticas globales en la inicialización se hace después
        console.log("📊 Preparando carga de estadísticas globales...");

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

      // Encontrar reto actual con lógica híbrida
      const current = findCurrentContest(processedContests);
      
      // Encontrar el siguiente reto
      const next = findNextContest(processedContests, current);

      if (isMounted.current) {
        dispatch({ type: actions.SET_CONTESTS, payload: processedContests });
        dispatch({ type: actions.SET_CURRENT_CONTEST, payload: current });
        dispatch({ type: actions.SET_NEXT_CONTEST, payload: next });
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

  // ✅ FUNCIÓN HELPER PARA VERIFICAR Y RECUPERAR SESIÓN
  const verifyAndRecoverSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn("⚠️ Sesión inválida, intentando recuperar...", error);
        
        // Si no hay sesión, no intentar operaciones que requieren auth
        if (!stateRef.current.isAuthenticated || !stateRef.current.user) {
          console.log("ℹ️ Usuario no autenticado, no intentando recuperar sesión");
          return { success: false, session: null };
        }
        
        // Intentar refresh solo si el usuario debería estar autenticado
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error("❌ No se pudo recuperar la sesión, forzando logout");
          // Forzar logout en el estado
          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: {
              user: null,
              isAuthenticated: false,
              authLoading: false,
              authInitialized: true,
            },
          });
          return { success: false, session: null };
        }
        
        console.log("✅ Sesión recuperada exitosamente");
        return { success: true, session: refreshData.session };
      }
      
      return { success: true, session };
    } catch (error) {
      console.error("💥 Error verificando sesión:", error);
      return { success: false, session: null };
    }
  }, []); // Sin dependencias - usa stateRef.current para acceso directo

  const loadUserStories = useCallback(async (userId) => {
    if (!userId || !isMounted.current) return;

    console.log("🔄 loadUserStories iniciando para:", userId);
    dispatch({ type: actions.SET_USER_STORIES_LOADING, payload: true });

    // ✅ VERIFICAR SESIÓN ANTES DE CARGAR DATOS
    if (state.isAuthenticated) {
      const sessionCheck = await verifyAndRecoverSession();
      if (!sessionCheck.success) {
        console.warn("⚠️ Sesión inválida al cargar userStories, abortando");
        dispatch({ type: actions.SET_USER_STORIES_LOADING, payload: false });
        return;
      }
    }

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

      // 📖 Obtener conteo de lecturas para cada historia de concurso
      const storiesWithReads = await Promise.all(
        (stories || []).map(async (story) => {
          let reads_count = 0;

          // Solo obtener lecturas si tiene contest_id
          if (story.contest_id) {
            try {
              const { data: readMetrics } = await supabase.rpc(
                'get_contest_reading_metrics',
                { p_contest_id: story.contest_id }
              );

              const storyReads = readMetrics?.find(m => m.story_id === story.id);
              reads_count = storyReads?.read_count || 0;
            } catch (err) {
              console.error(`Error obteniendo lecturas para historia ${story.id}:`, err);
            }
          }

          return {
            ...story,
            reads_count,
            likes_count: story.likes_count || 0,
            views_count: story.views_count || 0,
            word_count: story.word_count || 0,
            excerpt: story.content
              ? story.content.substring(0, 200) + "..."
              : "Sin contenido disponible",
            readTime: Math.ceil((story.word_count || 0) / 200) + " min",
            // Incluir información del reto para poder verificar su estado
            contest: story.contests ? {
              id: story.contests.id,
              title: story.contests.title,
              status: story.contests.status,
              month: story.contests.month,
              category: story.contests.category,
              submission_deadline: story.contests.submission_deadline,
              voting_deadline: story.contests.voting_deadline
            } : null
          };
        })
      );

      if (isMounted.current) {
        dispatch({ type: actions.SET_USER_STORIES, payload: storiesWithReads });
        console.log(
          "✅ loadUserStories completado, historias cargadas:",
          storiesWithReads.length
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
  }, [verifyAndRecoverSession, state.isAuthenticated]);

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
            contestId: vote.stories?.contest_id,
            contestTitle: vote.stories?.contests?.title || "Concurso",
            contestMonth: vote.stories?.contests?.month || "Mes",
            votedAt: vote.created_at,
          })) || [];

        // Contar votos en reto actual - mejorado para debug
        let currentContestVotes = 0;
        if (state.currentContest && allVotes) {
          currentContestVotes = allVotes.filter(
            (vote) => vote.stories?.contest_id === state.currentContest.id
          ).length;
          
          console.log("🔍 Debug contador de votos:", {
            currentContestId: state.currentContest.id,
            currentContestTitle: state.currentContest.title,
            totalVotesFromDB: allVotes.length,
            votesInCurrentContest: currentContestVotes,
            allVotesContestIds: allVotes.map(v => ({
              storyId: v.story_id, 
              contestId: v.stories?.contest_id,
              contestTitle: v.stories?.contests?.title
            }))
          });
        } else {
          console.log("⚠️ No se puede contar votos del reto actual:", {
            hasCurrentContest: !!state.currentContest,
            hasVotes: !!allVotes,
            votesLength: allVotes?.length || 0
          });
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
            "✅ loadVotingStats completado:",
            {
              totalVotos: votingStats.userVotesCount,
              votosEnConcursoActual: votingStats.currentContestVotes,
              retoActual: state.currentContest?.title || 'No definido'
            }
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

  const getStoriesByContest = useCallback(async (contestId, forceRefresh = false) => {
    if (!contestId) {
      return { success: false, error: "ID de reto requerido" };
    }

    // ✅ VERIFICAR CACHÉ PARA CONCURSOS CERRADOS
    if (!forceRefresh && state.finishedContestsCache[contestId]) {
      return state.finishedContestsCache[contestId];
    }

    try {
      console.log("🔍 Buscando historias para reto:", contestId);

      // Primero obtener las historias básicas
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("contest_id", contestId)
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: true });

      if (storiesError) {
        console.error("❌ Error fetching stories:", storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log("ℹ️ No se encontraron historias para este reto");
        return { success: true, stories: [] };
      }

      console.log("✅ Historias encontradas:", stories.length);

      // Obtener información de los usuarios (filtrar nulls)
      const userIds = [...new Set(stories.map((story) => story.user_id).filter(id => id !== null))];
      
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);

      if (usersError) {
        console.warn("⚠️ Error fetching user profiles:", usersError);
      }

      // Obtener información del reto
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
          // Datos del reto
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

      // ✅ PREPARAR RESULTADO
      const result = { success: true, stories: processedStories };

      // ✅ GUARDAR EN CACHÉ SI EL CONCURSO ESTÁ CERRADO
      if (contest && contest.status === "results") {
        console.log("💾 Guardando reto cerrado en caché:", contestId);
        dispatch({
          type: actions.SET_FINISHED_CONTESTS_CACHE,
          payload: {
            cache: { [contestId]: result },
            timestamp: Date.now(),
          },
        });
      }

      return result;
    } catch (err) {
      console.error("💥 Error fetching stories:", err);
      return {
        success: false,
        error: err.message || "Error al cargar las historias",
      };
    }
  }, [state.finishedContestsCache, dispatch]);

  const getStoryById = useCallback(async (storyId, forceRefresh = false) => {
    if (!storyId) {
      return { success: false, error: "ID de historia requerido" };
    }

    // ✅ VERIFICAR CACHÉ PARA HISTORIAS DE CONCURSOS CERRADOS
    if (!forceRefresh && state.finishedStoriesCache[storyId]) {
      return state.finishedStoriesCache[storyId];
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

      // Obtener información del reto
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
        // Formatear datos del reto
        contest: {
          id: story.contest_id,
          title: contest?.title || "Concurso",
          description: contest?.description || "Sin descripción",
          month: contest?.month || "Mes",
          category: contest?.category || "Ficción",
          status: contest?.status || "unknown",
        },
      };

      // ✅ PREPARAR RESULTADO
      const result = { success: true, story: processedStory };

      // ✅ GUARDAR EN CACHÉ SI ES DE UN CONCURSO CERRADO
      if (contest && contest.status === "results") {
        console.log("💾 Guardando historia de reto cerrado en caché:", storyId);
        dispatch({
          type: actions.SET_FINISHED_STORIES_CACHE,
          payload: {
            cache: { [storyId]: result },
            timestamp: Date.now(),
          },
        });
      }

      return result;
    } catch (err) {
      console.error("💥 Error fetching story:", err);
      return {
        success: false,
        error: err.message || "Error al cargar la historia",
      };
    }
  }, [state.finishedStoriesCache, dispatch]);

  const recordStoryView = useCallback(
    async (storyId) => {
      if (!storyId) {
        return { success: false, error: "ID de historia requerido" };
      }

      try {
        const isAuthenticated = !!stateRef.current.user?.id;
        const today = new Date().toISOString().split("T")[0];
        console.log(
          "📊 Registrando vista para historia:",
          storyId,
          isAuthenticated ? "(usuario registrado)" : "(visitante)",
          "fecha:",
          today
        );

        // Verificar si ya se contó una vista hoy para este usuario/historia
        const viewKey = `view_${storyId}_${stateRef.current.user?.id || "anon"}_${today}`;
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
            if (stateRef.current.currentContest?.id) {
              console.log(
                "⏰ Recargando galleryStories para sincronización de vistas"
              );
              await loadGalleryStories({ contestId: stateRef.current.currentContest.id });
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
    [] // Sin dependencias - usa stateRef.current
  );

  const checkUserLike = useCallback(
    async (storyId) => {
      if (!stateRef.current.user || !storyId) {
        console.log("🚫 checkUserLike: Sin usuario o storyId");
        return { success: true, liked: false };
      }

      try {
        console.log("🔍 Verificando like:", {
          userId: stateRef.current.user.id,
          storyId,
        });

        const { data, error } = await supabase
          .from("votes")
          .select("*")  // Seleccionar todo para debug
          .eq("story_id", storyId)
          .eq("user_id", stateRef.current.user.id);

        if (error) {
          console.warn("⚠️ Error checking vote:", error);
          return { success: true, liked: false };
        }

        const hasLiked = data && data.length > 0;
        console.log("❤️ Resultado verificación like:", {
          hasLiked,
          votesFound: data?.length,
          votesData: data,
          queryParams: {
            story_id: storyId,
            user_id: stateRef.current.user.id
          }
        });

        return { success: true, liked: hasLiked };
      } catch (err) {
        console.warn("💥 Error inesperado checking vote:", err);
        return { success: true, liked: false };
      }
    },
    [] // Sin dependencias - usa stateRef.current
  );

  // ✅ NUEVA FUNCIÓN: Obtener conteo de votos del usuario en un reto
  const getUserVoteCount = useCallback(
    async (contestId) => {
      if (!state.user?.id || !contestId) {
        return { success: true, count: 0 };
      }

      try {
        // Primero obtenemos las IDs de las historias del reto
        const { data: stories, error: storiesError } = await supabase
          .from("stories")
          .select("id")
          .eq("contest_id", contestId);

        if (storiesError) throw storiesError;

        if (!stories || stories.length === 0) {
          return { success: true, count: 0 };
        }

        // Luego contamos los votos del usuario en esas historias
        const storyIds = stories.map(story => story.id);
        const { data: votes, error: votesError } = await supabase
          .from("votes")
          .select("id", { count: "exact" })
          .eq("user_id", state.user.id)
          .in("story_id", storyIds);

        if (votesError) throw votesError;

        console.log("🗳️ Conteo de votos del usuario:", {
          contestId,
          userId: state.user.id,
          totalStories: stories.length,
          userVotes: votes?.length || 0
        });

        return { success: true, count: votes?.length || 0 };
      } catch (err) {
        console.error("Error contando votos del usuario:", err);
        return { success: false, count: 0, error: err.message };
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
        // Obtener la historia para saber el reto
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

        // Obtener información del reto
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", story.contest_id)
          .single();

        if (contestError) {
          return { canVote: false, reason: "Concurso no encontrado" };
        }

        // ✅ CORREGIDO: Usar la función getContestPhase ya corregida
        const currentPhase = getContestPhase(contest);

        if (currentPhase === "submission") {
          return {
            canVote: false,
            reason: "La votación aún no ha comenzado",
            phase: "submission",
            votingStartsAt: new Date(contest.submission_deadline),
          };
        } else if (currentPhase === "results") {
          return {
            canVote: false,
            reason: "La votación ha terminado",
            phase: "results",
          };
        } else if (currentPhase === "counting") {
          return {
            canVote: false,
            reason: "La votación ha cerrado automáticamente",
            phase: "counting",
          };
        } else {
          // Fase de votación - verificar límite de 3 votos SOLO para reto actual
          if (state.user?.id) {
            // ✅ SEGURIDAD: Solo aplicar límite de 3 votos si es el reto actual
            const isCurrentContest = story.contest_id === state.currentContest?.id;
            // Verificar si ya votó por esta historia
            const { data: existingVote, error: voteError } = await supabase
              .from("votes")
              .select("id")
              .eq("story_id", storyId)
              .eq("user_id", state.user.id)
              .single();

            if (voteError && voteError.code !== "PGRST116") {
              console.warn("Error verificando voto existente:", voteError);
            }

            // Si ya votó por esta historia, puede quitar el voto
            if (existingVote) {
              return {
                canVote: true,
                reason: "Puedes quitar tu voto",
                phase: "voting",
                votingEndsAt: new Date(contest.voting_deadline),
                hasVoted: true,
              };
            }

            // Si no ha votado por esta historia, verificar límite de 3 votos SOLO para reto actual
            if (isCurrentContest) {
              const voteCountResult = await getUserVoteCount(contest.id);
              const currentVotes = voteCountResult.count || 0;

              if (currentVotes >= 3) {
                return {
                  canVote: false,
                  reason: `Has usado todos tus votos (${currentVotes}/3). Quita un voto existente para votar por otra historia.`,
                  phase: "voting",
                  votingEndsAt: new Date(contest.voting_deadline),
                  votesUsed: currentVotes,
                  maxVotes: 3,
                };
              }

              return {
                canVote: true,
                reason: "Votación activa",
                phase: "voting",
                votingEndsAt: new Date(contest.voting_deadline),
                votesUsed: currentVotes,
                maxVotes: 3,
                votesRemaining: 3 - currentVotes,
              };
            } else {
              // Concursos pasados: votación ilimitada (mantener comportamiento original)
              return {
                canVote: true,
                reason: "Votación activa",
                phase: "voting",
                votingEndsAt: new Date(contest.voting_deadline),
              };
            }
          }

          // Usuario no autenticado
          return {
            canVote: true,
            reason: "Votación activa",
            phase: "voting",
            votingEndsAt: new Date(contest.voting_deadline),
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

      // ✅ VERIFICAR SESIÓN ANTES DE CARGAR DATOS (aunque no requiera auth)
      // Esto ayuda a detectar problemas de sesión temprano
      if (state.isAuthenticated) {
        const sessionCheck = await verifyAndRecoverSession();
        if (!sessionCheck.success) {
          console.warn("⚠️ Sesión inválida al cargar galleryStories");
          // No abortar completamente, pero logear el problema
        }
      }

      try {
        console.log("🔍 Cargando historias para galería:", filters);

        // ✅ OPTIMIZACIÓN: Durante votación ciega, no cargar likes_count y views_count
        const isBlindVoting = filters.blindVoting === true;
        const selectFields = isBlindVoting 
          ? "id, title, content, user_id, contest_id, created_at, updated_at, word_count, is_mature"
          : "*";
          
        if (isBlindVoting) {
          console.log("🤐 Votación ciega: cargando solo campos esenciales");
        }

        // Construir query básico
        let query = supabase.from("stories").select(selectFields);

        // Aplicar filtros básicos
        if (filters.contestId) {
          query = query.eq("contest_id", filters.contestId);
        }

        // Ordenamiento
        switch (filters.sortBy) {
          case "popular":
            query = query.order("likes_count", { ascending: false })
                        .order("created_at", { ascending: true });
            break;
          case "liked":
            query = query.order("likes_count", { ascending: false })
                        .order("created_at", { ascending: true });
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

        // DEBUG: Log del ordenamiento desde contexto global
        if (filters.sortBy === "popular") {
          console.log("🔍 DEBUG Contexto - Historias ordenadas por popular:");
          stories.slice(0, 5).forEach((story, i) => {
            console.log(`  ${i + 1}. "${story.title?.substring(0, 20)}..." - ${story.likes_count} votos - ${story.created_at?.substring(0, 19)}`);
          });
        }

        // 🆕 CARGAR CONTEO DE LECTURAS si includeReadCount está activado
        let readCounts = {};
        if (filters.includeReadCount && filters.contestId) {
          console.log("📖 Cargando conteo de lecturas...");
          try {
            const { data: readMetrics, error: readError } = await supabase.rpc(
              'get_contest_reading_metrics',
              { p_contest_id: filters.contestId }
            );

            if (!readError && readMetrics) {
              // Crear un map de story_id -> read_count para fácil acceso
              readCounts = readMetrics.reduce((acc, metric) => {
                acc[metric.story_id] = metric.read_count || 0;
                return acc;
              }, {});
              console.log(`✅ Lecturas cargadas para ${Object.keys(readCounts).length} historias`);
            } else if (readError) {
              console.error("⚠️ Error cargando conteo de lecturas:", readError);
            }
          } catch (err) {
            console.error("❌ Error en get_contest_reading_metrics:", err);
          }
        }

        // Obtener información de los usuarios (filtrar nulls)
        const userIds = [...new Set(stories.map((story) => story.user_id).filter(id => id !== null))];
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("*")
          .in("id", userIds);

        // Obtener información de los retos
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
            reads_count: readCounts[story.id] || 0, // 🆕 Conteo de lecturas
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
    [state.user?.id, verifyAndRecoverSession, state.isAuthenticated]
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
        // Verificar reto existe
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", storyData.contestId)
          .single();

        if (contestError) throw new Error("Concurso no encontrado");

        // Verificar no hay historia duplicada
        const { data: existingStories, error: checkError } = await supabase
          .from("stories")
          .select("id")
          .eq("contest_id", storyData.contestId)
          .eq("user_id", state.user.id);

        if (checkError) throw checkError;
        if (existingStories && existingStories.length > 0)
          throw new Error("Ya has enviado una historia para este reto");

        // Insertar historia
        const storyToInsert = {
          title: storyData.title.trim(),
          content: storyData.content.trim(),
          word_count: storyData.wordCount,
          user_id: state.user.id,
          contest_id: storyData.contestId,
          is_mature: storyData.hasMatureContent || false,
          story_category: storyData.storyCategory || 'ficcion',
          published_at: new Date().toISOString(),
        };

        const { data: newStory, error: insertError } = await supabase
          .from("stories")
          .insert([storyToInsert])
          .select("*")
          .single();

        if (insertError) throw insertError;

        // Agregar al estado local con la misma estructura que loadUserStories
        const processedStory = {
          ...newStory,
          likes_count: 0,
          views_count: 0,
          excerpt: newStory.content.substring(0, 200) + "...",
          readTime: Math.ceil(newStory.word_count / 200) + " min",
          contest: contest ? {
            id: contest.id,
            title: contest.title,
            status: contest.status,
            month: contest.month,
            category: contest.category,
            submission_deadline: contest.submission_deadline,
            voting_deadline: contest.voting_deadline
          } : null
        };

        dispatch({ type: actions.ADD_USER_STORY, payload: processedStory });

        // Actualizar contador de participantes en reto actual
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

        // Verificar y otorgar badges automáticamente
        try {
          const { data: newBadges, error: badgeError } = await supabase.rpc('check_and_award_badges', {
            target_user_id: state.user.id
          });
          
          if (!badgeError && newBadges && newBadges.length > 0) {
            console.log('🏆 Nuevos badges otorgados:', newBadges);
            // Aquí podrías mostrar una notificación de badge si implementas el componente
          }
        } catch (badgeErr) {
          console.warn('Error checking badges:', badgeErr);
          // No fallar la publicación por errores de badges
        }

        return {
          success: true,
          story: processedStory,
          storyId: newStory.id, // Agregar el ID de la historia creada
          message: "¡Tu historia ha sido enviada exitosamente al reto!",
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
        return { success: false, error: "Debes iniciar sesión para votar" };
      }

      // ✅ VERIFICAR SESIÓN ACTUAL ANTES DE REALIZAR OPERACIÓN
      console.log("🗳️ Iniciando toggleLike para story:", storyId, "user:", state.user?.id);
      const sessionCheck = await verifyAndRecoverSession();
      if (!sessionCheck.success) {
        console.error("❌ toggleLike: Verificación de sesión falló");
        return { success: false, error: "Sesión expirada. Por favor, recarga la página e inicia sesión nuevamente." };
      }
      console.log("✅ toggleLike: Sesión verificada correctamente");

      try {
        // Verificar si existe el voto
        console.log("🔍 Verificando voto existente...");
        const { data: existingVote, error: checkError } = await supabase
          .from("votes")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", state.user.id)
          .single();

        console.log("🔍 Resultado verificación voto:", {
          existingVote,
          error: checkError?.message,
          errorCode: checkError?.code,
          errorDetails: checkError?.details,
          errorHint: checkError?.hint
        });

        if (checkError && checkError.code !== "PGRST116") {
          console.error("❌ Error en verificación de voto existente:", checkError);
          throw checkError;
        }

        let liked;
        let isCurrentContest = false;

        // Verificar si es del reto actual - PRIMERO buscar en galleryStories,
        // luego hacer consulta directa si galleryStories está vacía
        if (state.galleryStories.length > 0) {
          const story = state.galleryStories.find((s) => s.id === storyId);
          isCurrentContest = story?.contest_id === state.currentContest?.id;
        } else if (state.currentContest?.id) {
          // GalleryStories está vacía, consultar directamente la historia para verificar reto
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
            console.warn("Error verificando reto de la historia:", err);
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
          console.log("🗑️ Removiendo voto existente, id:", existingVote.id);
          const { error: deleteError } = await supabase
            .from("votes")
            .delete()
            .eq("id", existingVote.id);

          console.log("🗑️ Resultado eliminación voto:", {
            success: !deleteError,
            error: deleteError?.message,
            errorCode: deleteError?.code,
            errorDetails: deleteError?.details,
            errorHint: deleteError?.hint
          });

          if (deleteError) {
            console.error("❌ Error eliminando voto:", deleteError);
            throw deleteError;
          }
          liked = false;

          dispatch({
            type: actions.DECREMENT_VOTE_COUNT,
            payload: { isCurrentContest },
          });

          // Emitir evento para que se actualicen contadores
          window.dispatchEvent(new CustomEvent('voteChanged', { 
            detail: { action: 'removed', storyId, contestId: state.currentContest?.id } 
          }));
        } else {
          // Agregar voto - VERIFICAR LÍMITE DE 3 VOTOS
          if (isCurrentContest && state.currentContest?.id) {
            const voteCountResult = await getUserVoteCount(state.currentContest.id);
            const currentVotes = voteCountResult.count || 0;

            if (currentVotes >= 3) {
              return {
                success: false,
                error: `Has usado todos tus votos (${currentVotes}/3). Quita un voto existente para votar por otra historia.`,
                votesUsed: currentVotes,
                maxVotes: 3,
              };
            }
          }

          console.log("➕ Insertando nuevo voto para story:", storyId, "user:", state.user.id);
          const { error: insertError } = await supabase
            .from("votes")
            .insert([{ story_id: storyId, user_id: state.user.id }]);

          console.log("➕ Resultado inserción voto:", {
            success: !insertError,
            error: insertError?.message,
            errorCode: insertError?.code,
            errorDetails: insertError?.details,
            errorHint: insertError?.hint
          });

          if (insertError) {
            console.error("❌ Error insertando voto:", insertError);
            throw insertError;
          }
          liked = true;

          dispatch({
            type: actions.INCREMENT_VOTE_COUNT,
            payload: { isCurrentContest },
          });

          // Emitir evento para que se actualicen contadores
          window.dispatchEvent(new CustomEvent('voteChanged', { 
            detail: { action: 'added', storyId, contestId: state.currentContest?.id } 
          }));
        }

        // SIEMPRE actualizar galleryStories si es reto actual para máxima sincronización
        const likesChange = liked ? 1 : -1;

        if (isCurrentContest) {
          console.log(
            "🔄 Sincronizando voto en reto actual - galleryStories:",
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
          }, 200); // Tiempo suficiente para que la BD se actualice
        } else if (state.galleryStories.length > 0) {
          // No es reto actual pero gallery está cargada (retos históricos)
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
      verifyAndRecoverSession,
    ]
  );

  // ✅ FUNCIONES PARA AUTH MODAL (deben ir antes de las funciones de auth)
  const openAuthModal = useCallback((mode = "login") => {
    console.log("📱 Abriendo modal de auth:", mode);
    console.trace("📍 Trace de openAuthModal");
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { show: true, mode },
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    console.log("📱 Cerrando modal de auth");
    console.trace("📍 Trace de closeAuthModal");
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { show: false, mode: "login", errors: {} },
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

  // Función específica para mantener el modal abierto después del reset exitoso
  const keepAuthModalOpen = useCallback(() => {
    console.log("🔄 Manteniendo modal abierto para reset exitoso");
    dispatch({
      type: actions.SET_AUTH_MODAL,
      payload: { show: true, mode: "reset-password", errors: {}, resetSuccess: true },
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
    async (email, name, password, emailNotifications = true, termsAccepted = false) => {
      console.log(
        "🔍 register() recibió parámetros:",
        { emailNotifications, termsAccepted }
      );

      // ✅ VALIDACIÓN CRÍTICA: Términos deben ser aceptados
      if (!termsAccepted) {
        console.error("❌ Intento de registro sin aceptar términos");
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { loading: false },
        });
        setAuthModalError("Debes aceptar los términos y condiciones para registrarte");
        return { 
          success: false, 
          error: "Términos y condiciones no aceptados" 
        };
      }

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
                // ✅ IMPORTANTE: Actualizar términos aceptados también
                terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
              };

              // ✅ CORREGIDO: Email SIEMPRE se guarda (para emails esenciales)
              // Las preferencias solo controlan QUÉ emails recibe, no si se guarda el email
              updateData.email = email.trim().toLowerCase();

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
                // Configurar notificaciones específicas por defecto (opt-out)
                contest_notifications: true,
                general_notifications: true,
                newsletter_contests: true,
                // marketing_notifications se mantiene en su default (existe pero no se usa en UI)
                // ✅ REGISTRO LEGAL - Timestamp de aceptación de términos
                terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
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

  // ✅ FUNCIÓN DE RECUPERACIÓN DE CONTRASEÑA
  const resetPassword = useCallback(
    async (email) => {
      console.log("🔄 Iniciando resetPassword, seteando loading=true");
      dispatch({
        type: actions.SET_AUTH_STATE,
        payload: { loading: true },
      });

      try {
        console.log("🔄 Enviando email de recuperación para:", email);

        const redirectUrl = `${SITE_CONFIG.url}?rp=1`;
        console.log("🔄 RESET EMAIL: Enviando reset con redirectTo:", redirectUrl);
        console.log("🔄 RESET EMAIL: SITE_CONFIG.url:", SITE_CONFIG.url);
        
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: redirectUrl,
          }
        );
        
        // Log removido para producción

        if (error) {
          console.error("❌ Error enviando email de recuperación:", error);
          const errorMessage = getErrorMessage(error.message);
          setAuthModalError("general", errorMessage);
          
          dispatch({
            type: actions.SET_AUTH_STATE,
            payload: { loading: false },
          });
          
          return { success: false, error: errorMessage };
        }

        console.log("✅ Email de recuperación enviado exitosamente");
        console.log("🔄 Seteando loading=false Y manteniendo authInitialized=true");
        
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { 
            loading: false,
            initialized: true  // Mantener como inicializado
          },
        });
        
        // Log removido para producción

        // Mantener el modal abierto en modo reset-password para mostrar el mensaje de éxito
        keepAuthModalOpen();

        return { success: true };
      } catch (error) {
        console.error("💥 Error inesperado en resetPassword:", error);
        const errorMessage = "Error inesperado. Intenta nuevamente.";
        setAuthModalError("general", errorMessage);
        console.log("🔄 Seteando loading=false (error) Y manteniendo authInitialized=true");
        
        dispatch({
          type: actions.SET_AUTH_STATE,
          payload: { 
            loading: false,
            initialized: true  // Mantener como inicializado
          },
        });
        
        return { success: false, error: errorMessage };
      }
    },
    [setAuthModalError]
  );

  // ✅ FUNCIONES DE COMENTARIOS
  const getStoryComments = useCallback(async (storyId) => {
    try {
      console.log("📝 Fetching comments for story:", storyId);

      // Obtener TODOS los comentarios (principales y respuestas)
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          user_id,
          story_id,
          parent_id,
          likes_count,
          is_featured,
          created_at,
          updated_at
        `)
        .eq("story_id", storyId)
        .order("created_at", { ascending: true }); // Respuestas en orden cronológico

      if (commentsError) {
        console.error("❌ Error fetching comments:", commentsError);
        return {
          success: false,
          error: commentsError.message,
          comments: [],
          replies: {},
          allComments: []
        };
      }

      if (!comments || comments.length === 0) {
        console.log("✅ No comments found");
        return {
          success: true,
          comments: [],
          replies: {},
          allComments: []
        };
      }

      // Obtener IDs únicos de usuarios
      const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];

      // Obtener perfiles de usuarios
      let profiles = null;
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, display_name, email")
          .in("id", userIds);

        if (!profilesError) {
          profiles = profilesData;
        }
      } catch (err) {
        console.warn("⚠️ Tabla de perfiles no encontrada, usando nombres por defecto");
      }

      // Combinar comentarios con perfiles
      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        profiles: profiles?.find(p => p.id === comment.user_id) || null
      }));

      // Separar comentarios principales de respuestas
      const mainComments = commentsWithProfiles.filter(c => !c.parent_id);
      const replies = commentsWithProfiles.filter(c => c.parent_id);

      // Ordenar comentarios principales: más recientes primero
      mainComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Agrupar respuestas por parent_id para acceso O(1)
      const repliesByParent = {};
      replies.forEach(reply => {
        if (!repliesByParent[reply.parent_id]) {
          repliesByParent[reply.parent_id] = [];
        }
        repliesByParent[reply.parent_id].push(reply);
      });

      // Ordenar respuestas dentro de cada grupo: más antiguas primero (conversación cronológica)
      Object.keys(repliesByParent).forEach(parentId => {
        repliesByParent[parentId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });

      console.log("✅ Comments loaded:", {
        main: mainComments.length,
        replies: replies.length,
        total: commentsWithProfiles.length
      });

      return {
        success: true,
        comments: mainComments,
        replies: repliesByParent,
        allComments: commentsWithProfiles
      };
    } catch (err) {
      console.error("💥 Error fetching comments:", err);
      return {
        success: false,
        error: err.message,
        comments: [],
        replies: {},
        allComments: []
      };
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

      // ✅ VERIFICAR SESIÓN ACTUAL ANTES DE REALIZAR OPERACIÓN
      console.log("💬 Iniciando addComment para story:", storyId, "user:", state.user?.id);
      const sessionCheck = await verifyAndRecoverSession();
      if (!sessionCheck.success) {
        console.error("❌ addComment: Verificación de sesión falló");
        return { success: false, error: "Sesión expirada. Por favor, recarga la página e inicia sesión nuevamente." };
      }
      console.log("✅ addComment: Sesión verificada correctamente");

      try {
        console.log("📝 Insertando comentario...");

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

        console.log("📝 Resultado inserción comentario:", {
          success: !error,
          commentId: data?.id,
          error: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint
        });

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
    [state.isAuthenticated, state.user, verifyAndRecoverSession]
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
        console.log("❤️ Toggling comment like:", commentId, "user:", state.user.id);

        // Llamar a la función SQL que hace toggle automático (like/unlike)
        const { data, error } = await supabase.rpc('toggle_comment_like', {
          p_user_id: state.user.id,
          p_comment_id: commentId
        });

        if (error) throw error;

        console.log("✅ Comment like toggled:", data);
        return {
          success: true,
          action: data.action, // 'liked' o 'unliked'
          likesCount: data.likes_count,
          liked: data.action === 'liked'
        };
      } catch (err) {
        console.error("💥 Error toggling comment like:", err);
        return { success: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  const checkUserCommentLike = useCallback(
    async (commentId) => {
      if (!state.isAuthenticated || !state.user) {
        return { success: true, liked: false };
      }

      try {
        const { data, error } = await supabase.rpc('check_user_comment_like', {
          p_user_id: state.user.id,
          p_comment_id: commentId
        });

        if (error) throw error;

        return { success: true, liked: data };
      } catch (err) {
        console.error("Error checking comment like:", err);
        return { success: false, liked: false, error: err.message };
      }
    },
    [state.isAuthenticated, state.user]
  );

  const getUserCommentLikesBatch = useCallback(
    async (commentIds) => {
      if (!state.isAuthenticated || !state.user || !commentIds.length) {
        return { success: true, likes: {} };
      }

      try {
        const { data, error } = await supabase.rpc('get_user_comment_likes_batch', {
          p_user_id: state.user.id,
          p_comment_ids: commentIds
        });

        if (error) throw error;

        // Convertir array a objeto para búsqueda O(1)
        const likesMap = {};
        data.forEach(item => {
          likesMap[item.comment_id] = item.liked;
        });

        return { success: true, likes: likesMap };
      } catch (err) {
        console.error("Error getting comment likes batch:", err);
        return { success: false, likes: {}, error: err.message };
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

    // ✅ CORREGIDO: Usar hora de Colombia (UTC-5) para comparaciones
    const now = new Date();
    
    // Convertir las fechas del reto a hora de Colombia si no tienen zona horaria
    const submissionDeadline = new Date(contest.submission_deadline);  
    const votingDeadline = new Date(contest.voting_deadline);
    
    // Validar que las fechas sean válidas
    if (isNaN(submissionDeadline.getTime()) || isNaN(votingDeadline.getTime())) {
      console.error("❌ Fechas inválidas en reto:", {
        submission_deadline: contest.submission_deadline,
        voting_deadline: contest.voting_deadline,
        contest: contest
      });
      return "unknown";
    }
    

    if (now <= submissionDeadline) {
      return "submission";
    } else if (now <= votingDeadline) {
      return "voting";
    } else {
      // Si la votación terminó, verificar si el reto se cerró manualmente
      // Si votingDeadline pasó Y (status === "results" O finalized_at existe) → "results"
      // Si votingDeadline pasó Y status !== "results" Y !finalized_at → "counting"
      if (contest.status === "results" || contest.finalized_at) {
        return "results";
      } else {
        return "counting";
      }
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

        // Verificar que el reto esté en período de envío (o que sea admin)
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
  // PERO NO si está en modo reset-password (el usuario debe completar el reset)
  useEffect(() => {
    console.log("🔍 AuthModal Effect - isAuthenticated:", state.isAuthenticated, "showAuthModal:", state.showAuthModal, "authModalMode:", state.authModalMode);
    if (state.isAuthenticated && state.showAuthModal && state.authModalMode !== "reset-password") {
      console.log(
        "🎉 Usuario autenticado exitosamente, cerrando modal automáticamente"
      );
      closeAuthModal();
    }
    // IMPORTANTE: NO cerrar el modal si el usuario se desloguea durante reset-password
    // Esto es normal porque resetPasswordForEmail invalida la sesión
  }, [state.isAuthenticated, state.showAuthModal, state.authModalMode, closeAuthModal]);

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

  // ✅ FUNCIÓN PARA CARGAR ESTADÍSTICAS GLOBALES
  const loadGlobalStats = useCallback(async (forceRefresh = false) => {
    // Cache de 2 horas (7200000ms) - más largo como solicitaste
    const CACHE_DURATION = 2 * 60 * 60 * 1000; 
    
    // Si tenemos cache válido y no forzamos refresh, usar cache
    if (!forceRefresh && state.globalStats.lastUpdated && 
        (Date.now() - state.globalStats.lastUpdated) < CACHE_DURATION) {
      console.log("📊 Usando estadísticas globales desde cache");
      return state.globalStats;
    }

    // Si ya estamos cargando, evitar llamadas duplicadas
    if (state.globalStatsLoading) {
      console.log("📊 Ya hay una carga de estadísticas en progreso");
      return state.globalStats;
    }

    dispatch({ type: actions.SET_GLOBAL_STATS_LOADING, payload: true });

    try {
      console.log("📊 Cargando estadísticas globales desde Supabase");

      // 1. Contar total de usuarios registrados
      const { count: totalUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error("❌ Error contando usuarios:", usersError);
      }

      // 2. Obtener todas las historias para contar stories y palabras
      const { data: allStories, error: storiesError } = await supabase
        .from('stories')
        .select('word_count');

      if (storiesError) {
        console.error("❌ Error obteniendo historias:", storiesError);
        throw storiesError;
      }

      // 3. Calcular estadísticas
      const totalStories = allStories?.length || 0;
      const totalWords = allStories?.reduce((acc, story) => {
        return acc + (story.word_count || 600); // Fallback de 600 palabras
      }, 0) || 0;

      const stats = {
        totalUsers: totalUsers || 0,
        totalStories,
        totalWords,
      };

      console.log("📊 Estadísticas globales calculadas:", stats);

      // 4. Guardar en el estado
      dispatch({ type: actions.SET_GLOBAL_STATS, payload: stats });

      return stats;

    } catch (error) {
      console.error("❌ Error cargando estadísticas globales:", error);
      dispatch({ type: actions.SET_GLOBAL_STATS_LOADING, payload: false });
      
      // Devolver stats actuales como fallback
      return state.globalStats;
    }
  }, [state.globalStats, state.globalStatsLoading, dispatch]);

  // ✅ CARGAR ESTADÍSTICAS GLOBALES DESPUÉS DE INICIALIZACIÓN
  useEffect(() => {
    if (state.initialized && !state.globalStats.lastUpdated && !state.globalStatsLoading) {
      console.log("📊 Cargando estadísticas globales tras inicialización");
      loadGlobalStats().catch(error => {
        console.error("❌ Error cargando estadísticas globales:", error);
      });
    }
  }, [state.initialized, state.globalStats.lastUpdated, state.globalStatsLoading]); // Removido loadGlobalStats para evitar ciclo

  // ✅ RECARGAR ESTADÍSTICAS DE VOTACIÓN CUANDO CURRENTCONTEST ESTÉ DISPONIBLE
  useEffect(() => {
    if (state.user?.id && state.currentContest?.id && state.initialized) {
      console.log("🔄 Recargando estadísticas de votación con currentContest disponible:", {
        userId: state.user.id,
        currentContestId: state.currentContest.id,
        currentContestTitle: state.currentContest.title
      });
      loadVotingStats(state.user.id);
    }
  }, [state.user?.id, state.currentContest?.id, state.initialized]); // Removido loadVotingStats para evitar ciclo

  // 🛡️ FUNCIONES DE SEGURIDAD PARA RESET PASSWORD
  const completePasswordReset = useCallback(() => {
    console.log("🔐 Completando reset de contraseña - limpiando estado temporal");
    sessionStorage.removeItem('password_reset_pending');
    sessionStorage.removeItem('reset_user_id');
    dispatch({
      type: actions.SET_PASSWORD_RESET_PENDING,
      payload: false,
    });
  }, []);

  const forceLogoutIfResetPending = useCallback(() => {
    console.log("🛡️ Verificando si hay reset pendiente y usuario intenta salir de /reset-password");
    const isPending = sessionStorage.getItem('password_reset_pending') === 'true';
    const isOnResetPage = window.location.pathname === '/reset-password';
    
    if (isPending && !isOnResetPage) {
      console.log("🚨 SEGURIDAD: Usuario con reset pendiente intentó salir - forzando logout");
      sessionStorage.removeItem('password_reset_pending');
      sessionStorage.removeItem('reset_user_id');
      dispatch({
        type: actions.SET_PASSWORD_RESET_PENDING,
        payload: false,
      });
      // Logout inmediato
      supabase.auth.signOut();
      return true; // Indica que se forzó logout
    }
    return false;
  }, []);

  // ✅ FUNCIÓN DE DEBUG - Sin dependencias para evitar re-renders
  const debugAuth = useCallback(async () => {
    console.log("🔍 DEBUG: Verificando estado de Supabase...");
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    console.log("🔍 DEBUG: Sesión actual:", session);
    console.log("🔍 DEBUG: Error de sesión:", error);
    // Usar state.current para acceder al estado actual sin crear dependencia
    console.log("🔍 DEBUG: Estado local:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      authInitialized: state.authInitialized,
      initialized: state.initialized,
      isPasswordResetPending: state.isPasswordResetPending,
    });
  }, []);  // Sin dependencias - la función de debug accede al state directamente

  // ✅ FUNCIONES DE ELIMINACIÓN DE CUENTA DE USUARIO
  const simulateUserDeletion = useCallback(async (userId = null) => {
    const targetUserId = userId || state.user?.id;
    
    if (!targetUserId) {
      return { success: false, error: "Usuario no identificado" };
    }

    if (!state.user?.is_admin && targetUserId !== state.user?.id) {
      return { success: false, error: "Solo puedes simular eliminación de tu propia cuenta" };
    }

    try {
      console.log("🔍 Simulando eliminación para usuario:", targetUserId);

      // Contar qué se eliminaría (datos personales) vs qué se anonimizaría (historias)
      const [storiesResult, commentsResult, votesResult, badgesResult, notificationsResult] = await Promise.all([
        supabase.from("stories").select("id, title, is_winner").eq("user_id", targetUserId),
        supabase.from("comments").select("id").eq("user_id", targetUserId),
        supabase.from("votes").select("id").eq("user_id", targetUserId),
        supabase.from("user_badges").select("id").eq("user_id", targetUserId),
        supabase.from("notifications").select("id").eq("user_id", targetUserId)
      ]);

      const simulation = {
        userId: targetUserId,
        stories: {
          total: storiesResult.data?.length || 0,
          willBeAnonymized: storiesResult.data?.length || 0, // TODAS se anonimizarán
          winners: storiesResult.data?.filter(s => s.is_winner).length || 0,
          titles: storiesResult.data?.map(s => s.title) || []
        },
        comments: commentsResult.data?.length || 0,
        votes: votesResult.data?.length || 0,
        badges: badgesResult.data?.length || 0,
        notifications: notificationsResult.data?.length || 0
      };

      console.log("📋 Simulación de eliminación:", simulation);
      return { success: true, simulation };
    } catch (error) {
      console.error("❌ Error en simulación:", error);
      return { success: false, error: error.message };
    }
  }, [state.user]);

  const deleteUserAccount = useCallback(async (userId = null, options = {}) => {
    const targetUserId = userId || state.user?.id;
    
    if (!targetUserId) {
      return { success: false, error: "Usuario no identificado" };
    }

    if (!state.user?.is_admin && targetUserId !== state.user?.id) {
      return { success: false, error: "Solo puedes eliminar tu propia cuenta" };
    }

    // Modo simulación por defecto para seguridad
    if (options.dryRun !== false) {
      console.log("🔒 Modo simulación activado - usa dryRun: false para eliminación real");
      return await simulateUserDeletion(targetUserId);
    }

    try {
      console.log("🗑️ INICIANDO ELIMINACIÓN REAL para usuario:", targetUserId);
      
      // Comenzar transacción de eliminación
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError || !profile) {
        return { success: false, error: "Usuario no encontrado" };
      }

      console.log("🔄 Eliminando datos del usuario:", profile.display_name || profile.email);

      // Usar función SQL para bypass de RLS si es admin
      if (state.user?.is_admin) {
        console.log("🔒 Ejecutando eliminación como admin con bypass de RLS");
        
        const { data, error } = await supabase.rpc('admin_delete_user_completely', {
          user_id_to_delete: targetUserId
        });

        if (error) {
          console.error("❌ Error en función SQL admin:", error);
          // Fallback a eliminación manual
        } else {
          console.log("✅ Usuario eliminado via función SQL admin:", data);
          const message = data.anonymized_stories > 0 
            ? `Cuenta eliminada exitosamente. ${data.anonymized_stories} historias anonimizadas para preservar integridad de concursos.`
            : `Cuenta eliminada exitosamente. El usuario no tenía historias.`;
          
          return { 
            success: true, 
            message,
            deletedCounts: data 
          };
        }
      } else if (targetUserId === state.user?.id) {
        // Usuario eliminando su propia cuenta - usar función admin temporalmente
        console.log("🔒 Ejecutando auto-eliminación usando función admin");
        console.log("🔍 Llamando función con userId:", targetUserId);
        
        const { data, error } = await supabase.rpc('admin_delete_user_completely', {
          user_id_to_delete: targetUserId
        });
        
        console.log("🔍 Respuesta de función:", { data, error });

        if (error) {
          console.error("❌ Error en función SQL admin:", error);
          // Fallback a eliminación manual
        } else {
          console.log("✅ Usuario auto-eliminado via función SQL admin:", data);
          const message = data.anonymized_stories > 0 
            ? `Tu cuenta ha sido eliminada exitosamente. ${data.anonymized_stories} historias fueron eliminadas para proteger tu privacidad.`
            : `Tu cuenta ha sido eliminada exitosamente. No tenías historias publicadas.`;
          
          // Logout inmediato para usuarios auto-eliminados
          await supabase.auth.signOut();
          
          return { 
            success: true, 
            message,
            deletedCounts: data 
          };
        }
      }

      // Fallback: Eliminar en orden específico para evitar errores de FK
      const deletionSteps = [
        // 1. Eliminar dependencias primero
        () => supabase.from("user_badges").delete().eq("user_id", targetUserId),
        () => supabase.from("notifications").delete().eq("user_id", targetUserId),
        () => supabase.from("votes").delete().eq("user_id", targetUserId),
        
        // 2. Eliminar comentarios
        () => supabase.from("comments").delete().eq("user_id", targetUserId),
        
        // 3. Eliminar historias
        () => supabase.from("stories").delete().eq("user_id", targetUserId),
        
        // 4. Eliminar suscripciones de email
        () => supabase.from("email_subscribers").delete().eq("user_id", targetUserId),
        
        // 5. Eliminar reportes donde es reporter
        () => supabase.from("reports").delete().eq("reporter_id", targetUserId),
        
        // 6. Eliminar feedback requests
        () => supabase.from("feedback_requests").delete().eq("user_id", targetUserId),
        
        // 7. Eliminar submission consents
        () => supabase.from("submission_consents").delete().eq("user_id", targetUserId),
        
        // 8. Eliminar de cached_rankings
        () => supabase.from("cached_rankings").delete().eq("user_id", targetUserId),
        
        // 9. Finalmente, eliminar el perfil
        () => supabase.from("user_profiles").delete().eq("id", targetUserId)
      ];

      let deletedCounts = {};
      
      for (let i = 0; i < deletionSteps.length; i++) {
        const step = deletionSteps[i];
        try {
          const result = await step();
          if (result.error) {
            console.error(`❌ Error en paso ${i + 1}:`, result.error);
            // Continuar con otros pasos a menos que sea crítico
          } else {
            console.log(`✅ Paso ${i + 1} completado`);
          }
        } catch (stepError) {
          console.error(`💥 Error crítico en paso ${i + 1}:`, stepError);
          return { success: false, error: `Error en eliminación paso ${i + 1}: ${stepError.message}` };
        }
      }

      // Si llegamos aquí, la eliminación fue exitosa
      console.log("✅ Usuario eliminado completamente:", targetUserId);
      
      // Si el usuario eliminó su propia cuenta, hacer logout
      if (targetUserId === state.user?.id) {
        console.log("🚪 Usuario eliminó su propia cuenta - haciendo logout");
        await supabase.auth.signOut();
      }

      return { 
        success: true, 
        message: "Cuenta eliminada completamente",
        deletedCounts 
      };
      
    } catch (error) {
      console.error("💥 Error crítico en eliminación:", error);
      return { success: false, error: error.message };
    }
  }, [state.user, simulateUserDeletion]);

  // ✅ FUNCIONES DE CACHE - Definidas fuera del useMemo para evitar hook violations
  const invalidateGlobalStats = useCallback(() => {
    console.log("🔄 Invalidando cache de estadísticas globales");
    dispatch({ type: actions.INVALIDATE_GLOBAL_STATS });
  }, [dispatch]);

  const clearFinishedContestsCache = useCallback(() => {
    console.log("🧹 Limpiando caché de retos finalizados");
    dispatch({ type: actions.CLEAR_FINISHED_CONTESTS_CACHE });
  }, [dispatch]);
  
  const clearFinishedStoriesCache = useCallback(() => {
    console.log("🧹 Limpiando caché de historias individuales");
    dispatch({ type: actions.CLEAR_FINISHED_STORIES_CACHE });
  }, [dispatch]);

  // ✅ CONTEXT VALUE - Simple sin useMemo para evitar problemas de dependencias
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
    resetPassword,
    logout,
    updateUser,
    
    // Funciones de seguridad para reset password
    completePasswordReset,
    forceLogoutIfResetPending,

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
    getUserVoteCount,
    loadGalleryStories,

    // Funciones de comentarios
    getStoryComments,
    addComment,
    deleteComment,
    toggleCommentLike,
    checkUserCommentLike,
    getUserCommentLikesBatch,

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
    
    // Funciones de eliminación de cuenta
    simulateUserDeletion,
    deleteUserAccount,

    // Funciones de Auth Modal
    openAuthModal,
    closeAuthModal,
    setAuthModalError,
    clearAuthModalErrors,
    keepAuthModalOpen,

    // Funciones de Cookie Consent
    setCookieConsent,
    showCookieBannerAgain,
    resetCookieConsent,

    // Utilidades
    getContestPhase,
    getContestById,
    debugAuth,

    // Funciones de estadísticas globales
    loadGlobalStats,
    invalidateGlobalStats,

    // Cache de retos finalizados
    clearFinishedContestsCache,
    
    // Cache de historias individuales
    clearFinishedStoriesCache,

    // Dispatch para casos especiales
    dispatch,
  };

  // 🛡️ DETECCIÓN INMEDIATA DE RESET PASSWORD AL CARGAR LA PÁGINA
  console.log("🚀 GlobalAppContext montado - URL:", window.location.href);
  console.log("🔍 Mount ID:", Date.now(), "- Stack:", new Error().stack?.split('\n')[2]);
  
  useEffect(() => {
    const checkResetPasswordFlow = () => {
      console.log("🔍 INMEDIATO: Verificando flujo de reset al cargar página");
      console.log("🔍 URL completa:", window.location.href);
      console.log("🔍 Hash:", window.location.hash);
      console.log("🔍 Search:", window.location.search);
      
      // DETECTAR si venimos de un enlace de Supabase (reset password)
      const comesFromSupabaseAuth = document.referrer.includes('supabase.co/auth/v1/verify');
      console.log("🔍 Referrer:", document.referrer);
      console.log("🔍 comesFromSupabaseAuth:", comesFromSupabaseAuth);
      
      const isRootWithAuthFlow = window.location.pathname === '/' && 
        (window.location.hash.includes('access_token') || 
         window.location.search.includes('access_token') ||
         window.location.hash.includes('type=recovery') ||
         window.location.search.includes('type=recovery') ||
         // O si venimos de Supabase auth (probablemente un reset)
         comesFromSupabaseAuth);
      
      console.log("🔍 isRootWithAuthFlow:", isRootWithAuthFlow);
      
      if (isRootWithAuthFlow) {
        console.log("🔄 INMEDIATO: Detectado flujo de auth - preservando tokens");
        
        // PRESERVAR tokens antes de que Supabase los procese
        const currentHash = window.location.hash;
        const currentSearch = window.location.search;
        
        // Guardar tokens en sessionStorage INMEDIATAMENTE
        if (currentHash.includes('access_token')) {
          const hashParams = new URLSearchParams(currentHash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken) {
            sessionStorage.setItem('temp_access_token', accessToken);
            sessionStorage.setItem('temp_refresh_token', refreshToken || '');
            console.log("💾 Tokens preservados en sessionStorage");
          }
        }
        
        window.location.replace('/reset-password' + currentHash + currentSearch);
      }
    };
    
    // Ejecutar inmediatamente al cargar la página
    checkResetPasswordFlow();
  }, []); // Solo una vez al montar el componente

  return (
    <GlobalAppContext.Provider value={contextValue}>
      {children}
    </GlobalAppContext.Provider>
  );
}

// Función para determinar si un reto es de prueba
const isTestContest = (contest) => {
  if (!contest?.title) return false;
  const title = contest.title.toLowerCase();
  return /\btest\b/.test(title) || /\bprueba\b/.test(title) || /\bdemo\b/.test(title);
};

// Función para encontrar el reto actual con lógica híbrida
const findCurrentContest = (contests) => {
  if (!contests || contests.length === 0) return null;
  
  const now = new Date();
  
  // Separar retos de prueba y producción
  const testContests = contests.filter(contest => 
    isTestContest(contest) && contest.finalized_at === null
  );
  const productionContests = contests.filter(contest => 
    !isTestContest(contest) && contest.finalized_at === null
  );
  
  console.log(`🔍 Concursos de prueba activos: ${testContests.length}`);
  console.log(`🔍 Concursos de producción activos: ${productionContests.length}`);
  
  // PRIORIDAD 1: Concursos de prueba (más reciente cronológicamente)
  if (testContests.length > 0) {
    const current = testContests
      .sort((a, b) => new Date(b.submission_deadline) - new Date(a.submission_deadline))[0];
    console.log(`🎭 Usando reto de prueba: "${current.title}"`);
    return current;
  }
  
  // PRIORIDAD 2: Concursos de producción (por fechas)
  if (productionContests.length > 0) {
    // Buscar retos que deberían estar activos ahora
    const activeNow = productionContests.filter(contest => {
      // El reto está activo hasta que se finalice manualmente (para mostrar fase "counting")
      return !contest.finalized_at;
    });
    
    if (activeNow.length > 0) {
      // Ordenar por fecha de submission (el que debería empezar primero)
      const current = activeNow
        .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))[0];
      console.log(`🏗️ Usando reto de producción: "${current.title}"`);
      return current;
    }
    
    // Si no hay retos activos por fecha, usar el más reciente cronológicamente
    const current = productionContests
      .sort((a, b) => new Date(b.submission_deadline) - new Date(a.submission_deadline))[0];
    console.log(`🏗️ Usando reto de producción (fallback): "${current.title}"`);
    return current;
  }
  
  // FALLBACK: Cualquier reto disponible
  const fallback = contests.find(contest => 
    contest.status === "active" || 
    contest.status === "submission" || 
    contest.status === "voting"
  ) || contests[0] || null;
  
  if (fallback) {
    console.log(`🔄 Usando reto fallback: "${fallback.title}"`);
  }
  
  return fallback;
};

// Función para encontrar el siguiente reto en la cola
const findNextContest = (contests, currentContest) => {
  if (!contests || contests.length === 0) return null;
  
  const now = new Date();
  
  // Filtrar retos que no sean el actual y que no estén finalizados
  const availableContests = contests.filter(contest => 
    contest.id !== currentContest?.id && 
    !contest.finalized_at &&
    contest.status !== "results"
  );
  
  if (availableContests.length === 0) return null;
  
  // Separar retos de prueba y producción
  const testContests = availableContests.filter(contest => isTestContest(contest));
  const productionContests = availableContests.filter(contest => !isTestContest(contest));
  
  // Si el reto actual es de prueba, buscar el siguiente de prueba o el siguiente de producción
  if (currentContest && isTestContest(currentContest)) {
    // Priorizar siguiente reto de prueba
    if (testContests.length > 0) {
      const next = testContests
        .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))[0];
      console.log(`🎭 Siguiente reto de prueba: "${next.title}"`);
      return next;
    }
    
    // Fallback a reto de producción
    if (productionContests.length > 0) {
      const next = productionContests
        .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))[0];
      console.log(`🏗️ Siguiente reto de producción (desde prueba): "${next.title}"`);
      return next;
    }
  }
  
  // Para retos de producción, buscar el siguiente reto de producción
  if (productionContests.length > 0) {
    // Buscar el siguiente reto por orden cronológico (submission_deadline)
    const next = productionContests
      .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))
      .find(contest => new Date(contest.submission_deadline) > new Date(currentContest?.submission_deadline || 0));
    
    if (next) {
      console.log(`📅 Siguiente reto por orden cronológico: "${next.title}"`);
      return next;
    }
    
    // Si no hay siguiente por fechas, tomar el más reciente por submission_deadline
    const fallbackNext = productionContests
      .sort((a, b) => new Date(b.submission_deadline) - new Date(a.submission_deadline))[0];
    
    if (fallbackNext) {
      console.log(`🔄 Siguiente reto (fallback): "${fallbackNext.title}"`);
      return fallbackNext;
    }
  }
  
  console.log("🔍 No se encontró siguiente reto");
  return null;
};

// ✅ HOOK PRINCIPAL
export function useGlobalApp() {
  const context = useContext(GlobalAppContext);
  if (!context) {
    throw new Error("useGlobalApp debe usarse dentro de GlobalAppProvider");
  }
  return context;
}

