import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useContests = () => {
  const [contests, setContests] = useState([]);
  const [currentContest, setCurrentContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching contests...");

      // Consulta básica sin JOINs complejos
      const { data: allContests, error: contestsError } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 Contests response:", { allContests, contestsError });

      if (contestsError) {
        console.error("❌ Contests error details:", contestsError);
        throw contestsError;
      }

      if (!allContests || allContests.length === 0) {
        console.log("ℹ️ No se encontraron concursos");
        setContests([]);
        setCurrentContest(null);
        setLoading(false); // Importante: establecer loading a false aquí
        return;
      }

      // Para cada concurso, obtener el count de historias por separado
      const processedContests = await Promise.all(
        allContests.map(async (contest) => {
          // Contar historias de este concurso
          const { count: storiesCount } = await supabase
            .from("stories")
            .select("*", { count: "exact", head: true })
            .eq("contest_id", contest.id);

          return {
            ...contest,
            // Contar participantes
            participants_count: storiesCount || 0,
            // Calcular fechas límite
            submission_deadline:
              contest.submission_deadline ||
              new Date(contest.end_date).toISOString(),
            voting_deadline:
              contest.voting_deadline ||
              new Date(contest.end_date).toISOString(),
            // Asegurar que el status existe
            status: contest.status || "active",
            // Formatear fechas
            start_date: new Date(contest.start_date),
            end_date: new Date(contest.end_date),
            submission_deadline_date: new Date(
              contest.submission_deadline || contest.end_date
            ),
            voting_deadline_date: new Date(
              contest.voting_deadline || contest.end_date
            ),
          };
        })
      );

      console.log("✅ Contests processed:", processedContests.length);
      setContests(processedContests);

      // Encontrar el concurso actual (el más reciente que esté activo)
      const current =
        processedContests.find(
          (contest) =>
            contest.status === "active" ||
            contest.status === "submission" ||
            contest.status === "voting"
        ) ||
        processedContests[0] ||
        null;

      console.log("🎯 Current contest:", current?.title || "None");
      setCurrentContest(current);
    } catch (err) {
      console.error("💥 Error fetching contests:", err);
      setError(err.message || "Error al cargar los concursos");
    } finally {
      setLoading(false); // Asegurar que siempre se establezca a false
    }
  };

  const getContestById = async (id) => {
    try {
      console.log("🔍 Fetching contest by ID:", id);

      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id)
        .single();

      console.log("📊 Contest by ID response:", { data, error });

      if (error) {
        console.error("❌ Contest by ID error:", error);
        if (error.code === "PGRST116") {
          throw new Error("Concurso no encontrado");
        }
        throw error;
      }

      // Contar historias de este concurso por separado
      const { count: storiesCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("contest_id", id);

      // Procesar contest para agregar datos calculados
      const processedContest = {
        ...data,
        // Contar participantes
        participants_count: storiesCount || 0,
        // Calcular fechas límite
        submission_deadline:
          data.submission_deadline || new Date(data.end_date).toISOString(),
        voting_deadline:
          data.voting_deadline || new Date(data.end_date).toISOString(),
        // Asegurar que el status existe
        status: data.status || "active",
        // Formatear fechas
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        submission_deadline_date: new Date(
          data.submission_deadline || data.end_date
        ),
        voting_deadline_date: new Date(data.voting_deadline || data.end_date),
      };

      console.log("✅ Contest by ID processed:", processedContest.title);
      return processedContest;
    } catch (err) {
      console.error("💥 Error fetching contest by ID:", err);
      throw err;
    }
  };

  const createContest = async (contestData) => {
    try {
      console.log("🆕 Creating new contest:", contestData.title);

      const { data, error } = await supabase
        .from("contests")
        .insert([
          {
            title: contestData.title,
            description: contestData.description,
            category: contestData.category || "Ficción",
            month:
              contestData.month ||
              new Date().toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
              }),
            start_date: contestData.start_date || new Date().toISOString(),
            end_date:
              contestData.end_date ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            submission_deadline: contestData.submission_deadline,
            voting_deadline: contestData.voting_deadline,
            min_words: contestData.min_words || 100,
            max_words: contestData.max_words || 1000,
            status: contestData.status || "submission",
            prize: contestData.prize || "Insignia de Oro",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating contest:", error);
        throw error;
      }

      console.log("✅ Contest created successfully:", data.title);

      // Refrescar la lista de concursos
      await fetchContests();

      return { success: true, contest: data };
    } catch (err) {
      console.error("💥 Error creating contest:", err);
      return {
        success: false,
        error: err.message || "Error al crear el concurso",
      };
    }
  };

  const updateContest = async (contestId, updates) => {
    try {
      console.log("🔄 Updating contest:", contestId);

      const { data, error } = await supabase
        .from("contests")
        .update(updates)
        .eq("id", contestId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating contest:", error);
        throw error;
      }

      console.log("✅ Contest updated successfully:", data.title);

      // Refrescar la lista de concursos
      await fetchContests();

      return { success: true, contest: data };
    } catch (err) {
      console.error("💥 Error updating contest:", err);
      return {
        success: false,
        error: err.message || "Error al actualizar el concurso",
      };
    }
  };

  const getContestStats = async (contestId) => {
    try {
      console.log("📊 Fetching contest stats for:", contestId);

      // Obtener el concurso básico
      const { data: contest, error: contestError } = await supabase
        .from("contests")
        .select("*")
        .eq("id", contestId)
        .single();

      if (contestError) {
        throw contestError;
      }

      // Obtener todas las historias del concurso
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("contest_id", contestId);

      if (storiesError) {
        throw storiesError;
      }

      // Obtener información de los usuarios de estas historias
      const userIds = [...new Set(stories.map((story) => story.user_id))];
      const { data: userProfiles } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);

      // Calcular estadísticas
      const storiesWithUsers = stories.map((story) => {
        const userProfile = userProfiles?.find(
          (profile) => profile.id === story.user_id
        );
        return {
          ...story,
          author: userProfile?.display_name || userProfile?.name || "Usuario",
        };
      });

      const stats = {
        total_participants: storiesWithUsers.length,
        total_words: storiesWithUsers.reduce(
          (sum, story) => sum + (story.word_count || 0),
          0
        ),
        total_likes: storiesWithUsers.reduce(
          (sum, story) => sum + (story.likes_count || 0),
          0
        ),
        total_views: storiesWithUsers.reduce(
          (sum, story) => sum + (story.views_count || 0),
          0
        ),
        average_words:
          storiesWithUsers.length > 0
            ? Math.round(
                storiesWithUsers.reduce(
                  (sum, story) => sum + (story.word_count || 0),
                  0
                ) / storiesWithUsers.length
              )
            : 0,
        top_stories: storiesWithUsers
          .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
          .slice(0, 3)
          .map((story) => ({
            id: story.id,
            likes: story.likes_count || 0,
            author: story.author,
          })),
      };

      console.log("✅ Contest stats calculated:", stats);
      return { success: true, stats };
    } catch (err) {
      console.error("💥 Error fetching contest stats:", err);
      return {
        success: false,
        error: err.message || "Error al obtener estadísticas",
      };
    }
  };

  const getContestPhase = (contest) => {
    if (!contest) return "unknown";

    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);
    const votingDeadline = new Date(contest.voting_deadline);

    if (now <= submissionDeadline) {
      return "submission";
    } else if (now <= votingDeadline) {
      return "voting";
    } else {
      return "results";
    }
  };

  const getTimeLeft = (contest, phase = null) => {
    if (!contest) return null;

    const currentPhase = phase || getContestPhase(contest);
    const now = new Date();
    let targetDate;

    switch (currentPhase) {
      case "submission":
        targetDate = new Date(contest.submission_deadline);
        break;
      case "voting":
        targetDate = new Date(contest.voting_deadline);
        break;
      default:
        return null;
    }

    const diff = targetDate - now;
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days,
      hours,
      minutes,
      total: diff,
    };
  };

  const isContestActive = (contest) => {
    if (!contest) return false;

    const now = new Date();
    const endDate = new Date(contest.voting_deadline || contest.end_date);

    return (
      now <= endDate &&
      (contest.status === "active" ||
        contest.status === "submission" ||
        contest.status === "voting")
    );
  };

  const canSubmitToContest = (contest) => {
    if (!contest) return false;

    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);

    return (
      now <= submissionDeadline &&
      (contest.status === "submission" || contest.status === "voting")
    );
  };

  const canVoteInContest = (contest) => {
    if (!contest) return false;

    const phase = getContestPhase(contest);
    return phase === "voting";
  };

  return {
    contests,
    currentContest,
    loading,
    error,
    refetch: fetchContests,
    getContestById,
    createContest,
    updateContest,
    getContestStats,
    getContestPhase,
    getTimeLeft,
    isContestActive,
    canSubmitToContest,
    canVoteInContest,
  };
};
