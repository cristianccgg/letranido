// store/authStore.js - VERSIÓN CORREGIDA SIN RACE CONDITIONS
import { create } from "zustand";
import { supabase } from "../lib/supabase";

// Variables globales para controlar la inicialización
let authListenerUnsubscribe = null;
let isInitializing = false;
let hasInitialized = false;
let initPromise = null; // ✅ NUEVO: Promise para evitar múltiples inicializaciones

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  // ✅ NUEVA FUNCIÓN: Inicialización centralizada y segura
  initialize: async () => {
    const state = get();

    // ✅ Si ya hay una inicialización en progreso, esperar a que termine
    if (initPromise) {
      console.log("⏳ Esperando inicialización en progreso...");
      return await initPromise;
    }

    // ✅ Si ya está inicializado, no hacer nada
    if (hasInitialized && state.initialized) {
      console.log("✅ AuthStore ya inicializado");
      return;
    }

    // ✅ Crear y guardar el promise de inicialización
    initPromise = performInitialization();

    try {
      await initPromise;
    } finally {
      initPromise = null; // Limpiar el promise al finalizar
    }
  },

  cleanup: () => {
    console.log("🧹 Limpiando AuthStore...");

    if (authListenerUnsubscribe) {
      authListenerUnsubscribe();
      authListenerUnsubscribe = null;
    }

    // Reset de todas las variables globales
    isInitializing = false;
    hasInitialized = false;
    initPromise = null;

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: false,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        set({ isLoading: false });
        return {
          success: false,
          error: get().getErrorMessage(error.message),
        };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      set({ isLoading: false });
      return {
        success: false,
        error: "Error inesperado. Intenta nuevamente.",
      };
    }
  },

  register: async (email, name, password) => {
    set({ isLoading: true });

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
        set({ isLoading: false });
        return {
          success: false,
          error: get().getErrorMessage(error.message),
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
              set({ isLoading: false });
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
          set({ isLoading: false });
          return {
            success: false,
            error: "No se pudo crear el perfil de usuario. Intenta nuevamente.",
          };
        }
      }

      // Si la sesión existe, el usuario ya está autenticado
      if (data.session) {
        set({ isLoading: false });
        await get().initialize();
        return { success: true };
      }

      // Si no hay sesión, intentar login automático con retry
      if (data.user && !data.session) {
        let loginResult = await get().login(email, password);
        if (!loginResult.success) {
          // Esperar 1 segundo y reintentar login
          await new Promise((resolve) => setTimeout(resolve, 1000));
          loginResult = await get().login(email, password);
        }
        set({ isLoading: false });
        if (loginResult.success) {
          return { success: true };
        }
        // Si el login automático falla, pedir recargar
        return {
          success: true,
          message:
            "✅ Registro exitoso, pero no se pudo iniciar sesión automáticamente. Por favor, inicia sesión.",
          requiresConfirmation: false,
        };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      set({ isLoading: false });
      return {
        success: false,
        error: "Error inesperado. Intenta nuevamente.",
      };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  updateUser: (newUserData) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          ...newUserData,
        },
      });
    }
  },

  getErrorMessage: (errorMessage) => {
    const errorMap = {
      "Invalid login credentials": "Email o contraseña incorrectos",
      "Email not confirmed": "Debes confirmar tu email antes de iniciar sesión",
      "User already registered": "Este email ya está registrado",
      "Password should be at least 6 characters":
        "La contraseña debe tener al menos 6 caracteres",
      "Unable to validate email address: invalid format":
        "Formato de email inválido",
      "signup is disabled": "El registro está temporalmente deshabilitado",
    };

    return errorMap[errorMessage] || errorMessage || "Error desconocido";
  },

  hasVoted: async (storyId) => {
    const user = get().user;
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("votes")
        .select("id")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking vote:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking vote:", error);
      return false;
    }
  },

  toggleVote: async (storyId) => {
    const user = get().user;
    if (!user)
      return { success: false, error: "Debes iniciar sesión para votar" };

    try {
      const { data: existingVote, error: checkError } = await supabase
        .from("votes")
        .select("id")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingVote) {
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) throw deleteError;
        return { success: true, voted: false };
      } else {
        const { error: insertError } = await supabase
          .from("votes")
          .insert([{ story_id: storyId, user_id: user.id }]);

        if (insertError) throw insertError;
        return { success: true, voted: true };
      }
    } catch (error) {
      console.error("Error toggling vote:", error);
      return {
        success: false,
        error: "Error al procesar el voto. Intenta nuevamente.",
      };
    }
  },
}));

// ✅ FUNCIÓN DE INICIALIZACIÓN INTERNA (NO EXPORTADA)
async function performInitialization() {
  if (isInitializing || hasInitialized) {
    console.log("🚫 Inicialización ya en progreso o completada");
    return;
  }

  isInitializing = true;
  console.log("🚀 Iniciando AuthStore (ÚNICA VEZ)...");

  const { getState, setState } = useAuthStore;
  setState({ isLoading: true });

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
      return;
    }

    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        console.warn("User profile not found, clearing session");
        await supabase.auth.signOut();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
        return;
      }

      const userData = {
        id: session.user.id,
        email: session.user.email,
        name:
          profile?.display_name ||
          session.user.user_metadata?.display_name ||
          session.user.email?.split("@")[0],
        display_name:
          profile?.display_name || session.user.user_metadata?.display_name,
        avatar: profile?.avatar_url,
        ...profile,
      };

      setState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      });
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
    }

    // ✅ Configurar listener SOLO una vez
    if (!authListenerUnsubscribe) {
      console.log("🎧 Configurando auth listener...");

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("🔄 Auth state changed:", event);

          if (event === "SIGNED_IN" && session?.user) {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            const userData = {
              id: session.user.id,
              email: session.user.email,
              name:
                profile?.display_name ||
                session.user.user_metadata?.display_name ||
                session.user.email?.split("@")[0],
              display_name:
                profile?.display_name ||
                session.user.user_metadata?.display_name,
              avatar: profile?.avatar_url,
              ...profile,
            };

            setState({
              user: userData,
              isAuthenticated: true,
            });
          } else if (event === "SIGNED_OUT") {
            setState({
              user: null,
              isAuthenticated: false,
            });
          }
        }
      );

      authListenerUnsubscribe = authListener.subscription.unsubscribe;
    }

    hasInitialized = true;
    console.log("✅ AuthStore inicializado exitosamente");
  } catch (error) {
    console.error("Error initializing auth:", error);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    });
  } finally {
    isInitializing = false;
  }
}

// ✅ INICIALIZACIÓN AUTOMÁTICA SOLO EN BROWSER
if (typeof window !== "undefined") {
  // ✅ Cleanup para desarrollo
  if (import.meta.env.DEV) {
    window.__authStoreCleanup = () => {
      console.log("🧹 Manual cleanup desde DevTools");
      useAuthStore.getState().cleanup();
    };
  }

  // ✅ Inicializar automáticamente SOLO si no está inicializado
  setTimeout(() => {
    if (!hasInitialized && !isInitializing) {
      console.log("🎬 Auto-inicializando AuthStore...");
      useAuthStore.getState().initialize();
    }
  }, 100); // Pequeño delay para evitar conflictos
}
