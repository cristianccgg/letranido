// pages/CurrentContest.jsx - VERSIÓN CORREGIDA Y LIMPIA
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  PenTool,
  Calendar,
  Users,
  Clock,
  Heart,
  Eye,
  ChevronDown,
  Filter,
  Search,
  RefreshCw,
  Award,
  Medal,
  Crown,
  AlertCircle,
  Loader,
  BookOpen,
  BookCheck,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { useGlobalToast } from "../hooks/useGlobalToast";
import { useReadStories } from "../hooks/useReadStories";
import SEOHead from "../components/SEO/SEOHead";
import AuthModal from "../components/forms/AuthModal";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import ContestActionButton from "../components/ui/ContestActionButton";
import UserAvatar from "../components/ui/UserAvatar";
import { UserWithTopBadge } from "../components/ui/UserNameWithBadges";
import UserCardWithBadges from "../components/ui/UserCardWithBadges";
import SocialShareDropdown from "../components/ui/SocialShareDropdown";
import WinnerCelebration from "../components/ui/WinnerCelebration";
import useWinnerCelebration from "../hooks/useWinnerCelebration";
import { preloadUsersBadges } from "../hooks/useBadgesCache";

const CurrentContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ TODO DESDE EL CONTEXTO GLOBAL
  const {
    user,
    isAuthenticated,
    currentContest,
    nextContest,
    contests,
    contestsLoading,
    galleryStories,
    galleryLoading,
    votingStats,
    initialized,
    globalLoading,
    getContestById,
    refreshContests,
    refreshUserData,
    toggleLike,
    getContestPhase,
    loadGalleryStories,
    openAuthModal,
  } = useGlobalApp();

  // ✅ TOAST NOTIFICATIONS
  const { showSuccessToast } = useGlobalToast();
  const [toastShown, setToastShown] = useState(false);

  // ✅ LOCAL STATE PARA CURRENTCONTEST - USA GALLERYSTORIES DEL CONTEXTO
  const [contest, setContest] = useState(null);

  // ✅ ALIAS PARA COMPATIBILIDAD - AHORA STORIES = GALLERYSTORIES
  const stories = galleryStories;
  const storiesLoading = galleryLoading;
  const [error, setError] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("random");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Contador de tiempo real
  const [timeLeft, setTimeLeft] = useState("");
  const [honoraryMention, setHonoraryMention] = useState(null);

  // Estado para forzar re-render cuando cambian los votos
  const [voteTimestamp, setVoteTimestamp] = useState(Date.now());

  // Refs para scroll
  const storiesSectionRef = useRef(null);

  // Hook para celebraciones de ganadores
  const { celebration, closeCelebration } = useWinnerCelebration();

  // ✅ SISTEMA DE HISTORIAS LEÍDAS
  const { readStories, readStats, toggleRead, isStoryRead } = useReadStories(
    contest?.id,
    user?.id
  );

  // ✅ MODO DESARROLLO: Forzar fase de votación para testing
  const DEV_FORCE_VOTING =
    import.meta.env.VITE_DEV_FORCE_VOTING_PHASE === "true";

  // ✅ DETERMINAR QUE CONCURSO MOSTRAR (Memoizado para evitar re-renders)
  const contestToLoad = useMemo(() => {
    // Si hay ID en la URL, SIEMPRE usar ese ID específico
    if (id) {
      return id;
    }

    // Solo si no hay ID, usar el reto actual por defecto
    if (currentContest?.id) {
      return currentContest.id;
    }
    return null;
  }, [id, currentContest?.id]);

  // ✅ DETECTAR TOAST DE ÉXITO DESDE WRITEPROPT
  useEffect(() => {
    if (
      location.state?.showSuccessToast &&
      location.state?.storyTitle &&
      !toastShown
    ) {
      const storyTitle = location.state.storyTitle;

      // Delay pequeño para que la página se cargue
      const timer = setTimeout(() => {
        showSuccessToast(
          "¡Historia Enviada!",
          "Guardada exitosamente en el concurso",
          storyTitle,
          {
            showDonation: true, // Mostrar sección de donación
          }
        );

        // Marcar como mostrado para evitar loops
        setToastShown(true);

        // Limpiar el state para evitar que se muestre de nuevo
        window.history.replaceState({}, document.title, location.pathname);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    location.state?.showSuccessToast,
    location.state?.storyTitle,
    toastShown,
    showSuccessToast,
    location.pathname,
  ]);

  // ✅ UTILITY FUNCTIONS
  const getReadingTime = (wordCount) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Hace menos de una hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hace 1 día";
    if (diffInDays < 30) return `Hace ${diffInDays} días`;
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
  };

  // ✅ CARGAR CONCURSO Y VERIFICAR VISIBILIDAD
  useEffect(() => {
    const loadContestData = async () => {
      if (!initialized) return;

      // Reset state al iniciar
      setError(null);

      try {
        let contestData;

        // 1. Obtener datos del reto
        if (contestToLoad) {
          try {
            contestData = await getContestById(contestToLoad);
          } catch (err) {
            console.error("❌ Error obteniendo reto:", err);
            setError("Reto no encontrado");
            setContest(null);
            return;
          }
        } else {
          if (contests.length > 0) {
            contestData = contests[0];
          } else {
            setError("No hay retos disponibles");
            setContest(null);
            return;
          }
        }

        setContest(contestData);

        // 2. Cargar historias usando SIEMPRE galleryStories para máxima reactividad
        // ✅ OPTIMIZACIÓN: Durante votación ciega, no cargar likes_count ni views_count
        const contestPhase = getContestPhase(contestData);
        const isBlindVoting = contestPhase === "voting";

        await loadGalleryStories({
          contestId: contestData.id,
          blindVoting: isBlindVoting,
        });
      } catch (err) {
        console.error("💥 Error general cargando reto:", err);
        setError("Error inesperado: " + err.message);
        setContest(null);
      }
    };

    loadContestData();
  }, [
    contestToLoad,
    initialized,
    // Removidas las funciones que no cambian para evitar re-renders
  ]);

  // ✅ OPTIMIZACIÓN: Precargar badges cuando se cargan las historias
  useEffect(() => {
    const preloadBadges = async () => {
      if (galleryStories.length > 0) {
        const userIds = galleryStories
          .map((story) => story.user_id)
          .filter(Boolean);
        if (userIds.length > 0) {
          await preloadUsersBadges(userIds);
        }
      }
    };

    preloadBadges();
  }, [galleryStories.length]);

  // ✅ SCROLL A SECCIÓN DE HISTORIAS SI VIENE DEL HASH
  useEffect(() => {
    if (
      window.location.hash === "#stories-section" &&
      storiesSectionRef.current
    ) {
      setTimeout(() => {
        storiesSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    }
  }, [galleryStories.length]);

  // ✅ NOTA: Removidos useLayoutEffect innecesarios que causaban ciclos de re-renders
  // Los datos se sincronizan automáticamente vía galleryStories del contexto

  // ✅ REFRESH COMPLETO
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Si estamos en fase de votación, también re-randomizar
      if (phaseInfo?.phase === "voting") {
        reshuffleStories();
      }

      await Promise.all([
        refreshContests(),
        refreshUserData(),
        contest?.id
          ? loadGalleryStories({
              contestId: contest.id,
              blindVoting: phaseInfo?.phase === "voting",
            })
          : Promise.resolve(),
      ]);

      // Recargar badges después del refresh si hay historias
      if (galleryStories.length > 0) {
        const userIds = galleryStories
          .map((story) => story.user_id)
          .filter(Boolean);
        if (userIds.length > 0) {
          await preloadUsersBadges(userIds);
        }
      }
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ HANDLE VOTE SIMPLIFICADO - SOLO CONTEXTO GLOBAL (SE SINCRONIZA AUTOMÁTICAMENTE)
  // eslint-disable-next-line no-unused-vars
  const handleVote = async (storyId) => {
    if (!isAuthenticated) {
      openAuthModal("register");
      return;
    }

    try {
      const result = await toggleLike(storyId);

      if (result.success) {
        // ✅ NO NECESITAMOS ACTUALIZACIÓN LOCAL - SE SINCRONIZA AUTOMÁTICAMENTE VIA useEffect
      } else {
        console.error("Error voting:", result.error);
        alert("Error al procesar el voto: " + result.error);
      }
    } catch (err) {
      console.error("Error voting:", err);
      alert("Error inesperado al votar");
    }
  };

  // ✅ FUNCIÓN PARA RANDOMIZAR CON ORDEN CONSISTENTE POR SESIÓN
  const getRandomizedStories = useCallback(
    (stories, contestId, searchTerm) => {
      if (!stories || !contestId) return [];

      // Crear clave única basada en sesión del usuario para mantener consistencia durante la navegación
      const sessionKey = `contest_${contestId}_session_${user?.id || "anonymous"}_${new Date().toDateString()}`;
      const storageKey = `contest_${contestId}_random_order_${searchTerm || "all"}_${sessionKey}`;

      try {
        // Intentar obtener orden guardado para esta sesión
        const savedOrder = localStorage.getItem(storageKey);

        if (savedOrder) {
          const orderIds = JSON.parse(savedOrder);
          // Recrear el orden basado en los IDs guardados
          const orderedStories = orderIds
            .map((id) => stories.find((s) => s.id === id))
            .filter(Boolean); // Remover historias que ya no existen

          // Si tenemos todas las historias en el orden guardado, usarlo
          if (orderedStories.length === stories.length) {
            return orderedStories;
          }

          // Si faltan historias (nuevas agregadas), agregarlas al final manteniendo el orden existente
          const existingIds = new Set(orderIds);
          const newStories = stories.filter(
            (story) => !existingIds.has(story.id)
          );
          if (newStories.length > 0) {
            const updatedOrder = [...orderedStories, ...newStories];
            const updatedOrderIds = updatedOrder.map((story) => story.id);
            localStorage.setItem(storageKey, JSON.stringify(updatedOrderIds));
            return updatedOrder;
          }
        }

        // Si no hay orden guardado, crear nuevo orden usando seed basado en usuario y día
        const seed = user?.id ? user.id.slice(-8) : Math.random().toString();
        const dayOfYear = Math.floor(
          (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
        );
        const randomSeed = parseInt(seed.slice(-4), 16) + dayOfYear;

        // Función de shuffle determinística basada en el seed
        const deterministicShuffle = (array, seed) => {
          const shuffled = [...array];
          let currentIndex = shuffled.length;
          let random = seed;

          while (currentIndex !== 0) {
            // Generar número pseudo-aleatorio simple
            random = (random * 9301 + 49297) % 233280;
            const randomIndex = random % currentIndex;
            currentIndex--;

            [shuffled[currentIndex], shuffled[randomIndex]] = [
              shuffled[randomIndex],
              shuffled[currentIndex],
            ];
          }

          return shuffled;
        };

        const shuffled = deterministicShuffle(stories, randomSeed);
        const orderIds = shuffled.map((story) => story.id);

        // Guardar el nuevo orden
        localStorage.setItem(storageKey, JSON.stringify(orderIds));

        return shuffled;
      } catch (error) {
        console.error("Error handling random order:", error);
        // Fallback a orden aleatorio simple sin persistencia
        return [...stories].sort(() => Math.random() - 0.5);
      }
    },
    [user?.id]
  );

  // ✅ FUNCIÓN PARA RESETEAR EL ORDEN ALEATORIO
  const reshuffleStories = useCallback(() => {
    if (!contest?.id) return;

    // Eliminar órdenes guardados para este reto y sesión actual
    const sessionKey = `contest_${contest.id}_session_${user?.id || "anonymous"}_${new Date().toDateString()}`;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (
        key.startsWith(`contest_${contest.id}_random_order_`) &&
        key.includes(sessionKey)
      ) {
        localStorage.removeItem(key);
      }
    });

    // Forzar re-render si está en modo random
    if (sortBy === "random") {
      // Trigger a re-render by updating a dependency
      setSortBy("random");
    }
  }, [contest?.id, sortBy, user?.id]);

  // ✅ FILTROS Y ORDENAMIENTO - Con random consistente
  const filteredAndSortedStories = useMemo(() => {
    // Si galleryStories está vacía, mostrar array vacío (loading se maneja aparte)
    if (galleryStories.length === 0) {
      return [];
    }

    let filtered = [...galleryStories];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(search) ||
          story.author.toLowerCase().includes(search) ||
          story.excerpt.toLowerCase().includes(search)
      );
    }

    switch (sortBy) {
      case "popular":
        return filtered.sort((a, b) => {
          // Primero por likes_count (descendente)
          const likesA = a.likes_count || 0;
          const likesB = b.likes_count || 0;
          if (likesB !== likesA) {
            return likesB - likesA;
          }

          // En caso de empate, por created_at (ascendente - más antigua primero)
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;
        });
      case "viewed":
        return filtered.sort(
          (a, b) => (b.views_count || 0) - (a.views_count || 0)
        );
      case "alphabetical":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "author":
        return filtered.sort((a, b) => a.author.localeCompare(b.author));
      case "random": {
        // ✅ ORDENAMIENTO INTELIGENTE en fase de votación
        // Calcular fase directamente para evitar dependencia circular
        const currentPhase = contest
          ? DEV_FORCE_VOTING
            ? "voting"
            : getContestPhase(contest)
          : null;

        if (currentPhase === "voting" && isAuthenticated && readStories) {
          // Separar historias en leídas y no leídas
          const unreadStories = filtered.filter(
            (story) => !isStoryRead(story.id)
          );
          const readStoriesList = filtered.filter((story) =>
            isStoryRead(story.id)
          );

          // Randomizar cada grupo por separado
          const randomizedUnread = getRandomizedStories(
            unreadStories,
            contest?.id,
            searchTerm + "_unread"
          );
          const randomizedRead = getRandomizedStories(
            readStoriesList,
            contest?.id,
            searchTerm + "_read"
          );

          // Mostrar no leídas primero, luego leídas
          return [...randomizedUnread, ...randomizedRead];
        }

        // Orden random normal si no está en votación
        return getRandomizedStories(filtered, contest?.id, searchTerm);
      }
      case "recent":
        return filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      default:
        return getRandomizedStories(filtered, contest?.id, searchTerm);
    }
  }, [
    galleryStories,
    searchTerm,
    sortBy,
    contest,
    getRandomizedStories,
    voteTimestamp, // Forzar re-cálculo cuando cambian los votos
    DEV_FORCE_VOTING,
    getContestPhase,
    isAuthenticated,
    readStories,
    isStoryRead,
  ]);

  // ✅ GENERAR DATOS PARA COMPARTIR HISTORIA ESPECÍFICA
  const getStoryShareData = (story) => {
    if (!story) return null;

    // URL de la historia específica
    const storyUrl = `${window.location.origin}/story/${story.id}`;

    // Mensaje genérico y limpio
    return {
      title: `"${story.title}" - Letranido`,
      text: `📖 "${story.title}" por ${story.author}\n\n✨ Lee esta historia en Letranido:`,
      url: storyUrl,
    };
  };

  // ✅ FUNCIONES DE UTILIDAD
  const getPhaseInfo = useCallback(() => {
    if (!contest) return null;

    // ✅ MODO DEV: Forzar fase de votación si está activado
    const phase = DEV_FORCE_VOTING ? "voting" : getContestPhase(contest);
    const now = new Date();

    // 🔧 CORREGIDO: Lógica mejorada para determinar tipo de reto
    const isCurrentContest = contest.id === currentContest?.id;
    const isNextContest = contest.id === nextContest?.id;
    const isHistoricalContest = !isCurrentContest && !isNextContest;

    switch (phase) {
      case "submission": {
        // 🆕 Si es histórico, mostrar como solo lectura
        if (isHistoricalContest) {
          return {
            phase: "historical",
            title: "📚 Reto Histórico",
            description: `Reto de ${contest.month} - Solo lectura`,
            bgColor: "bg-indigo-50",
            borderColor: "border-indigo-200",
            textColor: "text-indigo-800",
            buttonText: "Ver historias",
            scrollToStories: true,
            showStories: true,
            isHistorical: true,
          };
        }

        // 🔧 CORREGIDO: Para retos actuales o siguientes en fase de envío, NO mostrar historias
        const submissionEnd = new Date(contest.submission_deadline);
        const daysLeft = Math.ceil(
          (submissionEnd - now) / (1000 * 60 * 60 * 24)
        );

        return {
          phase: "submission",
          title: isNextContest
            ? "📝 Próximo Reto - Período de Envío"
            : "📝 Período de Envío",
          description: `Quedan ${Math.max(0, daysLeft)} días para participar`,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          buttonText: "Escribir mi historia",
          buttonLink: `/write/${contest.id}`,
          showStories: false, // 🔧 IMPORTANTE: Siempre false durante envíos
          message: isNextContest
            ? "Este reto estará disponible para leer cuando termine el período de envío"
            : "Las historias se mostrarán cuando inicie la votación",
        };
      }
      case "voting": {
        // 🆕 Si es histórico, mostrar como solo lectura
        if (isHistoricalContest) {
          return {
            phase: "historical",
            title: "📚 Reto Histórico",
            description: `Reto de ${contest.month} - Solo lectura`,
            bgColor: "bg-indigo-50",
            borderColor: "border-indigo-200",
            textColor: "text-indigo-800",
            buttonText: "Ver historias",
            scrollToStories: true,
            showStories: true,
            isHistorical: true,
          };
        }

        const votingEnd = new Date(contest.voting_deadline);
        const votingDaysLeft = Math.ceil(
          (votingEnd - now) / (1000 * 60 * 60 * 24)
        );
        return {
          phase: "voting",
          title: "🗳️ Votación Activa",
          description: `Quedan ${Math.max(0, votingDaysLeft)} días para votar`,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          buttonText: "Votar por historias",
          scrollToStories: true,
          showStories: true,
        };
      }
      case "counting":
        return {
          phase: "counting",
          title: "⏱️ Votación Cerrada",
          description:
            "La votación ha cerrado automáticamente. Los resultados se publicarán muy pronto.",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
          buttonText: "Ver historias",
          scrollToStories: true,
          showStories: true,
        };
      case "results":
        return {
          phase: "results",
          title: isHistoricalContest
            ? "📚 Reto Histórico"
            : "🏆 Resultados Finales",
          description: isHistoricalContest
            ? `Reto de ${contest.month} - Solo lectura`
            : "¡Reto finalizado! Conoce a los ganadores",
          bgColor: isHistoricalContest ? "bg-indigo-50" : "bg-yellow-50",
          borderColor: isHistoricalContest
            ? "border-indigo-200"
            : "border-yellow-200",
          textColor: isHistoricalContest
            ? "text-indigo-800"
            : "text-yellow-800",
          buttonText: "Ver ganadores",
          scrollToStories: true,
          showStories: true,
          isHistorical: isHistoricalContest,
        };

      default:
        return {
          phase: "unknown",
          title: "🏆 Reto",
          description: "Estado del reto",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          showStories: false,
        };
    }
  }, [
    contest,
    currentContest?.id,
    nextContest?.id,
    getContestPhase,
    DEV_FORCE_VOTING,
  ]);

  const phaseInfo = useMemo(() => getPhaseInfo(), [getPhaseInfo]);

  // ✅ DETECCIÓN DE MENCIÓN DE HONOR - Solo en fase "results"
  useEffect(() => {
    if (
      phaseInfo?.phase === "results" &&
      sortBy === "popular" &&
      galleryStories.length >= 4
    ) {
      const sortedStories = [...galleryStories].sort((a, b) => {
        // Primero por likes_count (descendente)
        const likesA = a.likes_count || 0;
        const likesB = b.likes_count || 0;
        if (likesB !== likesA) {
          return likesB - likesA;
        }

        // En caso de empate, por created_at (ascendente - más antigua primero)
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB;
      });

      const thirdPlace = sortedStories[2];
      const fourthPlace = sortedStories[3];

      if (
        thirdPlace &&
        fourthPlace &&
        thirdPlace.likes_count === fourthPlace.likes_count
      ) {
        setHonoraryMention({
          ...fourthPlace,
          position: 4,
          isHonoraryMention: true,
        });
        console.log(
          "🎖️ Mención de Honor detectada en CurrentContest:",
          fourthPlace.title
        );
      } else {
        setHonoraryMention(null);
      }
    } else {
      setHonoraryMention(null);
    }
  }, [phaseInfo?.phase, sortBy, galleryStories]);

  // ✅ ESTADÍSTICAS DEL CONCURSO MEMOIZADAS - Evita recálculos innecesarios
  const contestStats = useMemo(() => {
    if (storiesLoading || !stories.length) {
      return {
        totalStories: 0,
        totalWords: 0,
        formattedWords: "0",
      };
    }

    const totalWords = stories.reduce(
      (total, story) => total + (story.word_count || 0),
      0
    );

    return {
      totalStories: stories.length,
      totalWords,
      formattedWords: totalWords.toLocaleString(),
    };
  }, [stories, storiesLoading]);

  // ✅ CAMBIAR ORDENAMIENTO AUTOMÁTICAMENTE EN FASE DE RESULTADOS
  useEffect(() => {
    if (contest && phaseInfo?.phase === "results" && sortBy === "random") {
      setSortBy("popular"); // Cambiar a ordenamiento por votos cuando hay resultados
    }
  }, [contest, phaseInfo?.phase, sortBy]);

  // ✅ ESCUCHAR CAMBIOS DE VOTOS PARA FORZAR RE-RENDER
  useEffect(() => {
    const handleVoteChange = () => {
      console.log(
        "🔄 CurrentContest: Detectado cambio de voto, forzando re-render"
      );
      setVoteTimestamp(Date.now());
    };

    window.addEventListener("voteChanged", handleVoteChange);

    return () => {
      window.removeEventListener("voteChanged", handleVoteChange);
    };
  }, []);

  // ✅ CONTADOR DE TIEMPO REAL (similar a landing page)
  useEffect(() => {
    if (!contest) {
      setTimeLeft("");
      return;
    }

    const updateTime = () => {
      const now = new Date();
      let deadline;
      const phase = getContestPhase(contest);

      // Determinar fecha límite según la fase
      if (phase === "submission") {
        deadline = new Date(contest.submission_deadline);
      } else if (phase === "voting") {
        deadline = new Date(contest.voting_deadline);
      } else {
        setTimeLeft("Reto cerrado");
        return;
      }

      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft("Tiempo agotado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [contest, getContestPhase]);

  // ✅ LOADING STATES
  if (globalLoading || contestsLoading || (!initialized && !error)) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Cargando reto...</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ups, algo salió mal
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/")}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Volver al inicio
            </button>
            <button onClick={handleRefresh} className="btn-primary">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NO CONTEST STATE
  if (!contest) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No hay retos disponibles
          </h2>
          <p className="text-gray-600 mb-6">
            Pronto habrá nuevos retos. ¡Mantente atento!
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ✅ RENDER PRINCIPAL
  return (
    <div className="max-w-6xl mx-auto space-y-6 overflow-hidden">
      {/* SEO Meta Tags */}
      <SEOHead
        title={`${currentContest?.title || "Reto Actual"} - Reto de Escritura`}
        description={
          currentContest
            ? `Participa en "${currentContest.title}" - ${currentContest.description} | Reto de escritura creativa en Letranido.`
            : "Participa en el reto actual de escritura creativa. Lee historias originales, vota por tus favoritas y únete a nuestra comunidad."
        }
        keywords={`reto escritura, ${currentContest?.category || "ficción"}, historias originales, votación, literatura, ${currentContest?.title || "reto actual"}`}
        url="/contest/current"
        type="article"
        publishedTime={currentContest?.created_at}
      />

      {/* Header del reto - Más compacto */}
      <div className="bg-gradient-to-br from-primary-100 via-white to-accent-100 dark:from-primary-900/20 dark:via-dark-800 dark:to-accent-900/20 rounded-xl p-4 md:p-6 text-center relative overflow-hidden transition-colors duration-300">
        {/* Elementos decorativos sutiles - Ocultos en mobile */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-primary-200 dark:bg-primary-700/30 rounded-full opacity-10 hidden md:block"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-accent-200 dark:bg-accent-700/30 rounded-full opacity-15 hidden md:block"></div>

        <div className="relative">
          <div className="mb-3">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Reto de {contest.month}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-3 transition-colors duration-300">
            {contest.title}
          </h1>

          <p className="text-lg text-gray-700 dark:text-dark-300 max-w-2xl mx-auto mb-4 transition-colors duration-300">
            {contest.description}
          </p>

          {/* Stats del reto - Responsive y compactas */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-4 text-sm">
            {/* Historias enviadas */}
            <div className="flex items-center justify-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex flex-col sm:block text-center sm:text-left">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 text-base sm:text-sm">
                  {storiesLoading ? "..." : contestStats.totalStories}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 sm:ml-1">
                  historia{contestStats.totalStories !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Contador en tiempo real */}
            <div className="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-purple-700 dark:text-purple-300 tabular-nums text-sm sm:text-base">
                  {timeLeft || "..."}
                </span>
                <span className="text-xs text-purple-500 dark:text-purple-400">
                  {(() => {
                    const phase = getContestPhase(contest);
                    if (phase === "submission") return "fin envíos";
                    if (phase === "voting") return "Restantes";
                    return "restante";
                  })()}
                </span>
              </div>
            </div>

            {/* Palabras escritas - Simplificado */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center bg-gradient-to-r from-pink-50 to-indigo-50 dark:from-pink-900/20 dark:to-indigo-900/20 border border-pink-200 dark:border-pink-700 px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                <PenTool className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-pink-700 dark:text-pink-300 text-base sm:text-sm">
                  {storiesLoading ? "..." : contestStats.formattedWords}
                </span>
                <span className="text-xs text-pink-600 dark:text-pink-400 ml-1">
                  palabras
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner consolidado de votación */}
      {phaseInfo?.phase === "voting" && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-3 text-white">
                ¡Votación Activa! - Cómo participar
              </h3>

              {/* Instrucciones en bullets */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Tienes 3 votos:
                    </span>
                    <span className="text-white/90 ml-1">
                      Úsalos para elegir tus historias favoritas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Votación privada:
                    </span>
                    <span className="text-white/90 ml-1">
                      Solo tú puedes ver tus votos, nadie más
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Lee antes de votar:
                    </span>
                    <span className="text-white/90 ml-1">
                      Explora varias historias para encontrar las que te
                      impacten
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Comentarios constructivos:
                    </span>
                    <span className="text-white/90 ml-1">
                      Somos una comunidad de escritores aprendiendo. Sé amable y
                      específico
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Comenta sin compromiso:
                    </span>
                    <span className="text-white/90 ml-1">
                      Puedes dejar feedback útil en cualquier historia, aunque
                      no votes por ella
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right flex-shrink-0">
              {/* Solo mensajes motivacionales sin redundancia de tiempo */}
              {votingStats.currentContestVotes === 0 && (
                <div className="bg-white/20 rounded-lg px-4 py-3">
                  <span className="text-lg font-bold text-white">
                    👋 ¡Empieza a votar!
                  </span>
                  <div className="text-green-100 text-sm mt-1">
                    Descubre historias increíbles
                  </div>
                </div>
              )}
              {votingStats.currentContestVotes > 0 &&
                votingStats.currentContestVotes < stories.length && (
                  <div className="bg-white/20 rounded-lg px-4 py-3">
                    <span className="text-lg font-bold text-white">
                      🚀 ¡Sigue leyendo!
                    </span>
                    <div className="text-green-100 text-sm mt-1">
                      {contestStats.totalStories -
                        votingStats.currentContestVotes}{" "}
                      historia
                      {contestStats.totalStories -
                        votingStats.currentContestVotes !==
                      1
                        ? "s"
                        : ""}{" "}
                      por descubrir
                    </div>
                  </div>
                )}
              {votingStats.currentContestVotes > 0 &&
                votingStats.currentContestVotes ===
                  contestStats.totalStories && (
                  <div className="bg-white/20 rounded-lg px-4 py-3">
                    <span className="text-lg font-bold text-white">
                      🎉 ¡Increíble!
                    </span>
                    <div className="text-green-100 text-sm mt-1">
                      Has leído todas las historias
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Banner informativo durante counting */}
      {phaseInfo?.phase === "counting" && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                ⏱️ Procesando Resultados
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Votación cerrada:
                    </span>
                    <span className="text-white/90 ml-1">
                      La fase de votación terminó automáticamente a las 7:00 PM
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Próximamente:
                    </span>
                    <span className="text-white/90 ml-1">
                      Los resultados oficiales se publicarán muy pronto
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-bold flex-shrink-0">•</span>
                  <div className="text-sm">
                    <span className="font-semibold text-white">
                      Mientras tanto:
                    </span>
                    <span className="text-white/90 ml-1">
                      Puedes seguir leyendo y comentando las historias
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right flex-shrink-0">
              <div className="bg-white/20 rounded-lg px-6 py-4">
                <span className="text-2xl font-bold text-white block">🏆</span>
                <div className="text-white/90 text-sm mt-1">
                  Resultados el 4 de octubre
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Unificado: Votos + Progreso de Lectura - Solo durante votación */}
      {phaseInfo?.phase === "voting" && isAuthenticated && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-blue-200 dark:border-blue-600 rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/20 to-blue-200/20 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            {/* Grid de 2 columnas en desktop, stack en móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Columna 1: Contador de Votos */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Indicadores visuales de votos */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index < votingStats.currentContestVotes
                          ? "bg-gradient-to-br from-red-500 to-pink-600 shadow-lg scale-110"
                          : "bg-gray-200 dark:bg-gray-600 opacity-50"
                      }`}
                    >
                      <Heart
                        className={`h-6 w-6 transition-all duration-300 ${
                          index < votingStats.currentContestVotes
                            ? "text-white fill-current animate-pulse"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Texto de votos */}
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-base font-bold text-gray-900 dark:text-dark-100">
                      Votos:{" "}
                      <span
                        className={`text-xl font-extrabold ${
                          votingStats.currentContestVotes >= 3
                            ? "text-red-600 dark:text-red-400"
                            : votingStats.currentContestVotes >= 2
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {votingStats.currentContestVotes}/3
                      </span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {votingStats.currentContestVotes >= 3
                      ? "✓ Todos los votos usados"
                      : `${3 - votingStats.currentContestVotes} ${3 - votingStats.currentContestVotes === 1 ? 'voto restante' : 'votos restantes'}`
                    }
                  </div>
                </div>
              </div>

              {/* Columna 2: Progreso de Lectura (solo si hay datos) */}
              {readStats.total > 0 && (
                <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-600 pt-4 lg:pt-0 lg:pl-6">
                  {/* Círculo de progreso */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - readStats.percentage / 100)}`}
                        className="text-blue-600 dark:text-blue-400 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(readStats.percentage)}%
                      </span>
                    </div>
                  </div>

                  {/* Texto de progreso */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Progreso de Lectura
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {readStats.read} de {readStats.total} historias
                      {readStats.unread > 0 && (
                        <span className="ml-1">
                          · <span className="text-orange-600 dark:text-orange-400 font-semibold">
                            {readStats.unread}
                          </span> pendientes
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN DE HISTORIAS SEGÚN LA FASE */}
      {phaseInfo && (
        <div ref={storiesSectionRef} id="stories-section" className="space-y-6">
          {/* FASE DE SUBMISSION - Mostrar participantes sin contenido */}
          {phaseInfo.phase === "submission" && (
            <div className="space-y-6">
              {/* Header compacto con CTA */}
              <div className="bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 rounded-xl p-6 text-center transition-colors duration-300">
                <div className="flex items-center justify-center mb-3">
                  <PenTool className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2 transition-colors duration-300" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100 transition-colors duration-300">
                    Fase de envío de historias
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-dark-300 mb-4 max-w-xl mx-auto transition-colors duration-300">
                  Las historias se revelarán cuando inicie la votación. ¡Aún
                  puedes participar!
                </p>

                <ContestActionButton
                  variant="primary"
                  size="default"
                  showDescription={false}
                />
              </div>

              {/* Lista de participantes - Modernizada */}
              <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 dark:border-dark-600 hover:border-purple-200 dark:hover:border-purple-500 overflow-hidden transition-all duration-300">
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-6 border-b border-indigo-200 dark:border-dark-600 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 flex items-center transition-colors duration-300">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        Escritores participando
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {storiesLoading
                          ? "Cargando..."
                          : `${contestStats.totalStories} historias enviadas`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {storiesLoading ? "..." : contestStats.totalStories}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Loading state */}
                  {storiesLoading && (
                    <div className="text-center py-8">
                      <Loader className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                      <p className="text-gray-600 dark:text-dark-300">
                        Cargando participantes...
                      </p>
                    </div>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
                      <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!storiesLoading && !error && stories.length === 0 && (
                    <div className="text-center py-8">
                      <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-dark-100 mb-2">
                        Aún no hay participantes
                      </h4>
                      <p className="text-gray-600 dark:text-dark-300 mb-4">
                        ¡Sé el primero en participar en este reto!
                      </p>
                      {phaseInfo.buttonLink && (
                        <a href={phaseInfo.buttonLink} className="btn-primary">
                          {phaseInfo.buttonText}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Grid de participantes */}
                  {!storiesLoading && !error && stories.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stories.map((story) => (
                        <div
                          key={story.id}
                          className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {/* User Card con borde premium para Ko-fi supporters */}
                                <UserCardWithBadges
                                  userId={story.user_id}
                                  userName={story.author}
                                  userEmail={`${story.author}@mock.com`}
                                  avatarSize="md"
                                  badgeSize="xs"
                                  maxBadges={1}
                                  className="flex-1 min-w-0"
                                />
                                {story.likes_count > 50 && (
                                  <span
                                    className="text-sm"
                                    title="Autor popular"
                                  >
                                    ⭐
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-dark-400">
                                <span>{story.authorWins || 0} victorias</span>
                                <span>•</span>
                                <span>{formatDate(story.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Preview mínimo SIN spoilers */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-dark-500">
                              <span className="flex items-center gap-2">
                                <span className="flex items-center">
                                  <PenTool className="h-3 w-3 mr-1" />
                                  Historia enviada
                                </span>
                                {story.is_mature && (
                                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                    18+
                                  </span>
                                )}
                              </span>
                              <span>{story.word_count || 0} palabras</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FASES DE VOTACIÓN Y RESULTADOS - Mostrar historias completas */}
          {phaseInfo.showStories && (
            <div className="space-y-6">
              {/* Banner informativo para Mención de Honor */}
              {honoraryMention &&
                sortBy === "popular" &&
                phaseInfo?.phase === "results" && (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                          🎖️ Mención de Honor Otorgada
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Una historia adicional ha recibido una{" "}
                          <strong>Mención de Honor</strong> por empatar en votos
                          con el 3º lugar. El criterio de desempate utilizado
                          fue la fecha de envío, reconociendo el mérito de ambas
                          historias.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Header de historias */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100">
                    Historias ({filteredAndSortedStories.length})
                  </h2>
                  {searchTerm && (
                    <p className="text-sm text-gray-600 dark:text-dark-300">
                      Mostrando resultados para "{searchTerm}"
                    </p>
                  )}
                  {/* Indicador de orden aleatorio durante votación */}
                  {phaseInfo?.phase === "voting" && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      🎲 Cada usuario ve las historias en orden diferente para
                      que todas tengan oportunidad de ser leídas y votadas
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                    title={
                      phaseInfo?.phase === "voting"
                        ? "Actualizar y cambiar orden aleatorio"
                        : "Actualizar"
                    }
                  >
                    <RefreshCw
                      className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </button>

                  {/* Solo mostrar filtros si NO es fase de votación */}
                  {phaseInfo?.phase !== "voting" && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtros</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          showFilters ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}

                  {/* Búsqueda compacta durante votación */}
                  {phaseInfo?.phase === "voting" && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar..."
                        className="pl-10 pr-4 py-2 w-48 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de filtros - Solo visible fuera de votación */}
              {showFilters && phaseInfo?.phase !== "voting" && (
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl p-6 space-y-4 shadow-lg transition-colors duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Búsqueda */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2 transition-colors duration-300">
                        Buscar historias
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-dark-500 transition-colors duration-300" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Título, autor o contenido..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors duration-300"
                        />
                      </div>
                    </div>

                    {/* Ordenamiento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                        Ordenar por
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="popular">Más populares</option>
                        <option value="recent">Más recientes</option>
                        {/* <option value="viewed">Más vistas</option> */}
                        <option value="alphabetical">
                          Alfabético (título)
                        </option>
                        <option value="author">Por autor</option>
                        <option value="random">Aleatorio</option>
                      </select>

                      {/* Indicador visual para fase de resultados */}
                      {phaseInfo?.phase === "results" &&
                        sortBy === "popular" && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2">
                            <Trophy className="h-3 w-3" />
                            <span>
                              Mostrando del ganador al que menos votos obtuvo
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Controles adicionales */}
                  <div className="flex justify-between items-center">
                    {/* Re-randomizar - solo mostrar cuando esté en modo aleatorio */}
                    {sortBy === "random" && (
                      <button
                        onClick={reshuffleStories}
                        className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        title="Cambiar el orden aleatorio de las historias"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Re-randomizar
                      </button>
                    )}

                    {/* Limpiar filtros */}
                    {(searchTerm || sortBy !== "popular") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSortBy("popular");
                        }}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Loading de historias */}
              {storiesLoading && (
                <div className="text-center py-12">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
                  <p className="text-gray-600 dark:text-dark-300">
                    Cargando historias...
                  </p>
                </div>
              )}

              {/* Lista de historias */}
              {!storiesLoading && (
                <>
                  {filteredAndSortedStories.length === 0 ? (
                    <div className="text-center py-12">
                      <PenTool className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                        {searchTerm
                          ? "No se encontraron historias"
                          : "Aún no hay historias"}
                      </h3>
                      <p className="text-gray-600 dark:text-dark-300 mb-6">
                        {searchTerm
                          ? "Intenta con otros términos de búsqueda"
                          : phaseInfo?.phase === "voting"
                            ? "Los participantes están escribiendo sus historias"
                            : "Pronto habrá nuevas historias aquí"}
                      </p>
                      {phaseInfo?.buttonLink && !searchTerm && (
                        <a href={phaseInfo.buttonLink} className="btn-primary">
                          {phaseInfo.buttonText}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {filteredAndSortedStories.map((story, index) => {
                        // Verificar si el usuario ya votó por esta historia
                        const hasVoted =
                          story.isLiked ||
                          (isAuthenticated &&
                            votingStats.userVotedStories?.some(
                              (vote) => vote.storyId === story.id
                            ));

                        // Verificar si el usuario ya leyó esta historia
                        const hasRead = isStoryRead(story.id);

                        // Handler para marcar/desmarcar como leída
                        const handleToggleRead = async (e) => {
                          e.stopPropagation(); // Prevenir navegación
                          if (!isAuthenticated) {
                            openAuthModal("login");
                            return;
                          }
                          await toggleRead(story.id);
                        };

                        return (
                          <div
                            key={story.id}
                            className={`backdrop-blur-sm border rounded-2xl p-4 md:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden relative ${
                              hasVoted
                                ? "bg-gray-50/80 border-gray-300 opacity-75 hover:opacity-90 dark:bg-dark-700/80 dark:border-dark-500 hover:dark:border-purple-400"
                                : hasRead && phaseInfo?.phase === 'voting'
                                  ? "bg-blue-50/40 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                                  : "bg-white/95 border-indigo-100 hover:border-purple-200 dark:bg-dark-800/95 dark:border-dark-600 hover:dark:border-purple-500"
                            }`}
                            onClick={() => navigate(`/story/${story.id}`)}
                          >
                            {/* Header responsive */}
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                {/* Posición si es resultados - incluye mención de honor */}
                                {sortBy === "popular" &&
                                  phaseInfo?.phase === "results" && (
                                    <div className="flex items-center mb-2">
                                      {index === 0 && (
                                        <div className="flex items-center text-yellow-600 text-sm">
                                          <Crown className="h-4 w-4 mr-1" />
                                          <span className="font-bold">1º</span>
                                        </div>
                                      )}
                                      {index === 1 && (
                                        <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                                          <Medal className="h-4 w-4 mr-1" />
                                          <span className="font-bold">2º</span>
                                        </div>
                                      )}
                                      {index === 2 && (
                                        <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                                          <Award className="h-4 w-4 mr-1" />
                                          <span className="font-bold">3º</span>
                                        </div>
                                      )}
                                      {/* Mención de Honor - 4º lugar con empate */}
                                      {honoraryMention &&
                                        story.id === honoraryMention.id && (
                                          <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                                            <Award className="h-4 w-4 mr-1" />
                                            <span className="font-bold">
                                              🎖️ Mención de Honor
                                            </span>
                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                              (= 3º lugar)
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  )}

                                {/* Badge central - Votada Y/O Leída */}
                                {(hasVoted || (hasRead && phaseInfo?.phase === 'voting')) && (
                                  <div
                                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium shadow-md backdrop-blur-sm transition-all ${
                                      hasVoted
                                        ? 'bg-gray-400/90 text-white'
                                        : 'bg-blue-500/90 text-white hover:bg-blue-600/90 cursor-pointer'
                                    }`}
                                    onClick={hasVoted ? undefined : handleToggleRead}
                                    title={hasVoted ? undefined : 'Click para desmarcar como leída'}
                                  >
                                    {hasVoted && <Heart className="h-4 w-4 fill-current" />}
                                    {!hasVoted && hasRead && <BookCheck className="h-4 w-4" />}
                                    <span>
                                      {hasVoted && hasRead ? 'Votada • Leída' : hasVoted ? 'Tu voto' : 'Leída'}
                                    </span>
                                  </div>
                                )}

                                <h3
                                  className={`text-base md:text-lg font-semibold cursor-pointer line-clamp-2 mb-2 ${
                                    hasVoted
                                      ? "text-gray-500 dark:text-dark-400"
                                      : "text-gray-900 dark:text-dark-300 dark:hover:text-primary-400 hover:text-primary-600"
                                  }`}
                                >
                                  <a href={`/story/${story.id}`}>
                                    {story.title}
                                  </a>
                                </h3>

                                <div
                                  className={`flex flex-wrap items-center gap-1 md:gap-2 text-xs ${
                                    hasVoted
                                      ? "text-gray-400 dark:text-dark-300"
                                      : "text-gray-500 dark:text-dark-400"
                                  }`}
                                >
                                  <UserCardWithBadges
                                    userId={story.user_id}
                                    userName={story.author}
                                    userEmail={`${story.author}@mock.com`}
                                    avatarSize="xs"
                                    badgeSize="xs"
                                    maxBadges={1}
                                    className="flex-shrink-0"
                                  />
                                  <span className="hidden sm:inline">•</span>
                                  <span className="whitespace-nowrap ">
                                    {getReadingTime(story.word_count)}
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="whitespace-nowrap">
                                    {story.word_count}p
                                  </span>
                                  {story.is_mature && (
                                    <>
                                      <span className="hidden sm:inline">
                                        •
                                      </span>
                                      <span
                                        className={`font-medium whitespace-nowrap ${
                                          hasVoted
                                            ? "text-gray-400"
                                            : "text-red-600"
                                        }`}
                                      >
                                        18+
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Botones de acción - Limpio y simple */}
                              <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                                <a
                                  href={`/story/${story.id}`}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-sm whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Leer
                                </a>

                                {getStoryShareData(story) && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <SocialShareDropdown
                                      shareData={getStoryShareData(story)}
                                      size="small"
                                      variant="story"
                                      direction="left"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Excerpt más corto - Con overflow controlado */}
                            <div
                              className={`text-sm mb-3 line-clamp-2 leading-relaxed break-words overflow-hidden ${
                                hasVoted
                                  ? "text-gray-400"
                                  : "text-gray-600 dark:text-dark-300"
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: story.excerpt,
                              }}
                            />

                            {/* Actions compactas - Layout móvil */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                {/* Ocultar votos y vistas durante votación y counting para evitar sesgo */}
                                {phaseInfo?.phase === "results" && (
                                  <>
                                    {/* Likes display compacto */}
                                    <div
                                      className={`flex items-center gap-1 text-sm min-w-0 ${
                                        hasVoted
                                          ? "text-gray-400 dark:text-dark-300"
                                          : "text-red-600 dark:text-red-400"
                                      }`}
                                    >
                                      <Heart className="h-3 w-3 fill-current flex-shrink-0" />
                                      <span className="font-medium truncate">
                                        {story.likes_count || 0}
                                      </span>
                                    </div>

                                    {/* Views compacto - OCULTO */}
                                    {/* <div
                                      className={`flex items-center gap-1 text-sm min-w-0 ${
                                        hasVoted
                                          ? "text-gray-400 dark:text-dark-300"
                                          : "text-gray-500 dark:text-dark-400"
                                      }`}
                                    >
                                      <Eye className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {story.views_count || 0}
                                      </span>
                                    </div> */}
                                  </>
                                )}

                                {/* Durante votación, mostrar mensaje de votación justa */}
                                {phaseInfo?.phase === "voting" && (
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <span className="text-xs">
                                      🗳️ Votos privados - vota sin presión
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Info de votación - responsive */}
                              <div className="flex items-center justify-start sm:justify-end">
                                {phaseInfo?.isHistorical ? (
                                  <span className="text-xs flex  items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
                                    <BookOpen className="h-3 w-3 mr-1" /> Solo
                                    lectura
                                  </span>
                                ) : (
                                  <>
                                    {!isAuthenticated && (
                                      <span className="text-xs text-blue-600 break-words">
                                        Lee la historia para votar
                                      </span>
                                    )}

                                    {isAuthenticated &&
                                      story.user_id === user?.id && (
                                        <span className="text-xs text-purple-600 whitespace-nowrap">
                                          Tu historia
                                        </span>
                                      )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}

      {showRulesModal && (
        <ContestRulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          contest={{
            ...contest,
            endDate: new Date(contest.submission_deadline || contest.end_date),
          }}
        />
      )}

      {/* Celebración de ganadores */}
      {celebration.show && (
        <WinnerCelebration
          position={celebration.position}
          isVisible={celebration.show}
          onClose={closeCelebration}
          userName={user?.name || user?.display_name}
          storyTitle={celebration.storyTitle}
        />
      )}
    </div>
  );
};

export default CurrentContest;
