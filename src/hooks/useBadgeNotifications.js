// hooks/useBadgeNotifications.js
import { useState, useCallback } from "react";

export const useBadgeNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const showBadgeNotification = useCallback((badge) => {
    const id = Date.now() + Math.random(); // ID único
    const notification = { id, badge, isVisible: true };

    setNotifications((prev) => [...prev, notification]);

    console.log("🎉 Mostrando notificación de badge:", badge.name);
  }, []);

  const hideBadgeNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isVisible: false } : notif
      )
    );

    // Remover de la lista después de la animación
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 500);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showBadgeNotification,
    hideBadgeNotification,
    clearAllNotifications,
  };
};
