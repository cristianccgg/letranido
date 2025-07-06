import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export const useStories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  // En useStories.js, actualizar la función submitStory:

  const submitStory = async (storyData) => {
    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para enviar una historia",
      };
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar que el concurso existe y está en fase de submission
      const { data: contest, error: contestError } = await supabase
        .from("contests")
        .select("*")
        .eq("id", storyData.contestId)
        .single();

      if (contestError) {
        throw new Error("Concurso no encontrado");
      }

      // Verificar que el concurso esté abierto para envíos
      const now = new Date();
      const submissionDeadline = new Date(contest.submission_deadline);

      if (now > submissionDeadline) {
        throw new Error("El plazo para enviar historias ha expirado");
      }

      if (contest.status !== "submission") {
        throw new Error("El concurso ya no acepta nuevas historias");
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

      // Validar longitud de la historia
      if (storyData.wordCount < contest.min_words) {
        throw new Error(
          `Tu historia debe tener al menos ${contest.min_words} palabras`
        );
      }

      if (storyData.wordCount > contest.max_words) {
        throw new Error(
          `Tu historia no puede superar las ${contest.max_words} palabras`
        );
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

      // Insertar la historia SIN JOINS complejos
      const { data: newStory, error: insertError } = await supabase
        .from("stories")
        .insert([storyToInsert])
        .select("*") // Solo seleccionar campos básicos
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
  };

  const getStoriesByContest = async (contestId) => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
          *,
          user_profiles!inner(display_name, wins_count, total_likes),
          contests!inner(title, status)
        `
        )
        .eq("contest_id", contestId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, stories: data };
    } catch (err) {
      console.error("Error fetching stories:", err);
      return { success: false, error: err.message };
    }
  };

  const getUserStories = async (userId = user?.id) => {
    if (!userId) return { success: false, error: "Usuario no encontrado" };

    try {
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
        *,
        contests (
          title,
          month,
          status
        )
      `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, stories: data };
    } catch (err) {
      console.error("Error fetching user stories:", err);
      return { success: false, error: err.message };
    }
  };

  const getStoryById = async (storyId) => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
          *,
          user_profiles!inner(display_name, bio, wins_count, total_stories: stories_count),
          contests!inner(title, description, month, category)
        `
        )
        .eq("id", storyId)
        .single();

      if (error) throw error;

      return { success: true, story: data };
    } catch (err) {
      console.error("Error fetching story:", err);
      return { success: false, error: err.message };
    }
  };

  const recordStoryView = async (storyId) => {
    try {
      // Registrar vista (el trigger se encargará de actualizar contadores)
      await supabase.from("story_views").insert([
        {
          story_id: storyId,
          user_id: user?.id || null,
          view_date: new Date().toISOString().split("T")[0], // Solo la fecha
        },
      ]);

      return { success: true };
    } catch (err) {
      // No es crítico si falla el registro de vista
      console.warn("Error recording view:", err);
      return { success: false };
    }
  };

  return {
    loading,
    error,
    submitStory,
    getStoriesByContest,
    getUserStories,
    getStoryById,
    recordStoryView,
  };
};
