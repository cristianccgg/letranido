// contexts/BadgeNotificationContext.jsx - ACTUALIZADO PARA CONTEXTO GLOBAL
import { createContext, useContext, useState } from "react";
import { useGlobalApp } from "./GlobalAppContext"; // ✅ CAMBIADO
import { useBadges } from "../hooks/useBadges";

const BadgeNotificationContext = createContext();

export const BadgeNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // ✅ USO DEL CONTEXTO GLOBAL EN LUGAR DE AUTHSTORE
  const { user, isAuthenticated } = useGlobalApp();
  const { awardBadge } = useBadges();

  const showBadgeNotification = (badge) => {
    const notification = {
      id: Date.now(),
      badge,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  };

  const removeBadgeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const checkFirstStoryBadge = async (userId) => {
    if (!isAuthenticated || !user) return;

    try {
      const result = await awardBadge(userId, "first_story");
      if (result.success && result.newBadge) {
        showBadgeNotification(result.badge);
      }
    } catch (error) {
      console.error("Error checking first story badge:", error);
    }
  };

  const checkWinnerBadge = async (userId, contestTitle) => {
    if (!isAuthenticated || !user) return;

    try {
      const result = await awardBadge(userId, "contest_winner", {
        contestTitle,
      });
      if (result.success && result.newBadge) {
        showBadgeNotification(result.badge);
      }
    } catch (error) {
      console.error("Error checking winner badge:", error);
    }
  };

  const checkStreakBadge = async (userId, streakCount) => {
    if (!isAuthenticated || !user) return;

    try {
      let badgeType = null;
      if (streakCount >= 3) badgeType = "participation_streak_3";
      if (streakCount >= 5) badgeType = "participation_streak_5";
      if (streakCount >= 10) badgeType = "participation_streak_10";

      if (badgeType) {
        const result = await awardBadge(userId, badgeType, { streakCount });
        if (result.success && result.newBadge) {
          showBadgeNotification(result.badge);
        }
      }
    } catch (error) {
      console.error("Error checking streak badge:", error);
    }
  };

  const checkPopularityBadge = async (userId, totalLikes) => {
    if (!isAuthenticated || !user) return;

    try {
      let badgeType = null;
      if (totalLikes >= 50) badgeType = "popular_author_50";
      if (totalLikes >= 100) badgeType = "popular_author_100";
      if (totalLikes >= 500) badgeType = "popular_author_500";

      if (badgeType) {
        const result = await awardBadge(userId, badgeType, { totalLikes });
        if (result.success && result.newBadge) {
          showBadgeNotification(result.badge);
        }
      }
    } catch (error) {
      console.error("Error checking popularity badge:", error);
    }
  };

  const showFounderWelcome = () => {
    if (!user?.is_founder) return;

    const founderBadge = {
      id: "founder",
      name: "Miembro Fundador",
      description: "Parte de los primeros usuarios de LiteraLab",
      icon: "🚀",
      rarity: "legendary",
      isSpecial: true,
    };

    showBadgeNotification(founderBadge);
  };

  const value = {
    notifications,
    showBadgeNotification,
    removeBadgeNotification,
    checkFirstStoryBadge,
    checkWinnerBadge,
    checkStreakBadge,
    checkPopularityBadge,
    showFounderWelcome,
  };

  return (
    <BadgeNotificationContext.Provider value={value}>
      {children}
    </BadgeNotificationContext.Provider>
  );
};

export const useBadgeNotifications = () => {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error(
      "useBadgeNotifications must be used within BadgeNotificationProvider"
    );
  }
  return context;
};

// El componente solo gestiona notificaciones, no afecta el estado principal.
