// contexts/BadgeNotificationContext.jsx - VERSIÓN SIMPLIFICADA SIN LOOPS
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuthStore } from "../store/authStore";
import { useBadges } from "../hooks/useBadges";
import { supabase } from "../lib/supabase";
import BadgeNotification from "../components/BadgeNotification";
import FounderWelcome from "../components/FounderWelcome";

const BadgeNotificationContext = createContext();

function useBadgeNotifications() {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error(
      "useBadgeNotifications debe usarse dentro de BadgeNotificationProvider"
    );
  }
  return context;
}

export const BadgeNotificationProvider = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { checkFirstStoryBadge } = useBadges();

  // Estado de notificaciones
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFounderWelcome, setShowFounderWelcome] = useState(false); // ✅ Movido aquí

  // Referencias para evitar múltiples ejecuciones
  const hasCheckedOnLogin = useRef(false);
  const hasCheckedFounder = useRef(false);
  const lastCheckedUser = useRef(null);
  const processingTimeout = useRef(null);
  const isMounted = useRef(true);
  const isCheckingBadges = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ VERIFICAR Y OTORGAR BADGE DE FUNDADOR
  const checkAndGrantFounderBadge = async (userId) => {
    if (!userId || hasCheckedFounder.current) return;

    try {
      console.log("🎯 [CONTEXT] Verificando badge de fundador para:", userId);
      hasCheckedFounder.current = true;

      const LAUNCH_DATE = new Date("2025-07-08");
      const FOUNDER_PERIOD_DAYS = 30;
      const founderDeadline = new Date(
        LAUNCH_DATE.getTime() + FOUNDER_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      const now = new Date();

      if (now > founderDeadline) {
        console.log("⏰ [CONTEXT] Período de fundadores expirado");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_founder, badges, founded_at")
        .eq("id", userId)
        .single();

      const founderBadge = {
        id: "founder",
        name: "Fundador",
        description: "Miembro fundador de LiteraLab",
        icon: "🚀",
        rarity: "legendary",
        earnedAt: profile?.founded_at || new Date().toISOString(),
        isSpecial: true,
      };

      const currentBadges = profile?.badges || [];
      const hasFounderBadge = currentBadges.some((b) => b.id === "founder");

      // Si ya es fundador pero NO tiene el badge, agregarlo (no mostrar modal)
      if (profile?.is_founder && !hasFounderBadge) {
        const updatedBadges = [founderBadge, ...currentBadges];
        await supabase
          .from("user_profiles")
          .update({ badges: updatedBadges })
          .eq("id", userId);

        if (isMounted.current && user?.id === userId) {
          updateUser({
            is_founder: true,
            founded_at: profile.founded_at,
            badges: updatedBadges,
          });
        }
        // NO mostrar modal aquí
        return;
      }

      // Si ya es fundador y ya tiene el badge, no hacer nada
      if (profile?.is_founder && hasFounderBadge) {
        console.log("✅ [CONTEXT] Usuario ya es fundador y tiene el badge");
        return;
      }

      // Si NO es fundador, otorgar badge y marcar como fundador (mostrar modal SOLO aquí)
      if (!profile?.is_founder) {
        const updatedBadges = [founderBadge, ...currentBadges];
        const { data: updatedProfile, error } = await supabase
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
          console.error(
            "❌ [CONTEXT] Error otorgando badge de fundador:",
            error
          );
          return;
        }

        console.log("✅ [CONTEXT] Badge de fundador otorgado exitosamente");

        if (isMounted.current && user?.id === userId) {
          updateUser({
            is_founder: true,
            founded_at: updatedProfile.founded_at,
            badges: updatedProfile.badges,
          });
          // Mostrar modal SOLO la primera vez que se otorga el badge
          setTimeout(() => {
            if (isMounted.current) setShowFounderWelcome(true);
          }, 500);
        }
      }
    } catch (err) {
      console.error("💥 [CONTEXT] Error verificando badge de fundador:", err);
    }
  };

  // ✅ Agregar notificación a la cola (evitando duplicados estrictos)
  const queueNotification = React.useCallback((badge) => {
    if (!isMounted.current) return;

    // ✅ Verificar que no se haya agregado recientemente (debounce)
    const now = Date.now();
    const recentThreshold = 1000; // 1 segundo

    setNotificationQueue((prev) => {
      // ✅ Verificar duplicados más estrictos
      const exists = prev.some(
        (item) =>
          item.badge.id === badge.id && item.badge.earnedAt === badge.earnedAt
      );

      if (exists) {
        console.log(
          "⚠️ [CONTEXT] Badge duplicado en cola, saltando:",
          badge.name
        );
        return prev;
      }

      // ✅ Verificar duplicados recientes por timestamp
      const recentSimilar = prev.some(
        (item) =>
          item.badge.id === badge.id && now - item.timestamp < recentThreshold
      );

      if (recentSimilar) {
        console.log(
          "⚠️ [CONTEXT] Badge agregado recientemente, saltando:",
          badge.name
        );
        return prev;
      }

      console.log("📥 [CONTEXT] Agregando a cola:", badge.name);
      return [
        ...prev,
        {
          id: `${badge.id}-${badge.earnedAt}-${now}`, // ID único con timestamp
          badge,
          timestamp: now,
        },
      ];
    });
  }, []);

  // ✅ Procesar cola de notificaciones (una a la vez)
  useEffect(() => {
    if (notificationQueue.length > 0 && !currentNotification && !isProcessing) {
      const nextNotification = notificationQueue[0];
      setCurrentNotification(nextNotification);
      setIsProcessing(true);

      // Remover de la cola inmediatamente
      setNotificationQueue((prev) => prev.slice(1));

      console.log(
        "🎉 [CONTEXT] Mostrando notificación:",
        nextNotification.badge.name
      );
    }
  }, [notificationQueue, currentNotification, isProcessing]);

  // ✅ Cerrar modal de fundador
  const closeFounderWelcome = () => {
    setShowFounderWelcome(false);
  };

  // ✅ Cerrar notificación actual
  const closeCurrentNotification = () => {
    console.log("❌ [CONTEXT] Cerrando notificación actual");
    setCurrentNotification(null);

    // Delay antes de mostrar la siguiente
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
    }

    processingTimeout.current = setTimeout(() => {
      if (isMounted.current) {
        setIsProcessing(false);
      }
    }, 500);
  };

  // ✅ INICIALIZACIÓN ÚNICA POR USUARIO - SIN setState en useEffect
  useEffect(() => {
    let timeoutId;

    const initializeUser = async () => {
      if (!isAuthenticated || !user?.id) return;

      // Solo ejecutar si cambió el usuario
      if (lastCheckedUser.current === user.id) {
        console.log("🚫 [CONTEXT] Ya inicializado para este usuario");
        return;
      }

      console.log("🔄 [CONTEXT] Inicializando para usuario:", user.id);

      // Reset flags para nuevo usuario
      hasCheckedOnLogin.current = false;
      hasCheckedFounder.current = false;
      isCheckingBadges.current = false;
      lastCheckedUser.current = user.id;

      // Limpiar localStorage
      localStorage.removeItem("queued_badges");

      // ✅ Ejecutar verificación después de 2 segundos
      timeoutId = setTimeout(async () => {
        if (!isMounted.current || !user?.id) return;

        console.log("🎯 [CONTEXT] Verificando badges para:", user.id);

        try {
          // 1. Verificar badge de fundador
          await checkAndGrantFounderBadge(user.id);

          // 2. Verificar badges nuevos
          const { data: userProfile, error } = await supabase
            .from("user_profiles")
            .select("badges, last_badge_check, display_name")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("[CONTEXT] Error obteniendo perfil:", error);
            return;
          }

          const badges = userProfile?.badges || [];
          const lastCheck = userProfile?.last_badge_check;

          console.log(
            `📋 [CONTEXT] ${userProfile?.display_name || "Usuario"} tiene ${
              badges.length
            } badges`
          );

          if (badges.length === 0) return;

          // Encontrar badges nuevos (últimos 5 minutos si no hay last_check)
          const newBadges = badges.filter((badge) => {
            // Excluir badge de fundador
            if (badge.id === "founder") {
              console.log(
                "🚫 [CONTEXT] Saltando badge de fundador - ya tiene modal especial"
              );
              return false;
            }

            if (!lastCheck) {
              const badgeDate = new Date(badge.earnedAt);
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
              return badgeDate >= fiveMinutesAgo;
            }

            const badgeDate = new Date(badge.earnedAt);
            const lastCheckDate = new Date(lastCheck);
            return badgeDate > lastCheckDate;
          });

          console.log(
            `🆕 [CONTEXT] ${newBadges.length} badges nuevos encontrados`
          );

          if (newBadges.length > 0) {
            // Actualizar last_badge_check
            await supabase
              .from("user_profiles")
              .update({ last_badge_check: new Date().toISOString() })
              .eq("id", user.id);

            console.log("✅ [CONTEXT] last_badge_check actualizado");

            // Agregar badges a la cola
            newBadges.forEach((badge) => {
              if (isMounted.current) {
                console.log("🎉 [CONTEXT] Agregando a cola:", badge.name);
                queueNotification(badge);
              }
            });
          }

          hasCheckedOnLogin.current = true;
        } catch (err) {
          console.error("💥 [CONTEXT] Error verificando badges:", err);
        }
      }, 2000);
    };

    initializeUser();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, isAuthenticated]); // ✅ Solo estas dependencias básicas

  // ✅ Funciones específicas para tipos de badges
  const checkAndAwardFirstStoryBadge = React.useCallback(
    async (userId = user?.id) => {
      if (!userId || !isMounted.current)
        return { success: false, error: "Usuario no encontrado" };

      try {
        console.log(
          "🎯 [CONTEXT] Verificando badge de primera historia para:",
          userId
        );

        const result = await checkFirstStoryBadge(userId);

        if (result?.success && result?.isNew && result?.badge) {
          console.log(
            "🎉 [CONTEXT] Badge de primera historia otorgado, agregando a cola"
          );

          // Actualizar usuario en el store con el nuevo badge
          if (user?.id === userId) {
            const currentBadges = user.badges || [];
            const updatedBadges = [...currentBadges, result.badge];
            updateUser({ badges: updatedBadges });
          }

          // ✅ Usar setTimeout para evitar que se ejecute múltiples veces
          setTimeout(() => {
            if (isMounted.current) {
              queueNotification(result.badge);
            }
          }, 100);
        }

        return result;
      } catch (err) {
        console.error("[CONTEXT] Error checking first story badge:", err);
        return { success: false, error: err.message };
      }
    },
    [user?.id, checkFirstStoryBadge, updateUser, queueNotification]
  );

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      isMounted.current = false;
    };
  }, []);

  const contextValue = {
    // Estado
    notificationQueue,
    currentNotification,
    isProcessing,
    showFounderWelcome, // ✅ Exponer estado de fundador

    // Funciones principales
    queueNotification,
    closeCurrentNotification,
    closeFounderWelcome, // ✅ Exponer función para cerrar fundador

    // Funciones específicas
    checkFirstStoryBadge: checkAndAwardFirstStoryBadge,

    // Utilidades
    clearAllNotifications: () => {
      if (isMounted.current) {
        setNotificationQueue([]);
        setCurrentNotification(null);
        setIsProcessing(false);
        setShowFounderWelcome(false); // ✅ También limpiar modal de fundador
      }
    },
  };

  return (
    <BadgeNotificationContext.Provider value={contextValue}>
      {children}

      {/* ✅ MODAL ESPECIAL DE FUNDADOR - Solo este para badge de fundador */}
      <FounderWelcome
        isOpen={showFounderWelcome}
        onClose={closeFounderWelcome}
        badge={{
          id: "founder",
          name: "Fundador",
          description: "Miembro fundador de LiteraLab",
          icon: "🚀",
          rarity: "legendary",
          isSpecial: true,
        }}
      />

      {/* ✅ MODAL GENÉRICO DE BADGES - Para todos los otros badges */}
      {currentNotification && (
        <BadgeNotification
          badge={currentNotification.badge}
          isOpen={true}
          onClose={closeCurrentNotification}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
};

export { useBadgeNotifications };
