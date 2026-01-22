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
        setBadgeDefinitions([]); // Set empty array instead of leaving undefined
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

      // Transformar datos y enriquecer con información del reto
      const transformedBadges = await Promise.all((data || []).map(async (item) => {
        let enhancedMetadata = { ...item.metadata };
        
        // Si el badge tiene contest_id, obtener información del reto
        if (item.metadata?.contest_id) {
          try {
            const { data: contestData, error: contestError } = await supabase
              .from('contests')
              .select('title, month')
              .eq('id', item.metadata.contest_id)
              .single();
            
            if (!contestError && contestData) {
              enhancedMetadata = {
                ...enhancedMetadata,
                contest_title: contestData.title,
                contest_month: contestData.month
              };
              
              // Obtener posición específica si es badge de ganador/finalista
              if (['contest_winner', 'contest_finalist'].includes(item.badge_id)) {
                const { data: storyData, error: storyError } = await supabase
                  .from('stories')
                  .select('winner_position')
                  .eq('user_id', userId)
                  .eq('contest_id', item.metadata.contest_id)
                  .eq('is_winner', true)
                  .single();
                
                if (!storyError && storyData) {
                  enhancedMetadata.position = storyData.winner_position;
                }
              }
            }
          } catch (error) {
            console.warn('Error enriching badge metadata:', error);
          }
        }
        
        return {
          ...item.badge_definitions,
          earned_at: item.earned_at,
          metadata: enhancedMetadata,
        };
      }));

      setUserBadges(transformedBadges);
    } catch (err) {
      console.error("Error loading user badges:", err);
      setError(err.message);
      setUserBadges([]); // Set empty array to prevent loops
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
      // Obtener historias publicadas
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("id, is_winner, winner_position, contest_id")
        .eq("user_id", userId)
        .not("published_at", "is", null);

      if (storiesError) throw storiesError;

      const storyCount = stories?.length || 0;
      // Solo contar victorias en primer lugar
      const contestWins =
        stories?.filter((story) => story.is_winner && story.winner_position === 1).length || 0;
      // Contar retos únicos participados
      const contestParticipations = new Set(
        stories?.filter((s) => s.contest_id).map((s) => s.contest_id)
      ).size;

      // Obtener autores únicos leídos
      const { data: reads, error: readsError } = await supabase
        .from("user_story_reads")
        .select("story_id, stories(user_id)")
        .eq("user_id", userId);

      let uniqueAuthorsRead = 0;
      if (!readsError && reads) {
        const authorIds = new Set(
          reads
            .filter((r) => r.stories?.user_id && r.stories.user_id !== userId)
            .map((r) => r.stories.user_id)
        );
        uniqueAuthorsRead = authorIds.size;
      }

      // Obtener retos donde ha votado
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("story_id, stories(contest_id)")
        .eq("user_id", userId);

      let contestsVoted = 0;
      if (!votesError && votes) {
        const contestIds = new Set(
          votes
            .filter((v) => v.stories?.contest_id)
            .map((v) => v.stories.contest_id)
        );
        contestsVoted = contestIds.size;
      }

      return {
        storyCount,
        contestWins,
        contestParticipations,
        uniqueAuthorsRead,
        contestsVoted,
      };
    } catch (err) {
      console.error("Error getting user stats:", err);
      return {
        storyCount: 0,
        contestWins: 0,
        contestParticipations: 0,
        uniqueAuthorsRead: 0,
        contestsVoted: 0
      };
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

      // Mapear categoría a estadística correspondiente
      const categoryToStat = {
        story_count: stats.storyCount,
        contest_wins: stats.contestWins,
        contest_participation: stats.contestParticipations,
        unique_authors_read: stats.uniqueAuthorsRead,
        contests_voted: stats.contestsVoted,
      };

      const currentValue = categoryToStat[category] || 0;

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
