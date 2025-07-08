// hooks/useBadgeNotifications.js - Conectado con authStore
import { useAuthStore } from "../store/authStore";

export const useBadgeNotifications = () => {
  const {
    badgeNotificationQueue,
    queueBadgeNotification,
    removeBadgeNotification,
  } = useAuthStore();

  const showBadgeNotification = (badge) => {
    console.log("🎉 Agregando notificación de badge a la cola:", badge.name);
    queueBadgeNotification(badge);
  };

  const hideBadgeNotification = (id) => {
    removeBadgeNotification(id);
  };

  const clearAllNotifications = () => {
    // Limpiar todas las notificaciones
    badgeNotificationQueue.forEach((notification) => {
      removeBadgeNotification(notification.id);
    });
  };

  return {
    notifications: badgeNotificationQueue,
    showBadgeNotification,
    hideBadgeNotification,
    clearAllNotifications,
  };
};
