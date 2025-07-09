// hooks/useBadges.js
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export const useBadges = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Definición de badges esenciales para el lanzamiento
  const BADGE_DEFINITIONS = {
    // Badge de comunidad
    founder: {
      id: "founder",
      name: "Fundador",
      description: "Miembro fundador de LiteraLab",
      icon: "🚀",
      rarity: "legendary",
      isSpecial: true,
      category: "community",
    },

    // Badge de primera participación
    first_story: {
      id: "first_story",
      name: "Primera Historia",
      description: "Escribió su primera historia",
      icon: "✍️",
      rarity: "common",
      category: "writing",
    },

    // Badges de concursos
    contest_winner: {
      id: "contest_winner",
      name: "Ganador",
      description: "Ganó un concurso mensual",
      icon: "🏆",
      rarity: "epic",
      category: "contest",
    },
    contest_second: {
      id: "contest_second",
      name: "Segundo Lugar",
      description: "Obtuvo el segundo lugar en un concurso",
      icon: "🥈",
      rarity: "rare",
      category: "contest",
    },
    contest_third: {
      id: "contest_third",
      name: "Tercer Lugar",
      description: "Obtuvo el tercer lugar en un concurso",
      icon: "🥉",
      rarity: "rare",
      category: "contest",
    },
  };

  // Función genérica para otorgar badges
  const awardBadge = useCallback(
    async (badgeId, userId = user?.id, extraData = {}) => {
      if (!userId) {
        return { success: false, error: "Usuario no encontrado" };
      }

      if (!BADGE_DEFINITIONS[badgeId]) {
        return { success: false, error: "Badge no válido" };
      }

      if (isMounted.current) setLoading(true);
      try {
        console.log(`🏆 Otorgando badge ${badgeId} a usuario ${userId}`);

        // Obtener badges actuales del usuario
        const { data: currentProfile, error: fetchError } = await supabase
          .from("user_profiles")
          .select("badges")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error("Error fetching user profile:", fetchError);
          throw fetchError;
        }

        const currentBadges = currentProfile?.badges || [];

        // Verificar si el badge ya existe
        const badgeExists = currentBadges.some((badge) => badge.id === badgeId);
        if (badgeExists) {
          console.log(`✅ Usuario ya tiene el badge ${badgeId}`);
          return { success: true, alreadyExists: true };
        }

        // Crear el nuevo badge
        const badgeDefinition = BADGE_DEFINITIONS[badgeId];
        const newBadge = {
          ...badgeDefinition,
          earnedAt: new Date().toISOString(),
          ...extraData, // Para datos específicos como contestId, etc.
        };

        const updatedBadges = [...currentBadges, newBadge];

        // Actualizar la base de datos
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ badges: updatedBadges })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating badges:", updateError);
          throw updateError;
        }

        console.log(`✅ Badge ${badgeId} otorgado exitosamente`);
        if (isMounted.current) setLoading(false);
        return {
          success: true,
          badge: newBadge,
          isNew: true,
        };
      } catch (err) {
        console.error(`💥 Error otorgando badge ${badgeId}:`, err);
        if (isMounted.current) setLoading(false);
        return {
          success: false,
          error: err.message || "Error al otorgar badge",
        };
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [user?.id]
  );

  // 1. Badge de fundador
  const grantFounderBadge = useCallback(
    async (userId = user?.id) => {
      return await awardBadge("founder", userId);
    },
    [awardBadge, user?.id]
  );

  // 2. Badge por primera historia
  const checkFirstStoryBadge = useCallback(
    async (userId = user?.id) => {
      if (!userId) return { success: false, error: "Usuario no encontrado" };

      try {
        // Verificar si es la primera historia del usuario
        const { count } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (count === 1) {
          console.log("🎯 ¡Primera historia detectada! Otorgando badge...");
          const result = await awardBadge("first_story", userId);
          return result;
        }

        return { success: true, alreadyExists: false };
      } catch (err) {
        console.error("Error checking first story badge:", err);
        return { success: false, error: err.message };
      }
    },
    [awardBadge, user?.id]
  );

  // 3. Badges de popularidad
  const checkPopularityBadges = useCallback(
    async (userId = user?.id) => {
      if (!userId) return { success: false, error: "Usuario no encontrado" };

      try {
        // Obtener total de likes del usuario
        const { data: stories } = await supabase
          .from("stories")
          .select("likes_count")
          .eq("user_id", userId);

        if (!stories) return { success: true, badges: [] };

        const totalLikes = stories.reduce(
          (sum, story) => sum + (story.likes_count || 0),
          0
        );
        const newBadges = [];

        // Badge de autor popular (100+ likes totales)
        if (totalLikes >= 100) {
          const result = await awardBadge("popular_author", userId);
          if (result.success && result.isNew) {
            newBadges.push(result.badge);
          }
        }

        // Badge de historia viral (50+ likes en una historia)
        const hasViralStory = stories.some(
          (story) => (story.likes_count || 0) >= 50
        );
        if (hasViralStory) {
          const result = await awardBadge("viral_story", userId);
          if (result.success && result.isNew) {
            newBadges.push(result.badge);
          }
        }

        return { success: true, badges: newBadges };
      } catch (err) {
        console.error("Error checking popularity badges:", err);
        return { success: false, error: err.message };
      }
    },
    [awardBadge, user?.id]
  );

  // 4. Badges de participación
  const checkParticipationBadges = useCallback(
    async (userId = user?.id) => {
      if (!userId) return;

      try {
        // Contar historias totales
        const { count: totalStories } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Badge de escritor prolífico
        if (totalStories >= 10) {
          await awardBadge("prolific_writer", userId);
        }

        // Contar participaciones en concursos únicos
        const { data: contests } = await supabase
          .from("stories")
          .select("contest_id")
          .eq("user_id", userId);

        if (contests) {
          const uniqueContests = new Set(contests.map((s) => s.contest_id))
            .size;

          // Badge de escritor consistente (5+ concursos)
          if (uniqueContests >= 5) {
            await awardBadge("consistent_writer", userId);
          }
        }
      } catch (err) {
        console.error("Error checking participation badges:", err);
      }
    },
    [awardBadge, user?.id]
  );

  // 5. Badges de comunidad
  const checkCommunityBadges = useCallback(
    async (userId = user?.id) => {
      if (!userId) return;

      try {
        // Contar votos dados por el usuario
        const { count: votesGiven } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Badge de votante activo
        if (votesGiven >= 100) {
          await awardBadge("helpful_voter", userId);
        }
      } catch (err) {
        console.error("Error checking community badges:", err);
      }
    },
    [awardBadge, user?.id]
  );

  // Función principal para verificar TODOS los badges automáticos
  const checkAllAutomaticBadges = useCallback(
    async (userId = user?.id) => {
      if (!userId) return;

      console.log("🔍 Verificando todos los badges automáticos para:", userId);

      try {
        await Promise.all([
          checkFirstStoryBadge(userId),
          checkPopularityBadges(userId),
          checkParticipationBadges(userId),
          checkCommunityBadges(userId),
        ]);
      } catch (err) {
        console.error("Error checking automatic badges:", err);
      }
    },
    [
      checkFirstStoryBadge,
      checkPopularityBadges,
      checkParticipationBadges,
      checkCommunityBadges,
      user?.id,
    ]
  );

  // Función para verificar status de fundador
  const checkFounderStatus = useCallback(
    async (userId = user?.id) => {
      if (!userId) return false;

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_founder, founded_at, badges")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error checking founder status:", error);
          return false;
        }

        return {
          isFounder: data?.is_founder || false,
          foundedAt: data?.founded_at,
          badges: data?.badges || [],
        };
      } catch (err) {
        console.error("Error checking founder status:", err);
        return false;
      }
    },
    [user?.id]
  );

  return {
    loading,
    BADGE_DEFINITIONS,

    // Funciones generales
    awardBadge,
    checkAllAutomaticBadges,

    // Funciones específicas
    grantFounderBadge,
    checkFirstStoryBadge,
    checkPopularityBadges,
    checkParticipationBadges,
    checkCommunityBadges,
    checkFounderStatus,
  };
};
