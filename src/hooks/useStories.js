import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export const useStories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const submitStory = useCallback(
    async (storyData) => {
      if (!user) {
        return {
          success: false,
          error: "Debes iniciar sesión para enviar una historia",
        };
      }

      setLoading(true);
      setError(null);

      try {
        // Verificar que el concurso existe
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", storyData.contestId)
          .single();

        if (contestError) {
          throw new Error("Concurso no encontrado");
        }

        // Verificar que el usuario no haya enviado ya una historia para este concurso
        const { data: existingStory, error: checkError } = await supabase
          .from("stories")
          .select("id")
          .eq("contest_id", storyData.contestId)
          .eq("user_id", user.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existingStory) {
          throw new Error("Ya has enviado una historia para este concurso");
        }

        // Preparar datos para insertar
        const storyToInsert = {
          title: storyData.title.trim(),
          content: storyData.content.trim(),
          word_count: storyData.wordCount,
          user_id: user.id,
          contest_id: storyData.contestId,
          is_mature: storyData.hasMatureContent || false,
          published_at: new Date().toISOString(),
        };

        console.log("📝 Insertando historia:", storyToInsert);

        const { data: newStory, error: insertError } = await supabase
          .from("stories")
          .insert([storyToInsert])
          .select("*")
          .single();

        if (insertError) {
          console.error("❌ Error inserting story:", insertError);
          throw insertError;
        }

        console.log("✅ Historia insertada exitosamente:", newStory);

        return {
          success: true,
          story: newStory,
          message: "¡Tu historia ha sido enviada exitosamente al concurso!",
        };
      } catch (err) {
        console.error("Error submitting story:", err);
        const errorMessage =
          err.message || "Error inesperado al enviar la historia";
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id] // 🔧 CAMBIO: Solo user.id en lugar de user completo
  );

  const getStoriesByContest = useCallback(async (contestId) => {
    if (!contestId) {
      return { success: false, error: "ID de concurso requerido" };
    }

    try {
      console.log("🔍 Buscando historias para concurso:", contestId);

      // Primero obtener las historias básicas
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("contest_id", contestId)
        .order("created_at", { ascending: false });

      if (storiesError) {
        console.error("❌ Error fetching stories:", storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log("ℹ️ No se encontraron historias para este concurso");
        return { success: true, stories: [] };
      }

      console.log("✅ Historias encontradas:", stories.length);

      // Obtener información de los usuarios
      const userIds = [...new Set(stories.map((story) => story.user_id))];
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);

      if (usersError) {
        console.warn("⚠️ Error fetching user profiles:", usersError);
        // Continuar sin perfiles de usuario
      }

      // Obtener información del concurso
      const { data: contest, error: contestError } = await supabase
        .from("contests")
        .select("*")
        .eq("id", contestId)
        .single();

      if (contestError) {
        console.warn("⚠️ Error fetching contest:", contestError);
      }

      // Combinar datos manualmente
      const processedStories = stories.map((story) => {
        const userProfile = userProfiles?.find(
          (profile) => profile.id === story.user_id
        );

        return {
          ...story,
          // Asegurar que todos los campos numéricos existan
          likes_count: story.likes_count || 0,
          views_count: story.views_count || 0,
          word_count: story.word_count || 0,
          // Datos del usuario
          user_profiles: userProfile
            ? {
                id: userProfile.id,
                display_name:
                  userProfile.display_name || userProfile.name || "Usuario",
                wins_count: userProfile.wins_count || 0,
                total_likes: userProfile.total_likes || 0,
              }
            : {
                id: story.user_id,
                display_name: "Usuario",
                wins_count: 0,
                total_likes: 0,
              },
          // Datos del concurso
          contests: contest
            ? {
                id: contest.id,
                title: contest.title,
                status: contest.status,
                month: contest.month,
                category: contest.category,
              }
            : {
                id: contestId,
                title: "Concurso",
                status: "unknown",
                month: "Mes",
                category: "Ficción",
              },
          // Campos calculados
          excerpt: story.content
            ? story.content.substring(0, 200) + "..."
            : "Sin contenido disponible",
          readTime: Math.ceil((story.word_count || 0) / 200) + " min",
          author: userProfile?.display_name || userProfile?.name || "Usuario",
          authorId: story.user_id,
          authorWins: userProfile?.wins_count || 0,
          authorTotalLikes: userProfile?.total_likes || 0,
          contestTitle: contest?.title || "Concurso",
          contestStatus: contest?.status || "unknown",
          contestMonth: contest?.month || "Mes",
          contestCategory: contest?.category || "Ficción",
        };
      });

      return { success: true, stories: processedStories };
    } catch (err) {
      console.error("💥 Error fetching stories:", err);
      return {
        success: false,
        error: err.message || "Error al cargar las historias",
      };
    }
  }, []); // 🔧 CAMBIO: Sin dependencias para evitar re-renders

  const getStoriesForGallery = useCallback(async (filters = {}) => {
    try {
      console.log("🔍 Cargando historias para galería:", filters);

      // Construir query básico
      let query = supabase.from("stories").select("*");

      // Aplicar filtros básicos
      if (filters.contestId) {
        query = query.eq("contest_id", filters.contestId);
      }

      // Ordenamiento
      switch (filters.sortBy) {
        case "popular":
          query = query.order("views_count", { ascending: false });
          break;
        case "liked":
          query = query.order("likes_count", { ascending: false });
          break;
        case "viewed":
          query = query.order("views_count", { ascending: false });
          break;
        case "recent":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data: stories, error: storiesError } = await query;

      if (storiesError) {
        console.error("❌ Error fetching gallery stories:", storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log("ℹ️ No se encontraron historias");
        return { success: true, stories: [] };
      }

      console.log("✅ Historias de galería encontradas:", stories.length);

      // Obtener información de los usuarios
      const userIds = [...new Set(stories.map((story) => story.user_id))];
      const { data: userProfiles } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);

      // Obtener información de los concursos
      const contestIds = [...new Set(stories.map((story) => story.contest_id))];
      const { data: contests } = await supabase
        .from("contests")
        .select("*")
        .in("id", contestIds);

      // Combinar datos manualmente
      let processedStories = stories.map((story) => {
        const userProfile = userProfiles?.find(
          (profile) => profile.id === story.user_id
        );
        const contest = contests?.find(
          (contest) => contest.id === story.contest_id
        );

        return {
          ...story,
          // Asegurar que todos los campos numéricos existan
          likes_count: story.likes_count || 0,
          views_count: story.views_count || 0,
          word_count: story.word_count || 0,
          // Campos calculados
          excerpt: story.content
            ? story.content.substring(0, 300) + "..."
            : "Sin contenido disponible",
          readTime: Math.ceil((story.word_count || 0) / 200) + " min",
          author: userProfile?.display_name || userProfile?.name || "Usuario",
          authorId: story.user_id,
          authorWins: userProfile?.wins_count || 0,
          authorTotalLikes: userProfile?.total_likes || 0,
          contestTitle: contest?.title || "Concurso",
          contestMonth: contest?.month || "Mes",
          contestCategory: contest?.category || "Ficción",
        };
      });

      // Aplicar filtros adicionales después de cargar los datos
      if (filters.category && filters.category !== "all") {
        processedStories = processedStories.filter(
          (story) => story.contestCategory === filters.category
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        processedStories = processedStories.filter(
          (story) =>
            story.title.toLowerCase().includes(searchLower) ||
            story.author.toLowerCase().includes(searchLower) ||
            story.excerpt.toLowerCase().includes(searchLower)
        );
      }

      return { success: true, stories: processedStories };
    } catch (err) {
      console.error("💥 Error fetching gallery stories:", err);
      return {
        success: false,
        error: err.message || "Error al cargar las historias",
      };
    }
  }, []); // 🔧 CAMBIO: Sin dependencias

  const getUserStories = useCallback(
    async (userId = user?.id) => {
      if (!userId) return { success: false, error: "Usuario no encontrado" };

      try {
        console.log("🔍 Buscando historias del usuario:", userId);

        const { data: stories, error: storiesError } = await supabase
          .from("stories")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (storiesError) {
          console.error("❌ Error fetching user stories:", storiesError);
          throw storiesError;
        }

        if (!stories || stories.length === 0) {
          console.log("ℹ️ No se encontraron historias para este usuario");
          return { success: true, stories: [] };
        }

        console.log("✅ Historias del usuario encontradas:", stories.length);

        // Obtener información de los concursos
        const contestIds = [
          ...new Set(stories.map((story) => story.contest_id)),
        ];
        const { data: contests } = await supabase
          .from("contests")
          .select("*")
          .in("id", contestIds);

        // Combinar datos manualmente
        const processedStories = stories.map((story) => {
          const contest = contests?.find(
            (contest) => contest.id === story.contest_id
          );

          return {
            ...story,
            // Asegurar que todos los campos numéricos existan
            likes_count: story.likes_count || 0,
            views_count: story.views_count || 0,
            word_count: story.word_count || 0,
            // Datos del concurso
            contests: contest
              ? {
                  id: contest.id,
                  title: contest.title,
                  month: contest.month,
                  status: contest.status,
                  category: contest.category,
                }
              : null,
            // Campos calculados
            excerpt: story.content
              ? story.content.substring(0, 200) + "..."
              : "Sin contenido disponible",
            readTime: Math.ceil((story.word_count || 0) / 200) + " min",
          };
        });

        return { success: true, stories: processedStories };
      } catch (err) {
        console.error("💥 Error fetching user stories:", err);
        return {
          success: false,
          error: err.message || "Error al cargar las historias del usuario",
        };
      }
    },
    [user?.id] // 🔧 CAMBIO: Solo user.id
  );

  const getStoryById = useCallback(async (storyId) => {
    if (!storyId) {
      return { success: false, error: "ID de historia requerido" };
    }

    try {
      console.log("🔍 Buscando historia por ID:", storyId);

      const { data: story, error: storyError } = await supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single();

      if (storyError) {
        console.error("❌ Error fetching story:", storyError);
        if (storyError.code === "PGRST116") {
          throw new Error("Historia no encontrada");
        }
        throw storyError;
      }

      console.log("✅ Historia encontrada:", story.title);

      // Obtener información del usuario
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", story.user_id)
        .single();

      // Obtener información del concurso
      const { data: contest } = await supabase
        .from("contests")
        .select("*")
        .eq("id", story.contest_id)
        .single();

      // Procesar la historia
      const processedStory = {
        ...story,
        // Asegurar que todos los campos numéricos existan
        likes_count: story.likes_count || 0,
        views_count: story.views_count || 0,
        word_count: story.word_count || 0,
        // Tiempo de lectura estimado
        readTime: Math.ceil((story.word_count || 0) / 200) + " min",
        // Formatear datos del autor
        author: {
          id: story.user_id,
          name: userProfile?.display_name || userProfile?.name || "Usuario",
          bio: userProfile?.bio || "Sin biografía disponible",
          wins: userProfile?.wins_count || 0,
          totalLikes: userProfile?.total_likes || 0,
          joinedAt: userProfile?.created_at || new Date().toISOString(),
        },
        // Formatear datos del concurso
        contest: {
          id: story.contest_id,
          title: contest?.title || "Concurso",
          description: contest?.description || "Sin descripción",
          month: contest?.month || "Mes",
          category: contest?.category || "Ficción",
          status: contest?.status || "unknown",
        },
      };

      return { success: true, story: processedStory };
    } catch (err) {
      console.error("💥 Error fetching story:", err);
      return {
        success: false,
        error: err.message || "Error al cargar la historia",
      };
    }
  }, []); // 🔧 CAMBIO: Sin dependencias

  const recordStoryView = useCallback(
    async (storyId) => {
      if (!storyId) {
        return { success: false, error: "ID de historia requerido" };
      }

      try {
        console.log("📊 Registrando vista para historia:", storyId);

        // Verificar si la tabla story_views existe antes de intentar insertar
        const { error } = await supabase.from("story_views").insert([
          {
            story_id: storyId,
            user_id: user?.id || null,
            view_date: new Date().toISOString().split("T")[0],
          },
        ]);

        if (error) {
          // Si la tabla no existe o hay constraint duplicate, no es crítico
          if (error.code === "42P01") {
            console.log(
              "ℹ️ Tabla story_views no existe, saltando registro de vista"
            );
            return { success: true }; // No es un error crítico
          }
          if (error.code === "23505") {
            console.log("ℹ️ Vista ya registrada hoy para este usuario");
            return { success: true }; // Ya se registró, no es problema
          }
          console.warn("⚠️ Error recording view:", error);
          return { success: false, error: error.message };
        }

        console.log("✅ Vista registrada exitosamente");
        return { success: true };
      } catch (err) {
        console.warn("⚠️ Error recording view:", err);
        return { success: false, error: err.message };
      }
    },
    [user?.id] // 🔧 CAMBIO: Solo user.id
  );

  const toggleLike = useCallback(
    async (storyId) => {
      if (!user) {
        return { success: false, error: "Debes iniciar sesión para dar like" };
      }

      if (!storyId) {
        return { success: false, error: "ID de historia requerido" };
      }

      try {
        console.log("❤️ Verificando si se puede votar en historia:", storyId);

        // Primero obtener la historia para saber a qué concurso pertenece
        const { data: story, error: storyError } = await supabase
          .from("stories")
          .select("contest_id, user_id")
          .eq("id", storyId)
          .single();

        if (storyError) {
          throw new Error("Historia no encontrada");
        }

        // Obtener información del concurso para verificar la fase
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", story.contest_id)
          .single();

        if (contestError) {
          throw new Error("Concurso no encontrado");
        }

        // Determinar la fase actual del concurso
        const now = new Date();
        const submissionDeadline = new Date(
          contest.submission_deadline || contest.end_date
        );
        const votingDeadline = new Date(
          contest.voting_deadline || contest.end_date
        );

        let currentPhase;
        if (now <= submissionDeadline) {
          currentPhase = "submission";
        } else if (now <= votingDeadline) {
          currentPhase = "voting";
        } else {
          currentPhase = "results";
        }

        console.log("📅 Fase actual del concurso:", currentPhase);

        // Solo permitir likes durante la fase de votación
        if (currentPhase !== "voting") {
          if (currentPhase === "submission") {
            return {
              success: false,
              error:
                "La votación aún no ha comenzado. Los votos se abren cuando termine la fase de envío.",
            };
          } else if (currentPhase === "results") {
            return {
              success: false,
              error: "La votación ha terminado. Ya no se pueden dar más likes.",
            };
          }
        }

        // Verificar que el usuario no vote por su propia historia
        if (story.user_id === user.id) {
          return {
            success: false,
            error: "No puedes votar por tu propia historia",
          };
        }

        // Proceder con el toggle de like si estamos en fase de votación
        console.log("✅ Votación permitida, procesando like...");

        // Usar la tabla 'votes' en lugar de 'story_likes'
        const { data: existingVote, error: checkError } = await supabase
          .from("votes")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", user.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existingVote) {
          // Remover voto
          const { error: deleteError } = await supabase
            .from("votes")
            .delete()
            .eq("id", existingVote.id);

          if (deleteError) throw deleteError;

          console.log("✅ Voto removido");
          return { success: true, liked: false };
        } else {
          // Agregar voto
          const { error: insertError } = await supabase
            .from("votes")
            .insert([{ story_id: storyId, user_id: user.id }]);

          if (insertError) throw insertError;

          console.log("✅ Voto agregado");
          return { success: true, liked: true };
        }
      } catch (err) {
        console.error("💥 Error toggling like:", err);
        return {
          success: false,
          error: err.message || "Error al procesar el like",
        };
      }
    },
    [user?.id] // 🔧 CAMBIO: Solo user.id
  );

  const checkUserLike = useCallback(
    async (storyId) => {
      if (!user || !storyId) {
        console.log("🚫 checkUserLike: Sin usuario o storyId");
        return { success: true, liked: false };
      }

      try {
        console.log("🔍 Verificando like:", { userId: user.id, storyId });

        const { data, error } = await supabase
          .from("votes")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", user.id);

        if (error) {
          console.warn("⚠️ Error checking vote:", error);
          return { success: true, liked: false };
        }

        const hasLiked = data && data.length > 0;
        console.log("❤️ Resultado verificación like:", {
          hasLiked,
          votesFound: data?.length,
        });

        return { success: true, liked: hasLiked };
      } catch (err) {
        console.warn("💥 Error inesperado checking vote:", err);
        return { success: true, liked: false };
      }
    },
    [user?.id] // 🔧 CAMBIO: Solo user.id
  );

  // Nueva función para verificar si se puede votar en un concurso
  const canVoteInStory = useCallback(
    async (storyId) => {
      if (!storyId) {
        return { canVote: false, reason: "Historia no encontrada" };
      }

      try {
        // Obtener la historia para saber el concurso
        const { data: story, error: storyError } = await supabase
          .from("stories")
          .select("contest_id, user_id")
          .eq("id", storyId)
          .single();

        if (storyError) {
          return { canVote: false, reason: "Historia no encontrada" };
        }

        // Verificar que el usuario no vote por su propia historia
        if (story.user_id === user?.id) {
          return {
            canVote: false,
            reason: "No puedes votar por tu propia historia",
          };
        }

        // Obtener información del concurso
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", story.contest_id)
          .single();

        if (contestError) {
          return { canVote: false, reason: "Concurso no encontrado" };
        }

        // Determinar la fase actual
        const now = new Date();
        const submissionDeadline = new Date(
          contest.submission_deadline || contest.end_date
        );
        const votingDeadline = new Date(
          contest.voting_deadline || contest.end_date
        );

        let currentPhase;
        if (now <= submissionDeadline) {
          currentPhase = "submission";
        } else if (now <= votingDeadline) {
          currentPhase = "voting";
        } else {
          currentPhase = "results";
        }

        if (currentPhase === "submission") {
          return {
            canVote: false,
            reason: "La votación aún no ha comenzado",
            phase: "submission",
            votingStartsAt: submissionDeadline,
          };
        } else if (currentPhase === "results") {
          return {
            canVote: false,
            reason: "La votación ha terminado",
            phase: "results",
          };
        } else {
          return {
            canVote: true,
            reason: "Votación activa",
            phase: "voting",
            votingEndsAt: votingDeadline,
          };
        }
      } catch (err) {
        console.error("Error checking voting permissions:", err);
        return { canVote: false, reason: "Error al verificar permisos" };
      }
    },
    [user?.id] // 🔧 CAMBIO: Solo user.id
  );

  return {
    loading,
    error,
    submitStory,
    getStoriesByContest,
    getUserStories,
    getStoryById,
    recordStoryView,
    toggleLike,
    checkUserLike,
    getStoriesForGallery,
    canVoteInStory, // Nueva función
  };
};
