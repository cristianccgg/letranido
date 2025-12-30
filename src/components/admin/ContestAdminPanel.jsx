import React, { useState, useEffect } from "react";
import {
  Trophy,
  Settings,
  Eye,
  Clock,
  Users,
  Award,
  AlertTriangle,
  Check,
  X,
  Crown,
  Medal,
  Star,
  Plus,
  Edit,
  Calendar,
  Save,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  TestTube,
  Zap,
  Shield,
  Trash2,
  Vote,
  Heart,
  BookOpen,
  Rss,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import { useContestFinalization } from "../../hooks/useContestFinalization";
import { supabase } from "../../lib/supabase";
import DataCleanupPanel from "./DataCleanupPanel";
import ReportsPanel from "./ReportsPanel";
import EmailManager from "./EmailManager";
import MaintenanceControl from "./MaintenanceControl";
import ModerationDashboard from "./ModerationDashboard";
import AnalyticsDashboard from "./AnalyticsDashboard";
import PollAdminPanel from "./PollAdminPanel";
import SocialGenerator from "./SocialGenerator";
import KofiBadgePanel from "./KofiBadgePanel";
import ReadingMetricsPanel from "./ReadingMetricsPanel";
import FeedAdminPanel from "./FeedAdminPanel";

const ContestAdminPanel = () => {
  const [selectedContest, setSelectedContest] = useState(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [winners, setWinners] = useState(null);
  const [finalizationResult, setFinalizationResult] = useState(null);
  const [editingContest, setEditingContest] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [simulatedWinners, setSimulatedWinners] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null); // ID del concurso que se está eliminando
  
  // Estados para eliminación manual de usuarios
  const [userEmail, setUserEmail] = useState('');
  const [userDeletionLoading, setUserDeletionLoading] = useState(false);
  const [userDeletionResult, setUserDeletionResult] = useState(null);
  const [finalizingContestId, setFinalizingContestId] = useState(null); // ID del concurso que se está finalizando
  const [rankingLoading, setRankingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("concursos");
  const [metricsContestId, setMetricsContestId] = useState(null); // ID del concurso para métricas de lectura

  // Función para determinar si un concurso es de prueba
  const isTestContest = (contest) => {
    if (!contest?.title) return false;
    const title = contest.title.toLowerCase();
    return (
      title.includes("test") ||
      title.includes("prueba") ||
      title.includes("demo")
    );
  };

  // Función para ordenar concursos según prioridad de cola
  const sortContestsByPriority = (contests) => {
    if (!contests || contests.length === 0) return [];

    // Separar concursos finalizados y activos
    const finalized = contests.filter((c) => c.finalized_at !== null);
    const active = contests.filter((c) => c.finalized_at === null);

    // Separar concursos activos en prueba y producción
    const testContests = active.filter((c) => isTestContest(c));
    const productionContests = active.filter((c) => !isTestContest(c));

    // Ordenar cada grupo
    const sortedTest = testContests.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const sortedProduction = productionContests.sort((a, b) => {
      // Ordenar por el mes que representa el concurso (cronológicamente)
      // Extraer año y mes del campo "month" (formato: "diciembre 2025", "enero de 2026", "Diciembre de 2025")
      const parseMonth = (monthStr) => {
        if (!monthStr) return new Date(0); // Fallback para valores undefined

        const months = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
          'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
          'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };

        const parts = monthStr.toLowerCase().trim().split(' ');
        const monthName = parts[0];

        // ✅ Buscar el año en TODAS las partes (por si hay "de" en medio)
        let year = new Date().getFullYear();
        for (const part of parts) {
          const parsedYear = parseInt(part);
          if (!isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2100) {
            year = parsedYear;
            break;
          }
        }

        const monthNum = months[monthName] ?? 0;

        return new Date(year, monthNum, 1);
      };

      const aDate = parseMonth(a.month);
      const bDate = parseMonth(b.month);

      return aDate - bDate; // Orden cronológico por mes del concurso
    });

    const sortedFinalized = finalized.sort(
      (a, b) => new Date(b.finalized_at) - new Date(a.finalized_at)
    );

    // Combinar en orden de prioridad
    return [...sortedTest, ...sortedProduction, ...sortedFinalized];
  };

  // Helper para determinar la fase del concurso (igual que GlobalAppContext)
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
      // Votación terminó
      if (contest.status === "results" || contest.finalized_at) {
        return "results";
      } else {
        return "counting"; // Esperando cierre manual
      }
    }
  };

  // Función para obtener el estilo y label de prioridad
  const getContestPriorityInfo = (contest, index, sortedContests) => {
    const isFinalized = contest.finalized_at !== null;
    const isTest = isTestContest(contest);
    const phase = getContestPhase(contest);

    // ✅ FILTRAR concursos realmente activos (excluir "counting" y "results" sin cerrar)
    const activeContests = sortedContests.filter((c) => {
      const cPhase = getContestPhase(c);
      return c.finalized_at === null && cPhase !== "counting" && cPhase !== "results";
    });
    const activeIndex = activeContests.findIndex((c) => c.id === contest.id);

    if (isFinalized) {
      return {
        priority: null,
        className: "bg-gray-100 text-gray-600",
        label: "Finalizado",
      };
    }

    // ✅ Mostrar concursos en "counting" como "Esperando cierre"
    if (phase === "counting") {
      return {
        priority: "PENDING",
        className: "bg-orange-100 text-orange-700",
        label: "⏳ Esperando cierre manual",
      };
    }

    if (isTest) {
      return {
        priority: activeIndex === 0 ? "ACTIVO" : "PRUEBA",
        className:
          activeIndex === 0
            ? "bg-purple-100 text-purple-700"
            : "bg-yellow-100 text-yellow-700",
        label: activeIndex === 0 ? "🎭 ACTIVO (Prueba)" : "🎭 En Cola (Prueba)",
      };
    }

    if (activeIndex === 0) {
      return {
        priority: "ACTIVO",
        className: "bg-green-100 text-green-700",
        label: "🏗️ ACTIVO (Producción)",
      };
    }

    return {
      priority: `#${activeIndex + 1}`,
      className: "bg-blue-100 text-blue-700",
      label: `🏗️ En Cola #${activeIndex + 1}`,
    };
  };

  // Usar el contexto global unificado
  const { user, isAuthenticated, contests, contestsLoading, refreshContests, simulateUserDeletion, deleteUserAccount } =
    useGlobalApp();

  const {
    finalizeContest,
    previewWinners,
    revertFinalization,
    loading: finalizationLoading,
  } = useContestFinalization();

  // Solo mostrar a administradores
  const isAdmin = user?.is_admin || user?.email === "admin@literalab.com";

  // Form state para crear/editar concurso
  const [contestForm, setContestForm] = useState({
    title: "",
    description: "",
    category: "Ficción",
    month: "",
    min_words: 100,
    max_words: 1000,
    submission_deadline: "",
    voting_deadline: "",
    prize: "Insignia de Oro + Destacado del mes",
    status: "submission",
    // Campos para encuesta integrada
    poll_enabled: false,
    poll_title: "",
    poll_description: "",
    poll_deadline: "",
    poll_options: [
      { title: "", description: "", text: "" },
      { title: "", description: "", text: "" },
      { title: "", description: "", text: "" }
    ]
  });

  useEffect(() => {
    if (!contestsLoading && contests.length > 0) {
      const finalizableContest = contests.find(
        (contest) =>
          contest.status === "voting" || contest.status === "submission"
      );
      if (finalizableContest) {
        setSelectedContest(finalizableContest);
      }
    }
  }, [contests, contestsLoading]);

  // Resetear form
  const resetForm = () => {
    const now = new Date();
    const thisMonth = now.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    // ✅ CORREGIDO: Sugerir fechas por defecto en hora de Colombia
    const submissionEnd = new Date(now);
    submissionEnd.setDate(now.getDate() + 20); // 20 días para envíos
    submissionEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

    const votingEnd = new Date(submissionEnd);
    votingEnd.setDate(submissionEnd.getDate() + 7); // 7 días para votación
    votingEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

    // Función para convertir a formato datetime-local (sin zona horaria)
    const toDateTimeLocal = (date) => {
      // Para datetime-local necesitamos formato YYYY-MM-DDTHH:mm
      // pero interpretado como hora local de Colombia
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Fecha para encuesta (1 día antes del fin de envíos del concurso actual)
    const pollEnd = new Date(submissionEnd);
    pollEnd.setDate(submissionEnd.getDate() - 1); // 1 día antes
    pollEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

    setContestForm({
      title: "",
      description: "",
      category: "Ficción",
      month: thisMonth,
      min_words: 100,
      max_words: 1000,
      submission_deadline: toDateTimeLocal(submissionEnd),
      voting_deadline: toDateTimeLocal(votingEnd),
      prize: "Insignia de Oro + Destacado del mes",
      status: "submission",
      // Campos para encuesta integrada
      poll_enabled: false,
      poll_title: `Elige el prompt para ${thisMonth}`,
      poll_description: `Vota por el prompt que más te inspire para el concurso de ${thisMonth.toLowerCase()}. ¡Tu voto cuenta para decidir el tema del próximo reto!`,
      poll_deadline: toDateTimeLocal(pollEnd),
      poll_options: [
        { title: "", description: "", text: "" },
        { title: "", description: "", text: "" },
        { title: "", description: "", text: "" }
      ]
    });
  };

  // Recalcular rankings manualmente
  const handleRecalculateRankings = async () => {
    if (
      !confirm(
        "¿Recalcular los rankings de karma? Esta acción actualizará los datos cached de ranking para todos los usuarios."
      )
    ) {
      return;
    }

    setRankingLoading(true);

    try {
      console.log("🔄 Iniciando recalculo de rankings...");

      // 1. Llamar a la función RPC para limpiar tablas
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "recalculate_rankings"
      );

      if (rpcError) {
        throw new Error("Error en RPC function: " + rpcError.message);
      }

      console.log("📊 RPC completado:", rpcResult);

      // 2. Ahora calcular los rankings usando la lógica del sidebar

      // 🔒 IMPORTANTE: Primero obtener solo retos finalizados para evitar contar karma de retos en curso
      const { data: finalizedContests, error: contestsError } = await supabase
        .from("contests")
        .select("id")
        .eq("status", "results");

      if (contestsError) throw contestsError;

      const finalizedContestIds = finalizedContests.map(c => c.id);
      console.log("📊 Retos finalizados encontrados:", finalizedContestIds.length);

      // Obtener SOLO historias de retos finalizados (no retos en submission o voting)
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select(
          `
          id,
          user_id,
          likes_count,
          contest_id,
          published_at
        `
        )
        .not("published_at", "is", null)
        .in("contest_id", finalizedContestIds); // 🔒 FILTRO CRÍTICO: Solo retos finalizados

      if (storiesError) throw storiesError;
      console.log("📊 Historias de retos finalizados:", stories?.length || 0);

      // 🔒 Obtener IDs de historias finalizadas para filtrar votos y comentarios
      const finalizedStoryIds = stories ? stories.map(s => s.id) : [];
      console.log("🔍 IDs de historias finalizadas:", finalizedStoryIds.length);

      // Obtener SOLO votos de historias de retos finalizados
      let votes = [];
      if (finalizedStoryIds.length > 0) {
        console.log("🔍 Buscando votos para", finalizedStoryIds.length, "historias finalizadas...");

        // Intentar primero con RPC function (bypasea RLS)
        try {
          const { data: rpcVotes, error: rpcError } = await supabase
            .rpc('get_votes_by_story_ids', { story_ids: finalizedStoryIds });

          if (rpcError) {
            console.warn("⚠️ RPC function no disponible, intentando consulta directa:", rpcError.message);

            // Fallback: Consulta directa (puede estar limitada por RLS)
            const { data: votesData, error: votesError } = await supabase
              .from("votes")
              .select("user_id, created_at, story_id")
              .in("story_id", finalizedStoryIds);

            if (votesError) {
              console.error("❌ Error loading votes (RLS puede estar bloqueando):", votesError);
              console.log("💡 Sugerencia: Crear función RPC 'get_votes_by_story_ids' para bypasear RLS");
              votes = [];
            } else {
              votes = votesData || [];
              console.log("✅ Votos cargados con consulta directa:", votes.length);
            }
          } else {
            votes = rpcVotes || [];
            console.log("✅ Votos cargados con RPC:", votes.length);
          }
        } catch (error) {
          console.error("❌ Error general al cargar votos:", error);
          votes = [];
        }
      } else {
        console.warn("⚠️ No hay historias finalizadas para buscar votos");
      }
      console.log("📊 Total votos de retos finalizados:", votes.length);

      // Obtener SOLO comentarios de historias de retos finalizados
      let comments = [];
      if (finalizedStoryIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("user_id, story_id, created_at")
          .not("user_id", "is", null)
          .not("story_id", "is", null)
          .in("story_id", finalizedStoryIds); // 🔒 Solo comentarios de retos finalizados

        if (commentsError) {
          console.warn("Error loading comments:", commentsError);
        } else {
          comments = commentsData || [];
        }
      }
      console.log("📊 Comentarios de retos finalizados:", comments.length);

      // Obtener perfiles de usuario (filtrar valores nulos)
      const storyUserIds = stories ? stories.map((s) => s.user_id).filter(Boolean) : [];
      const voteUserIds = votes ? votes.map((v) => v.user_id).filter(Boolean) : [];
      const commentUserIds = comments ? comments.map((c) => c.user_id).filter(Boolean) : [];
      const uniqueUserIds = [
        ...new Set([...storyUserIds, ...voteUserIds, ...commentUserIds]),
      ];

      let users = [];
      if (uniqueUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("user_profiles")
          .select("id, display_name, bonus_karma")
          .in("id", uniqueUserIds);

        if (usersError) {
          console.warn("Error loading users:", usersError);
        } else {
          users = usersData || [];
        }
      }

      // Obtener información completa de concursos finalizados
      const { data: contestsData, error: contestsErrorDetail } = await supabase
        .from("contests")
        .select("id, title, month, status, finalized_at, voting_deadline")
        .eq("status", "results"); // 🔒 Solo retos finalizados

      if (contestsErrorDetail) console.warn("Error loading contests:", contestsErrorDetail);

      // Calcular karma usando la misma lógica que el sidebar
      const userKarma = calculateUserKarmaForCache(
        stories || [],
        votes,
        comments || [],
        contestsData || [],
        users
      );

      // Convertir a array y ordenar
      const rankingArray = Object.values(userKarma)
        .filter((user) => user.totalKarma > 0)
        .sort((a, b) => b.totalKarma - a.totalKarma)
        .map((user, index) => ({
          user_id: user.userId,
          user_name: user.author,
          total_karma: user.totalKarma,
          total_stories: user.totalStories,
          votes_given: user.votesGiven,
          comments_given: user.commentsGiven,
          comments_received: user.commentsReceived,
          contest_wins: user.contestWins,
          position: index + 1,
        }));

      console.log("📊 Rankings calculados:", rankingArray.length, "usuarios");

      // 3. Insertar los rankings calculados
      if (rankingArray.length > 0) {
        const { error: insertError } = await supabase
          .from("cached_rankings")
          .insert(rankingArray);

        if (insertError) throw insertError;
      }

      // 4. Actualizar metadata
      const { error: metadataError } = await supabase
        .from("ranking_metadata")
        .update({
          total_users: rankingArray.length,
          contest_period: new Date().toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          }),
        })
        .eq("updated_by_admin", true);

      if (metadataError)
        console.warn("Error updating metadata:", metadataError);

      console.log("✅ Rankings recalculados exitosamente");
      alert(
        `✅ Rankings actualizados exitosamente!\n\n` +
        `📊 ${rankingArray.length} usuarios procesados\n` +
        `📚 ${stories?.length || 0} historias de retos finalizados\n` +
        `🗳️ ${votes.length} votos contados\n` +
        `💬 ${comments.length} comentarios contados\n\n` +
        `🔒 Solo se contó karma de retos con status "results"`
      );
    } catch (error) {
      console.error("❌ Error recalculando rankings:", error);
      alert("❌ Error recalculando rankings: " + error.message);
    } finally {
      setRankingLoading(false);
    }
  };

  // Función helper para calcular karma (adaptada del sidebar)
  const calculateUserKarmaForCache = (
    stories,
    votes,
    comments,
    contests,
    users
  ) => {
    const KARMA_POINTS = {
      STORY_PUBLISHED: 15,
      LIKE_RECEIVED: 2,
      COMMENT_RECEIVED: 3,
      COMMENT_GIVEN: 2,
      CONTEST_WIN: 75,
      CONTEST_FINALIST: 30,
      VOTE_GIVEN: 1,
    };

    const userKarma = {};

    const initializeUser = (userId) => {
      if (!userKarma[userId]) {
        const userProfile = users.find((u) => u.id === userId);
        const author = userProfile?.display_name || "Usuario Anónimo";

        userKarma[userId] = {
          userId,
          author,
          totalKarma: 0,
          totalStories: 0,
          contestWins: 0,
          votesGiven: 0,
          commentsGiven: 0,
          commentsReceived: 0,
        };
      }
    };

    // Procesar votos
    votes.forEach((vote) => {
      initializeUser(vote.user_id);
      userKarma[vote.user_id].votesGiven++;
      userKarma[vote.user_id].totalKarma += KARMA_POINTS.VOTE_GIVEN;
    });

    // Procesar comentarios
    comments.forEach((comment) => {
      const commentAuthorId = comment.user_id;
      const storyAuthorId = stories.find(
        (s) => s.id === comment.story_id
      )?.user_id;

      // Karma para quien da el comentario (solo si NO es auto-comentario)
      if (commentAuthorId && commentAuthorId !== storyAuthorId) {
        initializeUser(commentAuthorId);
        userKarma[commentAuthorId].commentsGiven++;
        userKarma[commentAuthorId].totalKarma += KARMA_POINTS.COMMENT_GIVEN;
      }

      // Karma para quien recibe el comentario
      if (storyAuthorId && storyAuthorId !== commentAuthorId) {
        initializeUser(storyAuthorId);
        userKarma[storyAuthorId].commentsReceived++;
        userKarma[storyAuthorId].totalKarma += KARMA_POINTS.COMMENT_RECEIVED;
      }
    });

    // Procesar historias
    stories.forEach((story) => {
      const userId = story.user_id;
      initializeUser(userId);

      const userStats = userKarma[userId];

      // Karma básico por historia
      userStats.totalKarma += KARMA_POINTS.STORY_PUBLISHED;
      userStats.totalStories++;

      // Buscar información del concurso
      const contest = contests.find((c) => c.id === story.contest_id);
      const canShowVotes =
        contest &&
        (contest.status === "results" || contest.status === "voting");

      if (canShowVotes && story.likes_count) {
        userStats.totalKarma += story.likes_count * KARMA_POINTS.LIKE_RECEIVED;
      }

      // Detectar ganadores
      if (contest?.status === "results") {
        const allContestStories = stories.filter(
          (s) => s.contest_id === story.contest_id
        );
        const sortedByVotes = allContestStories.sort(
          (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
        );
        const position = sortedByVotes.findIndex((s) => s.id === story.id) + 1;

        if (position === 1) {
          userStats.contestWins++;
          userStats.totalKarma += KARMA_POINTS.CONTEST_WIN;
        } else if (position <= 3) {
          userStats.totalKarma += KARMA_POINTS.CONTEST_FINALIST;
        }
      }
    });

    // 🎖️ AGREGAR BONUS KARMA (Ko-fi supporters, eventos especiales, etc.)
    users.forEach((user) => {
      if (user.bonus_karma && user.bonus_karma > 0) {
        initializeUser(user.id);
        userKarma[user.id].totalKarma += user.bonus_karma;
        console.log(`🎖️ Bonus karma agregado para ${user.display_name}: +${user.bonus_karma}`);
      }
    });

    return userKarma;
  };

  // Crear nuevo concurso usando Supabase directamente
  const createContest = async (contestData) => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .insert([contestData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, contest: data };
    } catch (err) {
      console.error("Error creating contest:", err);
      return { success: false, error: err.message };
    }
  };

  // Actualizar concurso usando Supabase directamente
  const updateContest = async (contestId, updates) => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .update(updates)
        .eq("id", contestId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, contest: data };
    } catch (err) {
      console.error("Error updating contest:", err);
      return { success: false, error: err.message };
    }
  };

  // 🆕 FUNCIONES PARA CONTROL DE ESTADOS DE PRUEBA

  // Revertir finalización (deshacer badges y puntos)
  const handleRevertFinalization = async (contest) => {
    if (contest.status !== "results") {
      alert("❌ Solo se pueden revertir concursos finalizados");
      return;
    }

    const isTestContest =
      contest.title.toLowerCase().includes("test") ||
      contest.title.toLowerCase().includes("prueba");

    let confirmMessage = `¿Revertir la finalización de "${contest.title}"?`;

    if (!isTestContest) {
      confirmMessage +=
        "\n\n⚠️ ADVERTENCIA: Esto eliminará:\n• Badges otorgados a los ganadores\n• Puntos asignados\n• Marcas de ganador en historias\n\n¿Continuar?";
    } else {
      confirmMessage +=
        "\n\nEsto revertirá:\n• Badges de prueba\n• Puntos de prueba\n• Estado del concurso";
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    const result = await revertFinalization(contest.id);
    if (result.success) {
      alert("✅ Finalización revertida exitosamente");
    } else {
      alert("❌ Error revirtiendo: " + result.error);
    }
  };

  // Eliminar concurso completamente
  const deleteContest = async (contest) => {
    const isTestContest =
      contest.title.toLowerCase().includes("test") ||
      contest.title.toLowerCase().includes("prueba");

    let confirmMessage = `¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE el concurso "${contest.title}"?`;

    if (!isTestContest) {
      confirmMessage +=
        "\n\n⚠️ ADVERTENCIA: Este no parece ser un concurso de prueba. Esta acción eliminará:\n• El concurso\n• Todas sus historias\n• Todos los votos asociados\n\n¿Continuar?";
    } else {
      confirmMessage +=
        "\n\nEsto eliminará:\n• El concurso\n• Todas sus historias\n• Todos los votos asociados";
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleteLoading(contest.id);

    try {
      console.log("🗑️ Iniciando eliminación del concurso:", contest.title);

      // 1. Eliminar todos los votos de las historias del concurso
      const { data: contestStories, error: storiesError } = await supabase
        .from("stories")
        .select("id")
        .eq("contest_id", contest.id);

      if (storiesError) {
        console.warn(
          "⚠️ Error obteniendo historias para eliminar votos:",
          storiesError
        );
      }

      if (contestStories && contestStories.length > 0) {
        const storyIds = contestStories.map((s) => s.id);

        // Eliminar votos
        const { error: votesError } = await supabase
          .from("votes")
          .delete()
          .in("story_id", storyIds);

        if (votesError) {
          console.warn("⚠️ Error eliminando votos:", votesError);
        } else {
          console.log("✅ Votos eliminados:", storyIds.length, "historias");
        }
      }

      // 2. Eliminar todas las historias del concurso
      const { error: deleteStoriesError } = await supabase
        .from("stories")
        .delete()
        .eq("contest_id", contest.id);

      if (deleteStoriesError) {
        throw new Error(
          "Error eliminando historias: " + deleteStoriesError.message
        );
      }

      console.log("✅ Historias del concurso eliminadas");

      // 3. Eliminar el concurso
      const { error: deleteContestError } = await supabase
        .from("contests")
        .delete()
        .eq("id", contest.id);

      if (deleteContestError) {
        throw new Error(
          "Error eliminando concurso: " + deleteContestError.message
        );
      }

      console.log("✅ Concurso eliminado exitosamente");

      // 4. Refrescar la lista
      await refreshContests();

      alert(`✅ Concurso "${contest.title}" eliminado completamente`);
    } catch (error) {
      console.error("❌ Error eliminando concurso:", error);
      alert("❌ Error eliminando concurso: " + error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Cambio de estado simple (sin badges)
  const changeContestStatus = async (contest, newStatus) => {
    // ✅ CORREGIDO: Usar hora de Colombia para calcular fechas
    const now = new Date();
    let updates = { status: newStatus };

    // Función helper para convertir fecha local del navegador a UTC para BD
    const toColombiaUTC = (localDate) => {
      // La fecha localDate ya está en la zona horaria del navegador
      // Solo necesitamos convertirla a UTC directamente
      return localDate.toISOString();
    };

    // Ajustar fechas según el nuevo estado
    if (newStatus === "submission") {
      const submissionEnd = new Date(now);
      submissionEnd.setDate(now.getDate() + 7);
      submissionEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

      const votingEnd = new Date(submissionEnd);
      votingEnd.setDate(votingEnd.getDate() + 5);
      votingEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

      updates.submission_deadline = toColombiaUTC(submissionEnd);
      updates.voting_deadline = toColombiaUTC(votingEnd);
    } else if (newStatus === "voting") {
      // ✅ CORREGIDO: Para test de votación, establecer fechas apropiadas
      // submission_deadline debe estar en el pasado inmediato
      const submissionPast = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutos atrás

      // voting_deadline debe estar en el futuro cercano para pruebas
      const votingEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas adelante

      updates.submission_deadline = toColombiaUTC(submissionPast);
      updates.voting_deadline = toColombiaUTC(votingEnd);
    }

    const result = await updateContest(contest.id, updates);
    if (result.success) {
      alert(`✅ Estado cambiado a "${newStatus}"`);
      await refreshContests();
    } else {
      alert("❌ Error: " + result.error);
    }
  };

  // Simular ganadores (sin badges)
  const simulateWinners = async (contest) => {
    try {
      console.log("🎭 Simulando ganadores para:", contest.title);

      // Obtener todas las historias del concurso
      const { data: stories, error } = await supabase
        .from("stories")
        .select("*")
        .eq("contest_id", contest.id)
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!stories || stories.length === 0) {
        alert("⚠️ No hay historias para simular ganadores");
        return;
      }

      // Obtener información de los usuarios
      const userIds = stories.map((story) => story.user_id).filter(Boolean);
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Combinar historias con perfiles de usuario
      const storiesWithUsers = stories.map((story) => ({
        ...story,
        user_profiles:
          userProfiles?.find((profile) => profile.id === story.user_id) || null,
      }));

      // DEBUG: Mostrar votos exactos
      const topStories = storiesWithUsers.slice(0, 5).map((s, i) => ({
        pos: i + 1,
        title: s.title?.substring(0, 20) + "...",
        likes: s.likes_count,
        created: s.created_at?.substring(0, 19)
      }));
      console.log("🔍 DEBUG - Top 5 historias con votos:");
      topStories.forEach(story => {
        console.log(`  ${story.pos}. "${story.title}" - ${story.likes} votos - ${story.created}`);
      });

      const mockWinners = await Promise.all(storiesWithUsers.slice(0, 3).map(async (story, index) => {
        const position = index + 1;
        
        // Simular el conteo de victorias como en la finalización real
        const { data: winsData } = await supabase
          .from("stories")
          .select("is_winner, winner_position")
          .eq("user_id", story.user_id)
          .eq("is_winner", true);
        
        const currentWins = winsData?.length || 0;
        const newWinsCount = currentWins + 1;
        
        console.log(`🏆 DEBUG - Posición ${position}: ${story.user_profiles?.display_name}`);
        console.log(`  - Votos: ${story.likes_count}`);
        console.log(`  - Victorias actuales: ${currentWins}`);
        console.log(`  - Nuevas victorias: ${newWinsCount}`);
        console.log(`  - ¿Badge veterano?: ${position === 1 && newWinsCount >= 2 ? 'SÍ' : 'NO'}`);
        
        return {
          ...story,
          position,
          currentWins,
          newWinsCount,
          simulatedPoints: index === 0 ? 100 : index === 1 ? 50 : 25,
        };
      }));

      // Verificar si el 4º lugar tiene los mismos votos que el 3º (mención de honor)
      let honoraryMention = null;
      if (storiesWithUsers.length >= 4) {
        const thirdPlace = mockWinners[2];
        const fourthPlace = storiesWithUsers[3];
        
        if (thirdPlace && fourthPlace && thirdPlace.likes_count === fourthPlace.likes_count) {
          honoraryMention = { ...fourthPlace, position: 4, isHonoraryMention: true };
          console.log("🎖️ Mención de Honor detectada (simulación):", honoraryMention.title);
        }
      }

      setSimulatedWinners({ winners: mockWinners, honoraryMention });
      setSelectedContest(contest);
      setShowPreviewModal(true);

      console.log(
        "🎭 Ganadores simulados:",
        mockWinners.map((w) => w.title)
      );
    } catch (error) {
      console.error("❌ Error simulando ganadores:", error);
      alert("Error simulando ganadores: " + error.message);
    }
  };

  // Finalización REAL con badges
  const handlePreviewWinners = async (contest) => {
    setFinalizingContestId(contest.id);
    const result = await previewWinners(contest.id);
    if (result.success) {
      setWinners(result); // Guardar todo el resultado incluyendo honoraryMention
      setSelectedContest(contest);
      setShowFinalizationModal(true);
    } else {
      alert("Error al obtener vista previa: " + result.error);
    }
    setFinalizingContestId(null);
  };

  const handleFinalizeContest = async () => {
    if (!selectedContest) return;

    setFinalizingContestId(selectedContest.id);
    const result = await finalizeContest(selectedContest.id);
    setFinalizationResult(result);

    if (result.success) {
      await refreshContests();
      setShowFinalizationModal(false);
      setSelectedContest(null);
      setWinners(null);
    }
    setFinalizingContestId(null);
  };

  // Crear nuevo concurso
  const handleCreateContest = async (e) => {
    e.preventDefault();

    if (!contestForm.title.trim() || !contestForm.description.trim()) {
      alert("Título y descripción son obligatorios");
      return;
    }

    // Validaciones adicionales para encuestas
    if (contestForm.status === "poll") {
      if (!contestForm.poll_title.trim()) {
        alert("El título de la encuesta es obligatorio");
        return;
      }
      if (!contestForm.poll_deadline) {
        alert("La fecha límite de votación es obligatoria");
        return;
      }
      const validOptions = contestForm.poll_options.filter(opt => opt.text.trim());
      if (validOptions.length < 2) {
        alert("Debe haber al menos 2 opciones de prompts con texto");
        return;
      }
    }

    setCreateLoading(true);
    try {
      // ✅ CORREGIDO: Solo usar columnas que existen en la tabla
      // ⚠️ IMPORTANTE: Convertir fechas a ISO con zona horaria de Colombia
      const toColombiaISO = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;

        // datetime-local da formato "2025-07-28T19:00" (sin zona horaria)
        // Necesitamos interpretarlo explícitamente como hora de Colombia y convertir a UTC para la BD

        // Crear la fecha especificando que es hora de Colombia (UTC-5)
        // Agregamos la zona horaria de Colombia para que se interprete correctamente
        const colombiaDateTime = dateTimeLocal + "-05:00"; // Formato ISO con zona horaria de Colombia
        const colombiaDate = new Date(colombiaDateTime);

        return colombiaDate.toISOString();
      };

      let result;

      if (contestForm.status === "poll") {
        // Crear concurso con encuesta usando la función de BD integrada
        const pollOptions = contestForm.poll_options
          .filter(opt => opt.text.trim())
          .map(opt => ({
            title: opt.title.trim() || "Opción sin título",
            description: opt.description.trim() || "",
            text: opt.text.trim()
          }));

        // Llamar función de BD para crear concurso con encuesta
        const { data, error } = await supabase.rpc('create_contest_with_poll', {
          contest_title: contestForm.title.trim(),
          contest_description: contestForm.description.trim(),
          contest_category: contestForm.category,
          contest_month: contestForm.month,
          min_words: contestForm.min_words,
          max_words: contestForm.max_words,
          submission_deadline: toColombiaISO(contestForm.submission_deadline),
          voting_deadline: toColombiaISO(contestForm.voting_deadline),
          prize: contestForm.prize,
          poll_title: contestForm.poll_title.trim(),
          poll_description: contestForm.poll_description.trim(),
          poll_deadline: toColombiaISO(contestForm.poll_deadline),
          poll_options: pollOptions
        });

        if (error) {
          result = { success: false, error: error.message };
        } else {
          result = { success: true, data };
        }
      } else {
        // Crear concurso normal usando función existente
        const contestData = {
          title: contestForm.title.trim(),
          description: contestForm.description.trim(),
          category: contestForm.category,
          month: contestForm.month,
          min_words: contestForm.min_words,
          max_words: contestForm.max_words,
          submission_deadline: toColombiaISO(contestForm.submission_deadline),
          voting_deadline: toColombiaISO(contestForm.voting_deadline),
          prize: contestForm.prize,
          status: contestForm.status,
          // created_at y updated_at se manejan automáticamente por la BD
        };

        result = await createContest(contestData);
      }

      if (result.success) {
        const message = contestForm.status === "poll" 
          ? "¡Concurso con encuesta creado exitosamente!"
          : "¡Concurso creado exitosamente!";
        alert(message);
        setShowCreateModal(false);
        resetForm();
        await refreshContests();
      } else {
        alert("Error al crear concurso: " + result.error);
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      alert("Error inesperado: " + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Editar concurso existente
  const handleEditContest = (contest) => {
    setEditingContest(contest);

    // ✅ CORREGIDO: Convertir fechas UTC de BD a formato datetime-local de Colombia
    const utcToColombiaLocal = (utcISOString) => {
      if (!utcISOString) return "";

      const utcDate = new Date(utcISOString);
      // Restar 5 horas para convertir de UTC a Colombia (UTC-5)
      const colombiaOffset = 5 * 60; // 5 horas en minutos
      const colombiaDate = new Date(
        utcDate.getTime() - colombiaOffset * 60 * 1000
      );

      // Formatear para datetime-local
      const year = colombiaDate.getFullYear();
      const month = String(colombiaDate.getMonth() + 1).padStart(2, "0");
      const day = String(colombiaDate.getDate()).padStart(2, "0");
      const hours = String(colombiaDate.getHours()).padStart(2, "0");
      const minutes = String(colombiaDate.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setContestForm({
      title: contest.title,
      description: contest.description,
      category: contest.category,
      month: contest.month,
      min_words: contest.min_words,
      max_words: contest.max_words,
      submission_deadline: utcToColombiaLocal(contest.submission_deadline),
      voting_deadline: utcToColombiaLocal(contest.voting_deadline),
      prize: contest.prize || "Insignia de Oro + Destacado del mes",
      status: contest.status,
    });
    setShowEditModal(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingContest) return;

    setUpdateLoading(true);
    try {
      // ✅ CORREGIDO: Solo usar columnas que existen en la tabla
      // ⚠️ IMPORTANTE: Convertir fechas a ISO con zona horaria de Colombia
      const toColombiaISO = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;

        // datetime-local da formato "2025-07-28T19:00" (sin zona horaria)
        // Necesitamos interpretarlo explícitamente como hora de Colombia y convertir a UTC para la BD

        // Crear la fecha especificando que es hora de Colombia (UTC-5)
        // Agregamos la zona horaria de Colombia para que se interprete correctamente
        const colombiaDateTime = dateTimeLocal + "-05:00"; // Formato ISO con zona horaria de Colombia
        const colombiaDate = new Date(colombiaDateTime);

        return colombiaDate.toISOString();
      };

      const updateData = {
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        category: contestForm.category,
        month: contestForm.month,
        min_words: contestForm.min_words,
        max_words: contestForm.max_words,
        submission_deadline: toColombiaISO(contestForm.submission_deadline),
        voting_deadline: toColombiaISO(contestForm.voting_deadline),
        prize: contestForm.prize,
        status: contestForm.status,
        // updated_at se maneja automáticamente por la BD
      };

      const result = await updateContest(editingContest.id, updateData);

      if (result.success) {
        alert("¡Concurso actualizado exitosamente!");
        setShowEditModal(false);
        setEditingContest(null);
        resetForm();
        await refreshContests();
      } else {
        alert("Error al actualizar concurso: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado: " + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Funciones para eliminación manual de usuarios
  const handleSimulateUserDeletion = async () => {
    if (!userEmail.trim()) {
      alert('Por favor ingresa un email');
      return;
    }

    setUserDeletionLoading(true);
    setUserDeletionResult(null);

    try {
      // Buscar usuario por email
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, email')
        .eq('email', userEmail.trim())
        .single();

      if (error || !userProfile) {
        setUserDeletionResult({ 
          success: false, 
          error: 'Usuario no encontrado con ese email' 
        });
        return;
      }

      // Simular eliminación
      const result = await simulateUserDeletion(userProfile.id);
      setUserDeletionResult({
        ...result,
        userInfo: userProfile
      });

    } catch (error) {
      setUserDeletionResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setUserDeletionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userDeletionResult?.success || !userDeletionResult?.userInfo) {
      alert('Primero debes simular la eliminación');
      return;
    }

    const confirmText = `${userDeletionResult.userInfo.display_name || userDeletionResult.userInfo.email}`;
    const userConfirm = prompt(
      `🚨 CONFIRMACIÓN FINAL: Esto eliminará TODOS los datos del usuario permanentemente.\n\nEscribe "${confirmText}" para confirmar:`
    );

    if (userConfirm !== confirmText) {
      alert('Confirmación incorrecta. Eliminación cancelada.');
      return;
    }

    setUserDeletionLoading(true);

    try {
      const result = await deleteUserAccount(userDeletionResult.userInfo.id, { dryRun: false });
      
      if (result.success) {
        alert(`✅ Usuario "${userDeletionResult.userInfo.display_name || userDeletionResult.userInfo.email}" eliminado exitosamente.`);
        setUserEmail('');
        setUserDeletionResult(null);
      } else {
        alert(`❌ Error eliminando usuario: ${result.error}`);
      }
    } catch (error) {
      alert(`💥 Error crítico: ${error.message}`);
    } finally {
      setUserDeletionLoading(false);
    }
  };

  const categories = [
    "Ficción",
    "Drama",
    "Poesía",
    "Ensayo",
    "Humor",
    "Terror",
    "Romance",
    "Ciencia Ficción",
    "Fantasía",
    "Misterio",
  ];

  const statusOptions = [
    { value: "poll", label: "Con encuesta previa", color: "purple" },
    { value: "submission", label: "Envíos abiertos", color: "blue" },
    { value: "voting", label: "En votación", color: "green" },
    { value: "results", label: "Finalizado", color: "gray" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-gray-500 mb-4">
          <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Acceso requerido</h2>
          <p>Debes iniciar sesión para acceder a este panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-gray-500 mb-4">
          <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Acceso restringido</h2>
          <p>Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  if (contestsLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "concursos", label: "Concursos", icon: Trophy },
    { id: "encuestas", label: "Encuestas", icon: Vote },
    { id: "feed", label: "Feed", icon: Rss },
    { id: "analytics", label: "Analytics", icon: Award },
    { id: "lecturas", label: "Métricas de Lectura", icon: BookOpen },
    { id: "kofi", label: "Ko-fi Badges", icon: Heart },
    { id: "usuarios", label: "Usuarios", icon: Trash2 },
    { id: "moderacion", label: "Moderación", icon: Shield },
    { id: "mantenimiento", label: "Mantenimiento", icon: Settings },
    { id: "comunicaciones", label: "Comunicaciones", icon: Users },
    { id: "redes", label: "Redes Sociales", icon: Plus },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8 bg-white dark:bg-dark-900 min-h-screen transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-100 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-primary-600 dark:text-primary-400" />
              Panel de Administración
            </h1>
            <p className="text-gray-600 dark:text-dark-300 mt-2">
              Gestión completa de concursos y herramientas administrativas
            </p>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === "concursos" && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Concurso
              </button>
            )}
            {activeTab === "analytics" && (
              <button
                onClick={handleRecalculateRankings}
                disabled={rankingLoading}
                className="bg-orange-600 dark:bg-orange-700 text-white px-4 py-2 rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 flex items-center disabled:opacity-50 transition-colors duration-200"
              >
                {rankingLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Actualizar Rankings
                  </>
                )}
              </button>
            )}
            <div className="text-sm text-gray-500 dark:text-dark-400">
              Conectado como:{" "}
              <span className="font-medium text-gray-700 dark:text-dark-200">
                {user?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
          <div className="border-b border-gray-200 dark:border-dark-600">
            <nav className="flex space-x-1 p-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                        : "text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Resultado de finalización - Solo visible en tab concursos */}
        {finalizationResult && activeTab === "concursos" && (
          <div
            className={`rounded-lg p-6 border transition-colors duration-300 ${
              finalizationResult.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-start">
              {finalizationResult.success ? (
                <Check className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <X className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 mr-3 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-bold ${
                    finalizationResult.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {finalizationResult.success
                    ? "¡Concurso finalizado exitosamente!"
                    : "Error al finalizar"}
                </h3>
                <p
                  className={`mt-1 ${
                    finalizationResult.success
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {finalizationResult.message || finalizationResult.error}
                </p>

                {finalizationResult.success &&
                  finalizationResult.badgesAwarded && (
                    <div className="mt-4">
                      <h4 className="font-medium text-green-800 mb-2">
                        Badges otorgados:
                      </h4>
                      <div className="space-y-2">
                        {finalizationResult.badgesAwarded.map(
                          (award, index) => (
                            <div
                              key={index}
                              className="flex items-center text-sm"
                            >
                              <span className="mr-2">
                                {award.position === 1
                                  ? "🥇"
                                  : award.position === 2
                                    ? "🥈"
                                    : "🥉"}
                              </span>
                              <span className="font-medium">
                                {award.userName}
                              </span>
                              <span className="mx-2">→</span>
                              <span className="text-green-700">
                                {award.badge.name}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
              <button
                onClick={() => setFinalizationResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
          {activeTab === "concursos" && (
            <div className="p-6">
              {/* Lista de concursos */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100">
                      Concursos ({contests.length})
                    </h2>
                    {(() => {
                      const sortedContests = sortContestsByPriority(contests);
                      const activeContests = sortedContests.filter(
                        (c) => c.finalized_at === null
                      );
                      const testActive = activeContests.filter((c) =>
                        isTestContest(c)
                      );
                      const prodActive = activeContests.filter(
                        (c) => !isTestContest(c)
                      );

                      return (
                        <div className="flex items-center gap-2 mt-1">
                          {testActive.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              🎭 {testActive.length} prueba
                              {testActive.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {prodActive.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              🏗️ {prodActive.length} producción
                            </span>
                          )}
                          {activeContests.length === 0 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Sin concursos activos
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => refreshContests()}
                    className="bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 flex items-center text-sm transition-colors duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </button>
                </div>

                {contests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-dark-400">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No hay concursos disponibles</p>
                    <button
                      onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                      }}
                      className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-3 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200"
                    >
                      Crear primer concurso
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortContestsByPriority(contests).map(
                      (contest, index, sortedContests) => {
                        const priorityInfo = getContestPriorityInfo(
                          contest,
                          index,
                          sortedContests
                        );
                        return (
                          <div
                            key={contest.id}
                            className={`bg-white dark:bg-dark-700 border-2 rounded-lg p-6 hover:shadow-md transition-all duration-300 ${
                              priorityInfo.priority === "ACTIVO"
                                ? "border-green-400 dark:border-green-500 shadow-lg"
                                : priorityInfo.priority &&
                                    priorityInfo.priority.includes("#")
                                  ? "border-blue-400 dark:border-blue-500"
                                  : priorityInfo.priority === "PRUEBA"
                                    ? "border-yellow-400 dark:border-yellow-500"
                                    : "border-gray-200 dark:border-dark-600"
                            } ${contest.status === "results" ? "opacity-75" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                {/* Indicador de prioridad */}
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${priorityInfo.className}`}
                                >
                                  {priorityInfo.label}
                                </span>

                                {/* Estado del concurso */}
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    contest.status === "poll"
                                      ? "bg-purple-100 text-purple-700"
                                      : contest.status === "submission"
                                        ? "bg-blue-100 text-blue-700"
                                        : contest.status === "voting"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {contest.status === "poll"
                                    ? "Con Encuesta"
                                    : contest.status === "submission"
                                      ? "Envíos"
                                      : contest.status === "voting"
                                        ? "Votación"
                                        : "Finalizado"}
                                </span>

                                {/* Mes */}
                                <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-xs">
                                  {contest.month}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditContest(contest)}
                                  className="text-gray-400 dark:text-dark-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 transition-colors duration-200"
                                  title="Editar concurso"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteContest(contest)}
                                  disabled={deleteLoading === contest.id}
                                  className="text-gray-400 dark:text-dark-500 hover:text-red-600 dark:hover:text-red-400 p-1 disabled:opacity-50 transition-colors duration-200"
                                  title="Eliminar concurso"
                                >
                                  {deleteLoading === contest.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                                {contest.status === "results" && (
                                  <Trophy className="h-5 w-5 text-yellow-500" />
                                )}
                              </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-2 line-clamp-2">
                              {contest.title}
                            </h3>

                            <p className="text-gray-600 dark:text-dark-300 text-sm mb-4 line-clamp-2">
                              {contest.description}
                            </p>

                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-dark-400 mb-4">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {contest.participants_count || 0} participantes
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {contest.voting_deadline
                                  ? new Date(
                                      contest.voting_deadline
                                    ).toLocaleDateString("es-ES")
                                  : "Sin fecha"}
                              </div>
                            </div>

                            {/* 🆕 CONTROLES DE PRUEBA */}
                            {contest.status !== "results" && (
                              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <TestTube className="h-4 w-4 text-yellow-600 mr-2" />
                                  <span className="text-sm font-medium text-yellow-800">
                                    Controles de Prueba
                                  </span>
                                </div>
                                <div className="flex gap-2 text-xs">
                                  {contest.status === "submission" && (
                                    <button
                                      onClick={() =>
                                        changeContestStatus(contest, "voting")
                                      }
                                      className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      <Play className="h-3 w-3 inline mr-1" />
                                      Test Votación
                                    </button>
                                  )}
                                  {contest.status === "voting" && (
                                    <button
                                      onClick={() =>
                                        changeContestStatus(
                                          contest,
                                          "submission"
                                        )
                                      }
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                      <RotateCcw className="h-3 w-3 inline mr-1" />
                                      Volver Envíos
                                    </button>
                                  )}
                                  <button
                                    onClick={() => simulateWinners(contest)}
                                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                  >
                                    <Eye className="h-3 w-3 inline mr-1" />
                                    Simular Ganadores
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Fechas importantes y información de cola */}
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-600 rounded-lg border border-gray-200 dark:border-dark-500">
                              <div className="text-xs text-gray-500 dark:text-dark-400 space-y-1">
                                <div>
                                  <strong>Envíos hasta:</strong>{" "}
                                  {contest.submission_deadline
                                    ? new Date(
                                        contest.submission_deadline
                                      ).toLocaleString("es-ES")
                                    : "No definido"}
                                </div>
                                <div>
                                  <strong>Votación hasta:</strong>{" "}
                                  {contest.voting_deadline
                                    ? new Date(
                                        contest.voting_deadline
                                      ).toLocaleString("es-ES")
                                    : "No definido"}
                                </div>

                                {/* Información adicional de cola */}
                                {priorityInfo.priority === "ACTIVO" && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="flex items-center text-green-600">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                      <strong>
                                        🎯 Concurso activo en la aplicación
                                      </strong>
                                    </div>
                                  </div>
                                )}

                                {priorityInfo.priority &&
                                  priorityInfo.priority.includes("#") && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="flex items-center text-blue-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        <strong>
                                          ⏳ Posición en cola:{" "}
                                          {priorityInfo.priority}
                                        </strong>
                                      </div>
                                    </div>
                                  )}

                                {priorityInfo.priority === "PRUEBA" && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="flex items-center text-yellow-600">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                      <strong>
                                        🎭 Concurso de prueba en espera
                                      </strong>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {/* 🆕 FINALIZACIÓN REAL CON BADGES */}
                              {contest.status !== "results" && (
                                <button
                                  onClick={() => handlePreviewWinners(contest)}
                                  disabled={finalizingContestId === contest.id}
                                  className="w-full bg-red-600 dark:bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 flex items-center justify-center transition-colors duration-200"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {finalizingContestId === contest.id
                                    ? "Cargando..."
                                    : "🏆 FINALIZAR REAL (Con Badges)"}
                                </button>
                              )}

                              <a
                                href="/contest/current"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-dark-200 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-500 flex items-center justify-center text-decoration-none transition-colors duration-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver en sitio
                              </a>
                            </div>

                            {contest.status === "results" && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-green-600">
                                    <Check className="h-4 w-4 mr-1" />
                                    <span>Concurso finalizado</span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleRevertFinalization(contest)
                                    }
                                    disabled={
                                      finalizingContestId === contest.id
                                    }
                                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                                    title="Revertir finalización"
                                  >
                                    <RotateCcw className="h-3 w-3 inline mr-1" />
                                    Revertir
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "encuestas" && (
            <div className="p-6">
              <PollAdminPanel />
            </div>
          )}
          {activeTab === "feed" && (
            <div className="p-6">
              <FeedAdminPanel />
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="p-6">
              <AnalyticsDashboard />
            </div>
          )}

          {activeTab === "usuarios" && (
            <div className="p-6">
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-6 flex items-center">
                    <Trash2 className="h-6 w-6 mr-3 text-red-600 dark:text-red-400" />
                    Gestión de Usuarios
                  </h2>

                  {/* Sección de eliminación manual */}
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">
                      Eliminación manual de usuarios
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email del usuario a eliminar:
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="usuario@ejemplo.com"
                          className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSimulateUserDeletion}
                          disabled={userDeletionLoading || !userEmail.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                        >
                          {userDeletionLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          Simular eliminación
                        </button>

                        {userDeletionResult?.success && (
                          <button
                            onClick={handleDeleteUser}
                            disabled={userDeletionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:bg-gray-400"
                          >
                            {userDeletionLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Eliminar usuario
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Resultado de la simulación */}
                    {userDeletionResult && (
                      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                        {userDeletionResult.success ? (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-green-800 dark:text-green-200">
                                Usuario encontrado: {userDeletionResult.userInfo?.display_name || userDeletionResult.userInfo?.email}
                              </span>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                  <strong>Historias del usuario:</strong> {userDeletionResult.simulation?.stories?.total || 0}
                                  {userDeletionResult.simulation?.stories?.winners > 0 && (
                                    <span className="text-red-600 dark:text-red-400 ml-1">
                                      ({userDeletionResult.simulation.stories.winners} ganadoras)
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <strong>Comentarios del usuario:</strong> {userDeletionResult.simulation?.comments || 0}
                                </div>
                                <div>
                                  <strong>Votos dados:</strong> {userDeletionResult.simulation?.votes || 0}
                                </div>
                                <div>
                                  <strong>Badges:</strong> {userDeletionResult.simulation?.badges || 0}
                                </div>
                              </div>

                              {userDeletionResult.simulation?.stories?.total > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                                      ELIMINAR
                                    </span>
                                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                      {userDeletionResult.simulation.stories.total} historias del usuario serán eliminadas
                                    </span>
                                  </div>
                                  <p className="text-xs text-red-700 dark:text-red-300">
                                    Su contenido será eliminado permanentemente. Nadie podrá leerlas.
                                  </p>
                                  
                                  {userDeletionResult.simulation.stories.titles?.length > 0 && (
                                    <div className="mt-2">
                                      <strong className="text-xs">Historias a eliminar:</strong>
                                      <ul className="list-disc list-inside mt-1 text-xs text-red-600 dark:text-red-400">
                                        {userDeletionResult.simulation.stories.titles.map((title, index) => (
                                          <li key={index}>"{title}"</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                                    ELIMINAR
                                  </span>
                                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Datos personales del usuario
                                  </span>
                                </div>
                                <p className="text-xs text-red-700 dark:text-red-300">
                                  Perfil, comentarios, votos, badges y notificaciones serán eliminados permanentemente.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <span className="text-red-600 dark:text-red-400">
                              Error: {userDeletionResult.error}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 text-sm text-red-700 dark:text-red-300">
                      <p><strong>⚠️ Importante:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Esta acción es <strong>irreversible</strong></li>
                        <li>Eliminará TODOS los datos del usuario</li>
                        <li>Usar solo para solicitudes legítimas de eliminación</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "moderacion" && (
            <div className="p-6 space-y-6">
              <ModerationDashboard />
              <ReportsPanel />
            </div>
          )}

          {activeTab === "mantenimiento" && (
            <div className="p-6 space-y-6">
              <MaintenanceControl />
              <DataCleanupPanel />
            </div>
          )}

          {activeTab === "comunicaciones" && (
            <div className="p-6">
              <EmailManager />
            </div>
          )}
          {activeTab === "redes" && (
            <div className="p-6">
              <SocialGenerator />
            </div>
          )}

          {activeTab === "kofi" && (
            <div className="p-6">
              <KofiBadgePanel />
            </div>
          )}

          {activeTab === "lecturas" && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                  Seleccionar Concurso
                </label>
                <select
                  value={metricsContestId || ''}
                  onChange={(e) => setMetricsContestId(e.target.value || null)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
                >
                  <option value="">Selecciona un concurso...</option>
                  {sortContestsByPriority(contests).map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.title} {contest.finalized_at ? '(Finalizado)' : '(Activo)'}
                    </option>
                  ))}
                </select>
              </div>
              <ReadingMetricsPanel contestId={metricsContestId} />
            </div>
          )}
        </div>

        {/* Modal de simulación de ganadores */}
        {showPreviewModal && selectedContest && simulatedWinners?.winners && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <TestTube className="h-6 w-6 mr-2 text-purple-600" />
                    Simulación - "{selectedContest.title}"
                  </h2>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <TestTube className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-purple-800 mb-1">
                        Solo Simulación - Sin Badges
                      </h3>
                      <p className="text-purple-700 text-sm">
                        Esta es una vista previa para pruebas. Los ganadores
                        mostrados no recibirán badges ni se registrarán puntos
                        reales.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vista previa de ganadores simulados */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ganadores simulados:
                  </h3>
                  <div className="space-y-3">
                    {simulatedWinners.winners.map((story, index) => (
                      <div
                        key={story.id}
                        className={`flex items-center p-4 rounded-lg border-2 ${
                          index === 0
                            ? "border-yellow-300 bg-yellow-50"
                            : index === 1
                              ? "border-gray-300 bg-gray-50"
                              : "border-orange-300 bg-orange-50"
                        }`}
                      >
                        <div className="mr-4">
                          {index === 0 ? (
                            <Crown className="h-8 w-8 text-yellow-600" />
                          ) : index === 1 ? (
                            <Medal className="h-8 w-8 text-gray-600" />
                          ) : (
                            <Star className="h-8 w-8 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">
                              {index === 0 ? "1º" : index === 1 ? "2º" : "3º"}{" "}
                              Lugar
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                index === 0
                                  ? "bg-yellow-200 text-yellow-800"
                                  : index === 1
                                    ? "bg-gray-200 text-gray-800"
                                    : "bg-orange-200 text-orange-800"
                              }`}
                            >
                              {story.likes_count || 0} likes
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {story.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            por {story.user_profiles?.display_name || "Usuario"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Simularía:
                          </div>
                          <div
                            className={`font-medium ${
                              index === 0
                                ? "text-yellow-700"
                                : index === 1
                                  ? "text-gray-700"
                                  : "text-orange-700"
                            }`}
                          >
                            +{story.simulatedPoints} puntos
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mención de Honor en simulación */}
                  {simulatedWinners?.honoraryMention && (
                    <div className="mt-4 p-4 rounded-lg border-2 border-blue-300 bg-blue-50">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <Award className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-blue-700">
                              🎖️ Mención de Honor (Simulación)
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-200 text-blue-800">
                              {simulatedWinners.honoraryMention.likes_count || 0} likes
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {simulatedWinners.honoraryMention.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            por {simulatedWinners.honoraryMention.user_profiles?.display_name || "Usuario"}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Mismos votos que 3º lugar - Criterio de desempate: fecha de envío
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Reconocimiento:</div>
                          <div className="font-medium text-blue-700">
                            🎖️ Mención especial
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal crear concurso */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-600">
              <form onSubmit={handleCreateContest} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center">
                    <Plus className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
                    Crear Nuevo Concurso
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Título del concurso *
                    </label>
                    <input
                      type="text"
                      required
                      value={contestForm.title}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      required
                      value={contestForm.description}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Categoría
                    </label>
                    <select
                      value={contestForm.category}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Mes
                    </label>
                    <input
                      type="text"
                      value={contestForm.month}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          month: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Palabras mínimas
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={contestForm.min_words}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          min_words: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Palabras máximas
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      value={contestForm.max_words}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          max_words: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Fin de envíos
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={contestForm.submission_deadline}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          submission_deadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Fin de votación
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={contestForm.voting_deadline}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          voting_deadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Premio
                    </label>
                    <input
                      type="text"
                      value={contestForm.prize}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          prize: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Status inicial
                    </label>
                    <select
                      value={contestForm.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setContestForm({
                          ...contestForm,
                          status: newStatus,
                          poll_enabled: newStatus === "poll",
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona "Con encuesta previa" para que los usuarios voten por el prompt antes del concurso
                    </p>
                  </div>
                </div>

                {/* Campos de encuesta condicionales */}
                {contestForm.status === "poll" && (
                  <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Vote className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                        Configuración de Encuesta
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Título de la encuesta *
                        </label>
                        <input
                          type="text"
                          required={contestForm.status === "poll"}
                          value={contestForm.poll_title}
                          onChange={(e) =>
                            setContestForm({
                              ...contestForm,
                              poll_title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Fecha límite de votación *
                        </label>
                        <input
                          type="datetime-local"
                          required={contestForm.status === "poll"}
                          value={contestForm.poll_deadline}
                          onChange={(e) =>
                            setContestForm({
                              ...contestForm,
                              poll_deadline: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Debe ser antes del inicio de envíos del concurso
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Descripción de la encuesta
                      </label>
                      <textarea
                        value={contestForm.poll_description}
                        onChange={(e) =>
                          setContestForm({
                            ...contestForm,
                            poll_description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Opciones de prompts (mínimo 2)
                      </label>
                      {contestForm.poll_options.map((option, index) => (
                        <div key={index} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Opción {index + 1}
                            </span>
                            {contestForm.poll_options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = contestForm.poll_options.filter((_, i) => i !== index);
                                  setContestForm({
                                    ...contestForm,
                                    poll_options: newOptions,
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Título corto
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Historia de amor"
                                value={option.title}
                                onChange={(e) => {
                                  const newOptions = [...contestForm.poll_options];
                                  newOptions[index] = { ...option, title: e.target.value };
                                  setContestForm({
                                    ...contestForm,
                                    poll_options: newOptions,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Descripción (opcional)
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Enfoque romántico con final feliz"
                                value={option.description}
                                onChange={(e) => {
                                  const newOptions = [...contestForm.poll_options];
                                  newOptions[index] = { ...option, description: e.target.value };
                                  setContestForm({
                                    ...contestForm,
                                    poll_options: newOptions,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Prompt completo *
                            </label>
                            <textarea
                              placeholder="Ej: Escribe una historia sobre dos personas que se conocen en una librería durante una tormenta..."
                              required={contestForm.status === "poll"}
                              value={option.text}
                              onChange={(e) => {
                                const newOptions = [...contestForm.poll_options];
                                newOptions[index] = { ...option, text: e.target.value };
                                setContestForm({
                                  ...contestForm,
                                  poll_options: newOptions,
                                });
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                      
                      {contestForm.poll_options.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            setContestForm({
                              ...contestForm,
                              poll_options: [
                                ...contestForm.poll_options,
                                { title: "", description: "", text: "" }
                              ],
                            });
                          }}
                          className="mt-2 px-4 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200"
                        >
                          + Agregar otra opción
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createLoading}
                    className="bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 flex items-center transition-colors duration-200"
                  >
                    {createLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Crear Concurso
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal editar concurso */}
        {showEditModal && editingContest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-600">
              <form onSubmit={handleSaveEdit} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center">
                    <Edit className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
                    Editar Concurso
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Título del concurso *
                    </label>
                    <input
                      type="text"
                      required
                      value={contestForm.title}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      required
                      value={contestForm.description}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Categoría
                    </label>
                    <select
                      value={contestForm.category}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Mes
                    </label>
                    <input
                      type="text"
                      value={contestForm.month}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          month: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Palabras mínimas
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={contestForm.min_words}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          min_words: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Palabras máximas
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      value={contestForm.max_words}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          max_words: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Fin de envíos
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={contestForm.submission_deadline}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          submission_deadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Fin de votación
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={contestForm.voting_deadline}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          voting_deadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Premio
                    </label>
                    <input
                      type="text"
                      value={contestForm.prize}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          prize: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Status actual
                    </label>
                    <select
                      value={contestForm.status}
                      onChange={(e) =>
                        setContestForm({
                          ...contestForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={updateLoading}
                    className="bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center transition-colors duration-200"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de finalización REAL */}
        {showFinalizationModal && selectedContest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-red-600" />
                    FINALIZACIÓN REAL - "{selectedContest.title}"
                  </h2>
                  <button
                    onClick={() => setShowFinalizationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-red-800 mb-1">
                        ⚠️ ATENCIÓN: Finalización Real
                      </h3>
                      <p className="text-red-700 text-sm">
                        Esta acción finalizará el concurso DEFINITIVAMENTE,
                        marcará a los ganadores, actualizará estadísticas de
                        victorias y NO se puede deshacer fácilmente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vista previa de ganadores */}
                {winners?.winners && winners.winners.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Ganadores que recibirán badges:
                    </h3>
                    <div className="space-y-3">
                      {winners.winners.slice(0, 3).map((story, index) => (
                        <div
                          key={story.id}
                          className={`flex items-center p-4 rounded-lg border-2 ${
                            index === 0
                              ? "border-yellow-300 bg-yellow-50"
                              : index === 1
                                ? "border-gray-300 bg-gray-50"
                                : "border-orange-300 bg-orange-50"
                          }`}
                        >
                          <div className="mr-4">
                            {index === 0 ? (
                              <Crown className="h-8 w-8 text-yellow-600" />
                            ) : index === 1 ? (
                              <Medal className="h-8 w-8 text-gray-600" />
                            ) : (
                              <Star className="h-8 w-8 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">
                                {index === 0 ? "1º" : index === 1 ? "2º" : "3º"}{" "}
                                Lugar
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  index === 0
                                    ? "bg-yellow-200 text-yellow-800"
                                    : index === 1
                                      ? "bg-gray-200 text-gray-800"
                                      : "bg-orange-200 text-orange-800"
                                }`}
                              >
                                {story.likes_count || 0} likes
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {story.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              por{" "}
                              {story.user_profiles?.display_name || "Usuario"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Recibirá:
                            </div>
                            <div
                              className={`font-medium ${
                                index === 0
                                  ? "text-yellow-700"
                                  : index === 1
                                    ? "text-gray-700"
                                    : "text-orange-700"
                              }`}
                            >
                              {index === 0
                                ? "🏆 Primer lugar (+1 victoria)"
                                : index === 1
                                  ? "🥈 Segundo lugar (+1 victoria)"
                                  : "🥉 Tercer lugar (+1 victoria)"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mención de Honor */}
                {winners?.honoraryMention && (
                  <div className="mt-4 p-4 rounded-lg border-2 border-blue-300 bg-blue-50">
                    <div className="flex items-center">
                      <div className="mr-4">
                        <Award className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-blue-700">
                            🎖️ Mención de Honor
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-200 text-blue-800">
                            {winners.honoraryMention.likes_count || 0}{" "}
                            likes
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {winners.honoraryMention.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          por{" "}
                          {winners.honoraryMention.user_profiles
                            ?.display_name || "Usuario"}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Mismos votos que 3º lugar - Criterio de desempate:
                          fecha de envío
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Reconocimiento:
                        </div>
                        <div className="font-medium text-blue-700">
                          🎖️ Mención especial
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {winners?.winners && winners.winners.length === 0 && (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-600 text-center">
                      No hay participaciones en este concurso para finalizar.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowFinalizationModal(false)}
                    disabled={finalizationLoading}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinalizeContest}
                    disabled={
                      finalizationLoading || !winners?.winners || winners.winners.length === 0
                    }
                    className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    {finalizationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        SÍ, FINALIZAR CONCURSO
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug en desarrollo */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-red-800 dark:text-red-200 font-bold mb-2">
              🚨 DEBUG - Solo desarrollo
            </h4>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  localStorage.clear();
                  alert("LocalStorage limpiado");
                }}
                className="bg-orange-600 dark:bg-orange-700 text-white px-4 py-2 rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors duration-200"
              >
                Limpiar LocalStorage
              </button>
              <button
                onClick={() => {
                  console.log("🔍 Estado actual del contexto:", {
                    contests,
                    user,
                    isAuthenticated,
                  });
                }}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
              >
                Log Estado
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContestAdminPanel;
