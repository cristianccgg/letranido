// hooks/useBadges.js - Hook para manejar lógica de badges
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useBadges = (userId) => {
  const [userBadges, setUserBadges] = useState([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar definiciones de badges (solo una vez)
  useEffect(() => {
    const loadBadgeDefinitions = async () => {
      try {
        const { data, error } = await supabase
          .from("badge_definitions")
          .select("*")
          .order("tier", { ascending: true });

        if (error) throw error;
        setBadgeDefinitions(data || []);
      } catch (err) {
        console.error("Error loading badge definitions:", err);
        setError(err.message);
      }
    };

    loadBadgeDefinitions();
  }, []);

  // Cargar badges del usuario
  const loadUserBadges = useCallback(async () => {
    if (!userId) {
      setUserBadges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_badges")
        .select(
          `
          *,
          badge_definitions (
            id,
            name,
            description,
            icon,
            color,
            tier
          )
        `
        )
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;

      // Transformar datos para facilitar el uso
      const transformedBadges = (data || []).map((item) => ({
        ...item.badge_definitions,
        earned_at: item.earned_at,
        metadata: item.metadata,
      }));

      setUserBadges(transformedBadges);
    } catch (err) {
      console.error("Error loading user badges:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar badges cuando cambie el usuario
  useEffect(() => {
    loadUserBadges();
  }, [loadUserBadges]);

  // Verificar si el usuario tiene un badge específico
  const hasBadge = useCallback(
    (badgeId) => {
      return userBadges.some((badge) => badge.id === badgeId);
    },
    [userBadges]
  );

  // Obtener estadísticas del usuario para calcular progreso
  const getUserStats = useCallback(async () => {
    if (!userId) return null;

    try {
      // Obtener conteo de historias
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("id, is_winner")
        .eq("user_id", userId)
        .not("published_at", "is", null);

      if (storiesError) throw storiesError;

      const storyCount = stories?.length || 0;
      const contestWins =
        stories?.filter((story) => story.is_winner).length || 0;

      return {
        storyCount,
        contestWins,
      };
    } catch (err) {
      console.error("Error getting user stats:", err);
      return null;
    }
  }, [userId]);

  // Obtener el siguiente badge por conseguir
  const getNextBadge = useCallback(
    async (category = "story_count") => {
      const stats = await getUserStats();
      if (!stats) return null;

      // Filtrar badges por categoría y que no tenga el usuario
      const availableBadges = badgeDefinitions.filter((badge) => {
        const criteria = badge.criteria || {};
        const hasCorrectType = criteria.type === category;
        const doesntHaveBadge = !hasBadge(badge.id);

        return hasCorrectType && doesntHaveBadge;
      });

      if (availableBadges.length === 0) return null;

      // Ordenar por threshold y tomar el más cercano
      const sortedBadges = availableBadges.sort((a, b) => {
        const thresholdA = a.criteria?.threshold || 0;
        const thresholdB = b.criteria?.threshold || 0;
        return thresholdA - thresholdB;
      });

      // Encontrar el siguiente badge que puede conseguir
      const currentValue =
        category === "story_count" ? stats.storyCount : stats.contestWins;

      for (const badge of sortedBadges) {
        const threshold = badge.criteria?.threshold || 0;
        if (currentValue < threshold) {
          return {
            ...badge,
            currentValue,
            progress: Math.min((currentValue / threshold) * 100, 100),
          };
        }
      }

      return null;
    },
    [badgeDefinitions, hasBadge, getUserStats]
  );

  // Verificar y otorgar badges automáticamente
  const checkAndAwardBadges = useCallback(async () => {
    if (!userId) return [];

    try {
      // Llamar a la función de la base de datos
      const { data, error } = await supabase.rpc("check_and_award_badges", {
        target_user_id: userId,
      });

      if (error) throw error;

      // Si se otorgaron nuevos badges, recargar la lista
      if (data && data.length > 0) {
        await loadUserBadges();
        return data; // Retornar nuevos badges para mostrar notificación
      }

      return [];
    } catch (err) {
      console.error("Error checking badges:", err);
      return [];
    }
  }, [userId, loadUserBadges]);

  // Otorgar badge específico (para ganadores de concursos)
  const awardSpecificBadge = useCallback(
    async (badgeType, contestId = null) => {
      if (!userId) return false;

      try {
        const { data, error } = await supabase.rpc("award_specific_badge", {
          target_user_id: userId,
          badge_type: badgeType,
          contest_id: contestId,
        });

        if (error) throw error;

        // Si se otorgó el badge, recargar la lista
        if (data) {
          await loadUserBadges();
        }

        return data;
      } catch (err) {
        console.error("Error awarding specific badge:", err);
        return false;
      }
    },
    [userId, loadUserBadges]
  );

  // Obtener badges por categoría
  const getBadgesByCategory = useCallback(
    (category) => {
      return userBadges.filter((badge) => {
        const criteria = badge.criteria || {};
        return criteria.type === category;
      });
    },
    [userBadges]
  );

  // Obtener estadísticas resumidas
  const getBadgeStats = useCallback(() => {
    const totalBadges = userBadges.length;
    const badgesByTier = userBadges.reduce((acc, badge) => {
      acc[badge.tier] = (acc[badge.tier] || 0) + 1;
      return acc;
    }, {});

    return {
      total: totalBadges,
      bronze: badgesByTier[1] || 0,
      silver: badgesByTier[2] || 0,
      gold: badgesByTier[3] || 0,
    };
  }, [userBadges]);

  return {
    userBadges,
    badgeDefinitions,
    loading,
    error,

    // Métodos de consulta
    hasBadge,
    getUserStats,
    getNextBadge,
    getBadgesByCategory,
    getBadgeStats,

    // Métodos de acción
    checkAndAwardBadges,
    awardSpecificBadge,
    refreshBadges: loadUserBadges,
  };
};
