// hooks/useBadges.js - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useGlobalApp } from "../contexts/GlobalAppContext"; // ✅ CAMBIADO
import { supabase } from "../lib/supabase";

// Definición de badges disponibles
const BADGE_DEFINITIONS = {
  first_story: {
    id: "first_story",
    name: "Primera Historia",
    description: "Escribiste tu primera historia en LiteraLab",
    icon: "🎯",
    rarity: "common",
    points: 10,
  },
  contest_winner: {
    id: "contest_winner",
    name: "Ganador de Concurso",
    description: "Ganaste un concurso mensual",
    icon: "🏆",
    rarity: "rare",
    points: 100,
  },
  participation_streak_3: {
    id: "participation_streak_3",
    name: "Racha de Participación",
    description: "Participaste en 3 concursos consecutivos",
    icon: "🔥",
    rarity: "uncommon",
    points: 25,
  },
  participation_streak_5: {
    id: "participation_streak_5",
    name: "Escritor Consistente",
    description: "Participaste en 5 concursos consecutivos",
    icon: "⚡",
    rarity: "rare",
    points: 50,
  },
  participation_streak_10: {
    id: "participation_streak_10",
    name: "Leyenda Literaria",
    description: "Participaste en 10 concursos consecutivos",
    icon: "👑",
    rarity: "legendary",
    points: 100,
  },
  popular_author_50: {
    id: "popular_author_50",
    name: "Autor Popular",
    description: "Recibiste 50 likes en total",
    icon: "⭐",
    rarity: "uncommon",
    points: 30,
  },
  popular_author_100: {
    id: "popular_author_100",
    name: "Autor Querido",
    description: "Recibiste 100 likes en total",
    icon: "💫",
    rarity: "rare",
    points: 60,
  },
  popular_author_500: {
    id: "popular_author_500",
    name: "Fenómeno Literario",
    description: "Recibiste 500 likes en total",
    icon: "🌟",
    rarity: "legendary",
    points: 150,
  },
  early_adopter: {
    id: "early_adopter",
    name: "Adoptador Temprano",
    description: "Te uniste a LiteraLab en sus primeros días",
    icon: "🚀",
    rarity: "epic",
    points: 75,
  },
  community_supporter: {
    id: "community_supporter",
    name: "Soporte de la Comunidad",
    description: "Votaste por 50 historias diferentes",
    icon: "❤️",
    rarity: "uncommon",
    points: 40,
  },
  prolific_writer: {
    id: "prolific_writer",
    name: "Escritor Prolífico",
    description: "Publicaste 10 historias",
    icon: "📝",
    rarity: "rare",
    points: 80,
  },
};

export const useBadges = () => {
  // ✅ USO DEL CONTEXTO GLOBAL EN LUGAR DE AUTHSTORE
  const { user, isAuthenticated, updateUser } = useGlobalApp();

  const getBadgeDefinition = (badgeId) => {
    return BADGE_DEFINITIONS[badgeId] || null;
  };

  const getAllBadgeDefinitions = () => {
    return Object.values(BADGE_DEFINITIONS);
  };

  const getUserBadges = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select(
          `
          badge_id,
          earned_at,
          metadata
        `
        )
        .eq("user_id", userId);

      if (error) throw error;

      return data.map((badge) => ({
        ...getBadgeDefinition(badge.badge_id),
        earned_at: badge.earned_at,
        metadata: badge.metadata,
      }));
    } catch (error) {
      console.error("Error fetching user badges:", error);
      return [];
    }
  };

  const hasUserBadge = async (userId, badgeId) => {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking user badge:", error);
      return false;
    }
  };

  const awardBadge = async (userId, badgeId, metadata = {}) => {
    if (!isAuthenticated) {
      return { success: false, error: "No authenticated" };
    }

    try {
      // Verificar si el usuario ya tiene este badge
      const alreadyHas = await hasUserBadge(userId, badgeId);
      if (alreadyHas) {
        return { success: true, newBadge: false };
      }

      const badgeDefinition = getBadgeDefinition(badgeId);
      if (!badgeDefinition) {
        return { success: false, error: "Badge definition not found" };
      }

      // Otorgar el badge
      const { error: insertError } = await supabase.from("user_badges").insert([
        {
          user_id: userId,
          badge_id: badgeId,
          metadata: metadata,
          earned_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // Actualizar puntos del usuario
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          total_points: supabase.raw(
            `total_points + ${badgeDefinition.points}`
          ),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Actualizar el contexto del usuario si es el usuario actual
      if (user && user.id === userId) {
        const updatedBadges = await getUserBadges(userId);
        updateUser({
          badges: updatedBadges,
          total_points: (user.total_points || 0) + badgeDefinition.points,
        });
      }

      console.log(
        `🎖️ Badge awarded: ${badgeDefinition.name} to user ${userId}`
      );

      return {
        success: true,
        newBadge: true,
        badge: badgeDefinition,
      };
    } catch (error) {
      console.error("Error awarding badge:", error);
      return { success: false, error: error.message };
    }
  };

  const removeBadge = async (userId, badgeId) => {
    if (!isAuthenticated) {
      return { success: false, error: "No authenticated" };
    }

    try {
      const badgeDefinition = getBadgeDefinition(badgeId);
      if (!badgeDefinition) {
        return { success: false, error: "Badge definition not found" };
      }

      // Remover el badge
      const { error: deleteError } = await supabase
        .from("user_badges")
        .delete()
        .eq("user_id", userId)
        .eq("badge_id", badgeId);

      if (deleteError) throw deleteError;

      // Actualizar puntos del usuario (restar)
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          total_points: supabase.raw(
            `GREATEST(total_points - ${badgeDefinition.points}, 0)`
          ),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Actualizar el contexto del usuario si es el usuario actual
      if (user && user.id === userId) {
        const updatedBadges = await getUserBadges(userId);
        updateUser({
          badges: updatedBadges,
          total_points: Math.max(
            0,
            (user.total_points || 0) - badgeDefinition.points
          ),
        });
      }

      console.log(
        `🗑️ Badge removed: ${badgeDefinition.name} from user ${userId}`
      );

      return { success: true };
    } catch (error) {
      console.error("Error removing badge:", error);
      return { success: false, error: error.message };
    }
  };

  const checkAndAwardAutomaticBadges = async (userId) => {
    if (!isAuthenticated) return;

    try {
      // Obtener estadísticas del usuario
      const { data: userStats, error: statsError } = await supabase
        .from("user_profiles")
        .select(
          `
          total_stories,
          total_likes,
          wins_count,
          created_at
        `
        )
        .eq("id", userId)
        .single();

      if (statsError) throw statsError;

      const results = [];

      // Badge de primera historia
      if (userStats.total_stories >= 1) {
        const result = await awardBadge(userId, "first_story");
        if (result.newBadge) results.push(result);
      }

      // Badge de autor prolífico
      if (userStats.total_stories >= 10) {
        const result = await awardBadge(userId, "prolific_writer");
        if (result.newBadge) results.push(result);
      }

      // Badges de popularidad
      if (userStats.total_likes >= 50) {
        const result = await awardBadge(userId, "popular_author_50");
        if (result.newBadge) results.push(result);
      }
      if (userStats.total_likes >= 100) {
        const result = await awardBadge(userId, "popular_author_100");
        if (result.newBadge) results.push(result);
      }
      if (userStats.total_likes >= 500) {
        const result = await awardBadge(userId, "popular_author_500");
        if (result.newBadge) results.push(result);
      }

      // Badge de adoptador temprano (registrado en los primeros 30 días)
      const accountAge = new Date() - new Date(userStats.created_at);
      const daysSinceJoin = accountAge / (1000 * 60 * 60 * 24);

      // Solo otorgar si la cuenta tiene menos de 30 días y la plataforma existe hace más de 30 días
      if (daysSinceJoin <= 30) {
        const result = await awardBadge(userId, "early_adopter");
        if (result.newBadge) results.push(result);
      }

      return results;
    } catch (error) {
      console.error("Error checking automatic badges:", error);
      return [];
    }
  };

  return {
    getBadgeDefinition,
    getAllBadgeDefinitions,
    getUserBadges,
    hasUserBadge,
    awardBadge,
    removeBadge,
    checkAndAwardAutomaticBadges,
  };
};
