import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useBadgeNotifications } from "../hooks/useBadgeNotifications";
import BadgeNotification from "./BadgeNotification";
import { supabase } from "../lib/supabase";

const BadgeNotificationManager = () => {
  const { user } = useAuthStore();
  const { notifications, hideBadgeNotification } = useBadgeNotifications();
  const [currentBadge, setCurrentBadge] = useState(null);
  const [checkedForBadges, setCheckedForBadges] = useState(false);

  // Verificar badges nuevos cuando el usuario se autentica
  useEffect(() => {
    if (user && !checkedForBadges) {
      checkForNewBadges();
      setCheckedForBadges(true);
    }
  }, [user, checkedForBadges]);

  // Mostrar notificaciones en cola
  useEffect(() => {
    if (notifications.length > 0 && !currentBadge) {
      const nextNotification = notifications[0];
      setCurrentBadge(nextNotification.badge);
    }
  }, [notifications, currentBadge]);

  const checkForNewBadges = async () => {
    if (!user?.id) return;

    try {
      console.log("🔍 Verificando badges nuevos para:", user.display_name);

      // Obtener todos los badges del usuario
      const { data: userProfile, error } = await supabase
        .from("user_profiles")
        .select("badges, last_badge_check")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error obteniendo badges:", error);
        return;
      }

      const badges = userProfile?.badges || [];
      const lastCheck = userProfile?.last_badge_check;

      console.log("📋 Badges encontrados:", badges.length);

      if (badges.length === 0) return;

      // Encontrar badges que no han sido mostrados
      const newBadges = badges.filter((badge) => {
        // Si no hay last_check, mostrar badges de las últimas 24 horas
        if (!lastCheck) {
          const badgeDate = new Date(badge.earnedAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return badgeDate >= oneDayAgo;
        }

        // Mostrar badges posteriores al último check
        const badgeDate = new Date(badge.earnedAt);
        const lastCheckDate = new Date(lastCheck);
        return badgeDate > lastCheckDate;
      });

      console.log("🆕 Badges nuevos a mostrar:", newBadges.length);

      if (newBadges.length > 0) {
        // Mostrar badges con delay entre cada uno
        newBadges.forEach((badge, index) => {
          setTimeout(() => {
            console.log("🎉 Mostrando badge:", badge.name);
            showBadgeNotification(badge);
          }, index * 1000);
        });

        // Actualizar last_badge_check
        await supabase
          .from("user_profiles")
          .update({ last_badge_check: new Date().toISOString() })
          .eq("id", user.id);

        console.log("✅ last_badge_check actualizado");
      }
    } catch (err) {
      console.error("💥 Error verificando badges nuevos:", err);
    }
  };

  const showBadgeNotification = (badge) => {
    const { queueBadgeNotification } = useAuthStore.getState();
    queueBadgeNotification(badge);
  };

  const handleCloseBadge = () => {
    if (currentBadge) {
      // Remover la notificación actual de la cola
      if (notifications.length > 0) {
        hideBadgeNotification(notifications[0].id);
      }
      setCurrentBadge(null);
    }
  };

  return (
    <>
      {currentBadge && (
        <BadgeNotification
          badge={currentBadge}
          isOpen={true}
          onClose={handleCloseBadge}
        />
      )}
    </>
  );
};

export default BadgeNotificationManager;
