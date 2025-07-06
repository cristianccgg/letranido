// store/authStore.js - SIN persist
import { create } from "zustand";
// QUITAR: import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  // Initialize auth state from Supabase session
  initialize: async () => {
    if (get().initialized) return;

    set({ isLoading: true });

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
        return;
      }

      if (session?.user) {
        // Verificar que el usuario realmente existe en Supabase
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        // Si el perfil no existe, el usuario fue borrado
        if (profileError && profileError.code === "PGRST116") {
          console.warn("User profile not found, clearing session");
          await supabase.auth.signOut();
          set({
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

        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event);

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
              profile?.display_name || session.user.user_metadata?.display_name,
            avatar: profile?.avatar_url,
            ...profile,
          };

          set({
            user: userData,
            isAuthenticated: true,
          });
        } else if (event === "SIGNED_OUT") {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
    }
  },

  // Login function
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

      // El estado se actualizará automáticamente por onAuthStateChange
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

  // Register function
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

      if (data.user && !data.session) {
        set({ isLoading: false });
        return {
          success: true,
          message:
            "✅ Registro exitoso! Revisa tu email para confirmar tu cuenta.",
          requiresConfirmation: true,
        };
      }

      // El estado se actualizará automáticamente por onAuthStateChange
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

  // Logout function
  logout: async () => {
    try {
      await supabase.auth.signOut();
      // El estado se limpiará automáticamente por onAuthStateChange
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout locally even if API fails
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  // Helper function to get user-friendly error messages
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

  // Check if user has voted for a story
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

  // Toggle vote for a story
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

// Initialize auth when the store is created
if (typeof window !== "undefined") {
  useAuthStore.getState().initialize();
}
