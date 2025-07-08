// hooks/useBadgeSystem.js - Sistema simplificado para lanzamiento
import { useCallback } from "react";
import { useBadges } from "./useBadges";
import { useBadgeNotifications } from "./useBadgeNotifications";
import { useAuthStore } from "../store/authStore";

export const useBadgeSystem = () => {
  const { user } = useAuthStore();
  const { checkFirstStoryBadge } = useBadges();
  const { showBadgeNotification } = useBadgeNotifications();

  // Función simplificada - solo verificar badge de primera historia
  const checkAndNotifyBadges = useCallback(
    async (userId = user?.id, context = "general") => {
      if (!userId) return;

      console.log(`🔍 Verificando badges (${context}) para:`, userId);

      try {
        const newBadges = [];

        // Solo verificar badge de primera historia cuando se envía una historia
        if (context === "story_submitted") {
          const firstStoryResult = await checkFirstStoryBadge(userId);
          if (firstStoryResult?.success && firstStoryResult?.isNew) {
            newBadges.push(firstStoryResult.badge);
            console.log("🎉 ¡Badge de primera historia otorgado!");
          }
        }

        // Mostrar notificaciones para badges nuevos (solo si es el usuario actual)
        if (userId === user?.id && newBadges.length > 0) {
          newBadges.forEach((badge, index) => {
            // Retrasar ligeramente cada notificación
            setTimeout(() => {
              console.log("🎉 Mostrando notificación de badge:", badge.name);
              showBadgeNotification(badge);
            }, index * 1000);
          });
        }

        return {
          success: true,
          badgesAwarded: newBadges.length,
          badges: newBadges,
        };
      } catch (err) {
        console.error("💥 Error en sistema de badges:", err);
        return { success: false, error: err.message };
      }
    },
    [user?.id, checkFirstStoryBadge, showBadgeNotification]
  );

  return {
    checkAndNotifyBadges,
  };
};
