// hooks/useBadges.js
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export const useBadges = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // Definición de todos los badges disponibles
  const BADGE_DEFINITIONS = {
    // Badges de inicio/comunidad
    founder: {
      id: "founder",
      name: "Fundador",
      description: "Miembro fundador de LiteraLab",
      icon: "🚀",
      rarity: "legendary",
      isSpecial: true,
      category: "community",
    },
    first_story: {
      id: "first_story",
      name: "Primera Historia",
      description: "Escribió su primera historia",
      icon: "✍️",
      rarity: "common",
      category: "writing",
    },
    early_adopter: {
      id: "early_adopter",
      name: "Adoptador Temprano",
      description: "Se unió en los primeros 100 usuarios",
      icon: "🌟",
      rarity: "rare",
      category: "community",
    },

    // Badges de concursos - Ganadores
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

    // Badges de logros múltiples
    triple_winner: {
      id: "triple_winner",
      name: "Triple Campeón",
      description: "Ganó 3 concursos",
      icon: "👑",
      rarity: "legendary",
      category: "achievement",
    },
    serial_winner: {
      id: "serial_winner",
      name: "Campeón Serial",
      description: "Ganó 5 concursos",
      icon: "🎖️",
      rarity: "legendary",
      category: "achievement",
    },

    // Badges de popularidad
    popular_author: {
      id: "popular_author",
      name: "Autor Popular",
      description: "Recibió más de 100 likes en total",
      icon: "⭐",
      rarity: "rare",
      category: "popularity",
    },
    viral_story: {
      id: "viral_story",
      name: "Historia Viral",
      description: "Una historia recibió más de 50 likes",
      icon: "🔥",
      rarity: "epic",
      category: "popularity",
    },

    // Badges de participación
    consistent_writer: {
      id: "consistent_writer",
      name: "Escritor Consistente",
      description: "Participó en 5 concursos consecutivos",
      icon: "📚",
      rarity: "rare",
      category: "participation",
    },
    prolific_writer: {
      id: "prolific_writer",
      name: "Escritor Prolífico",
      description: "Escribió más de 10 historias",
      icon: "📝",
      rarity: "rare",
      category: "writing",
    },

    // Badges de comunidad
    helpful_voter: {
      id: "helpful_voter",
      name: "Votante Activo",
      description: "Dio más de 100 likes a otras historias",
      icon: "👍",
      rarity: "common",
      category: "community",
    },
    critic: {
      id: "critic",
      name: "Crítico",
      description: "Dejó comentarios útiles en historias",
      icon: "💬",
      rarity: "common",
      category: "community",
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

      setLoading(true);
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
        return {
          success: true,
          badge: newBadge,
          isNew: true,
        };
      } catch (err) {
        console.error(`💥 Error otorgando badge ${badgeId}:`, err);
        return {
          success: false,
          error: err.message || "Error al otorgar badge",
        };
      } finally {
        setLoading(false);
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
      if (!userId) return;

      try {
        // Verificar si es la primera historia del usuario
        const { count } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (count === 1) {
          await awardBadge("first_story", userId);
        }
      } catch (err) {
        console.error("Error checking first story badge:", err);
      }
    },
    [awardBadge, user?.id]
  );

  // 3. Badges de popularidad
  const checkPopularityBadges = useCallback(
    async (userId = user?.id) => {
      if (!userId) return;

      try {
        // Obtener total de likes del usuario
        const { data: stories } = await supabase
          .from("stories")
          .select("likes_count")
          .eq("user_id", userId);

        if (!stories) return;

        const totalLikes = stories.reduce(
          (sum, story) => sum + (story.likes_count || 0),
          0
        );

        // Badge de autor popular (100+ likes totales)
        if (totalLikes >= 100) {
          await awardBadge("popular_author", userId);
        }

        // Badge de historia viral (50+ likes en una historia)
        const hasViralStory = stories.some(
          (story) => (story.likes_count || 0) >= 50
        );
        if (hasViralStory) {
          await awardBadge("viral_story", userId);
        }
      } catch (err) {
        console.error("Error checking popularity badges:", err);
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
