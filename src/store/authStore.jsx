// store/authStore.js - ARREGLADO sin múltiples listeners
import { create } from "zustand";
import { supabase } from "../lib/supabase";

let authListenerUnsubscribe = null; // Variable global para evitar múltiples listeners

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,
  showFounderWelcome: false,
  badgeNotificationQueue: [],

  // Initialize auth state from Supabase session
  initialize: async () => {
    const state = get();
    if (state.initialized) {
      console.log("🚫 AuthStore ya inicializado, saltando...");
      return;
    }

    console.log("🚀 Inicializando AuthStore...");
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

        // Verificar y otorgar badges automáticamente
        await get().checkAndGrantAutomaticBadges(userData.id);
        setTimeout(() => {
          get().checkForNewBadges(userData.id);
        }, 2000);
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
      }

      // ⚠️ CRÍTICO: Solo setup listener UNA VEZ
      if (!authListenerUnsubscribe) {
        console.log("🎧 Configurando auth listener (solo una vez)...");

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

              set({
                user: userData,
                isAuthenticated: true,
              });

              // Verificar badges para usuarios existentes
              await get().checkAndGrantAutomaticBadges(userData.id);
              setTimeout(() => {
                get().checkForNewBadges(userData.id);
              }, 2000);
            } else if (event === "SIGNED_OUT") {
              set({
                user: null,
                isAuthenticated: false,
              });
            }
          }
        );

        // Guardar función para cleanup
        authListenerUnsubscribe = authListener.subscription.unsubscribe;
      }
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

  // Función para cleanup manual (usar en desarrollo)
  cleanup: () => {
    if (authListenerUnsubscribe) {
      console.log("🧹 Limpiando auth listener...");
      authListenerUnsubscribe();
      authListenerUnsubscribe = null;
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: false,
      showFounderWelcome: false,
      badgeNotificationQueue: [],
    });
  },

  // Login function (sin cambios)
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

  // Register function - Actualizada para otorgar badge de fundador
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

      // Si el registro fue exitoso y hay sesión inmediata
      if (data.user && data.session) {
        // Otorgar badge de fundador automáticamente
        setTimeout(async () => {
          const result = await get().grantFounderBadge(data.user.id);
          if (result.success && result.newFounder) {
            set({ showFounderWelcome: true });
          }
        }, 1000); // Esperar un poco para que se cree el perfil
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

  // Logout function (sin cambios)
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

  // Función para verificar y otorgar badges automáticamente
  checkAndGrantAutomaticBadges: async (userId) => {
    try {
      console.log("🎯 Verificando badges automáticos para:", userId);

      // Definir período de fundadores (primeros 30 días desde el lanzamiento)
      const LAUNCH_DATE = new Date("2025-07-08"); // ⚠️ AJUSTAR A TU FECHA REAL DE LANZAMIENTO
      const FOUNDER_PERIOD_DAYS = 30;
      const founderDeadline = new Date(
        LAUNCH_DATE.getTime() + FOUNDER_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      const now = new Date();

      // Solo otorgar badge de fundador si estamos dentro del período
      if (now <= founderDeadline) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("created_at, is_founder")
          .eq("id", userId)
          .single();

        if (profile && !profile.is_founder) {
          console.log("🚀 Otorgando badge de fundador automáticamente");
          const result = await get().grantFounderBadge(userId);

          if (result.success && result.newFounder) {
            // Mostrar modal de bienvenida para nuevos fundadores
            setTimeout(() => {
              set({ showFounderWelcome: true });
            }, 500);
          }
        }
      }
    } catch (err) {
      console.error("Error checking automatic badges:", err);
    }
  },

  // Función para otorgar badge de fundador
  grantFounderBadge: async (userId) => {
    try {
      console.log("🏆 Otorgando insignia de fundador a:", userId);

      // Verificar si ya es fundador
      const { data: currentProfile } = await supabase
        .from("user_profiles")
        .select("is_founder, badges")
        .eq("id", userId)
        .single();

      if (currentProfile?.is_founder) {
        console.log("✅ Usuario ya es fundador");
        return { success: true, alreadyFounder: true };
      }

      // Crear badge de fundador
      const founderBadge = {
        id: "founder",
        name: "Fundador",
        description: "Miembro fundador de LiteraLab",
        icon: "🚀",
        rarity: "legendary",
        earnedAt: new Date().toISOString(),
        isSpecial: true,
      };

      // Obtener badges actuales
      const currentBadges = currentProfile?.badges || [];
      const updatedBadges = [founderBadge, ...currentBadges];

      // Actualizar perfil del usuario
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          is_founder: true,
          founded_at: new Date().toISOString(),
          badges: updatedBadges,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error otorgando badge de fundador:", error);
        throw error;
      }

      console.log("✅ Badge de fundador otorgado exitosamente");

      // Actualizar usuario en el estado si es el usuario actual
      const currentUser = get().user;
      if (currentUser && currentUser.id === userId) {
        set({
          user: {
            ...currentUser,
            is_founder: true,
            founded_at: data.founded_at,
            badges: data.badges,
          },
        });
      }

      return {
        success: true,
        newFounder: true,
        badge: founderBadge,
        profile: data,
      };
    } catch (err) {
      console.error("💥 Error otorgando badge de fundador:", err);
      return {
        success: false,
        error: err.message || "Error al otorgar insignia de fundador",
      };
    }
  },

  // Función para cerrar modal de bienvenida
  closeFounderWelcome: () => {
    set({ showFounderWelcome: false });
  },

  // Función para verificar badges nuevos al hacer login
  checkForNewBadges: async (userId) => {
    if (!userId) return;

    try {
      console.log("🔍 Verificando badges nuevos para usuario:", userId);

      const { data: userProfile, error } = await supabase
        .from("user_profiles")
        .select("badges, last_badge_check, display_name")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error obteniendo badges:", error);
        return;
      }

      const badges = userProfile?.badges || [];
      const lastCheck = userProfile?.last_badge_check;
      const userName = userProfile?.display_name || "Usuario";

      console.log(`📋 ${userName} tiene ${badges.length} badges`);

      if (badges.length === 0) return;

      // Encontrar badges que no han sido mostrados
      const newBadges = badges.filter((badge) => {
        if (!lastCheck) {
          // Si nunca se ha verificado, mostrar badges de las últimas 2 horas
          // (más corto para evitar mostrar badges viejos)
          const badgeDate = new Date(badge.earnedAt);
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          return badgeDate >= twoHoursAgo;
        }

        // Mostrar badges posteriores al último check
        const badgeDate = new Date(badge.earnedAt);
        const lastCheckDate = new Date(lastCheck);
        return badgeDate > lastCheckDate;
      });

      console.log(
        `🆕 ${userName}: ${newBadges.length} badges nuevos encontrados`
      );

      if (newBadges.length > 0) {
        console.log(
          `🎯 Badges a mostrar para ${userName}:`,
          newBadges.map((b) => b.name)
        );

        // Mostrar badges con delay entre cada uno
        newBadges.forEach((badge, index) => {
          setTimeout(() => {
            console.log(
              `🎉 ${userName}: Mostrando notificación de badge:`,
              badge.name
            );
            get().queueBadgeNotification(badge);
          }, (index + 1) * 1500); // 1.5 segundos entre cada badge, empezando en 1.5s
        });

        // Actualizar last_badge_check
        await supabase
          .from("user_profiles")
          .update({ last_badge_check: new Date().toISOString() })
          .eq("id", userId);

        console.log(`✅ ${userName}: last_badge_check actualizado`);
      } else {
        console.log(`ℹ️ ${userName}: No hay badges nuevos que mostrar`);
      }
    } catch (err) {
      console.error("💥 Error verificando badges nuevos:", err);
    }
  },

  // Función para agregar notificación de badge a la cola
  queueBadgeNotification: (badge) => {
    set((state) => ({
      badgeNotificationQueue: [
        ...state.badgeNotificationQueue,
        {
          id: Date.now() + Math.random(),
          badge,
          isVisible: true,
        },
      ],
    }));
  },

  // Función para remover notificación de badge de la cola
  removeBadgeNotification: (id) => {
    set((state) => ({
      badgeNotificationQueue: state.badgeNotificationQueue.filter(
        (notification) => notification.id !== id
      ),
    }));
  },

  // Helper function to get user-friendly error messages (sin cambios)
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

  // Check if user has voted for a story (sin cambios)
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

  // Toggle vote for a story (sin cambios)
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

// Initialize auth when the store is created - SOLO UNA VEZ
if (typeof window !== "undefined") {
  // Evitar inicialización múltiple en desarrollo
  const initOnce = () => {
    if (!authListenerUnsubscribe) {
      console.log("🎬 Inicializando AuthStore por primera vez...");
      useAuthStore.getState().initialize();
    } else {
      console.log("🚫 AuthStore ya inicializado, saltando...");
    }
  };

  // En desarrollo, añadir función de cleanup al window para debugging
  if (import.meta.env.DEV) {
    window.__authStoreCleanup = () => {
      useAuthStore.getState().cleanup();
    };
  }

  initOnce();
}
