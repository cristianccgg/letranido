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
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { useGlobalToast } from "../contexts/ToastContext";
import SEOHead from "../components/SEO/SEOHead";
import AuthModal from "../components/forms/AuthModal";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import ContestActionButton from "../components/ui/ContestActionButton";
import UserAvatar from "../components/ui/UserAvatar";
import { UserWithTopBadge } from "../components/ui/UserNameWithBadges";
import ShareDropdown from "../components/ui/ShareDropdown";
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
    userStories,
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

  // Refs para scroll
  const storiesSectionRef = useRef(null);

  // Hook para celebraciones de ganadores
  const { celebration, closeCelebration } = useWinnerCelebration();

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
    if (location.state?.showSuccessToast && location.state?.storyTitle && !toastShown) {
      // Delay pequeño para que la página se cargue
      const timer = setTimeout(() => {
        showSuccessToast(
          "¡Historia Enviada!",
          "Guardada exitosamente en el concurso",
          location.state.storyTitle,
          { duration: 9000 }
        );
        
        // Marcar como mostrado para evitar loops
        setToastShown(true);
        
        // Limpiar el state para evitar que se muestre de nuevo
        window.history.replaceState({}, document.title, location.pathname);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.state?.showSuccessToast, location.state?.storyTitle, toastShown, showSuccessToast, location.pathname]);

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

  // ✅ FUNCIÓN PARA RANDOMIZAR CON ORDEN CONSISTENTE
  const getRandomizedStories = useCallback((stories, contestId, searchTerm) => {
    if (!stories || !contestId) return [];

    // Crear clave única que incluya término de búsqueda para mantener consistencia
    const storageKey = `contest_${contestId}_random_order_${searchTerm || "all"}`;

    try {
      // Intentar obtener orden guardado
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
      }

      // Si no hay orden guardado o está desactualizado, crear nuevo orden
      const shuffled = [...stories].sort(() => Math.random() - 0.5);
      const orderIds = shuffled.map((story) => story.id);

      // Guardar el nuevo orden
      localStorage.setItem(storageKey, JSON.stringify(orderIds));

      return shuffled;
    } catch (error) {
      console.error("Error handling random order:", error);
      // Fallback a orden aleatorio simple sin persistencia
      return [...stories].sort(() => Math.random() - 0.5);
    }
  }, []);

  // ✅ FUNCIÓN PARA RESETEAR EL ORDEN ALEATORIO
  const reshuffleStories = useCallback(() => {
    if (!contest?.id) return;

    // Eliminar órdenes guardados para este reto
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(`contest_${contest.id}_random_order_`)) {
        localStorage.removeItem(key);
      }
    });

    // Forzar re-render si está en modo random
    if (sortBy === "random") {
      // Trigger a re-render by updating a dependency
      setSortBy("random");
    }
  }, [contest?.id, sortBy]);

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
        return filtered.sort(
          (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
        );
      case "viewed":
        return filtered.sort(
          (a, b) => (b.views_count || 0) - (a.views_count || 0)
        );
      case "alphabetical":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "author":
        return filtered.sort((a, b) => a.author.localeCompare(b.author));
      case "random":
        return getRandomizedStories(filtered, contest?.id, searchTerm);
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
    contest?.id,
    storiesLoading,
    getRandomizedStories,
  ]);

  // ✅ FUNCIONES DE COMPARTIR
  // Generar datos para compartir
  const getShareData = () => {
    if (!contest) return null;

    // Verificar si el usuario participó en este reto
    const userParticipated = userStories.some(
      (userStory) => userStory.contest_id === contest.id
    );

    // URL del reto (no de la historia específica)
    const contestUrl = `${window.location.origin}/contest/${contest.id}`;

    // Generar texto según si el usuario participó o no
    return userParticipated
      ? {
          title: `Letranido - ${contest.title}`,
          text: `¡Participé con mi historia en el reto "${contest.title}" en Letranido! ✍️\n📚 Únete como escritor y comparte tu historia\n🚀 Participa en:`,
          url: contestUrl,
        }
      : {
          title: `Letranido - ${contest.title}`,
          text: `📝 ¡Descubre historias increíbles en Letranido!\n🎯 Reto activo: "${contest.title}"\n✍️ Únete como escritor:`,
          url: contestUrl,
        };
  };

  // ✅ FUNCIONES DE UTILIDAD
  const getPhaseInfo = useCallback(() => {
    if (!contest) return null;

    const phase = getContestPhase(contest);
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
          title: "🔢 Contando Votos",
          description:
            "La votación ha cerrado. Estamos contando los votos y los resultados estarán listos pronto.",
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
  }, [contest, currentContest?.id, nextContest?.id, getContestPhase]);

  const phaseInfo = useMemo(() => getPhaseInfo(), [getPhaseInfo]);

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

          {/* Stats del reto - Dinámicas */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm">
            {/* Historias enviadas */}
            <div className="flex items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="truncate font-semibold text-indigo-700 dark:text-indigo-300 transition-colors duration-300">
                {storiesLoading ? "..." : contestStats.totalStories} historia
                {contestStats.totalStories !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Contador en tiempo real */}
            <div className="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="truncate font-semibold text-purple-700 dark:text-purple-300 tabular-nums transition-colors duration-300">
                  {timeLeft || "Cargando..."}
                </span>
                <span className="text-xs text-purple-500 dark:text-purple-400 transition-colors duration-300">
                  {(() => {
                    const phase = getContestPhase(contest);
                    if (phase === "submission") return "para enviar";
                    if (phase === "voting") return "para cerrar votación";
                    return "restante";
                  })()}
                </span>
              </div>
            </div>

            {/* Palabras escritas */}
            <div className="flex items-center bg-gradient-to-r from-pink-50 to-indigo-50 dark:from-pink-900/20 dark:to-indigo-900/20 border border-pink-200 dark:border-pink-700 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                <PenTool className="h-4 w-4 text-white" />
              </div>
              <span className="truncate font-semibold text-pink-700 dark:text-pink-300 text-xs transition-colors duration-300">
                {storiesLoading ? "..." : contestStats.formattedWords} palabras{" "}
                <br /> escritas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner consolidado de votación */}
      {phaseInfo?.phase === "voting" && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  🗳️ ¡Votación Activa!
                </h3>
                <p className="text-green-100 text-sm mb-3">
                  Tienes 3 votos para elegir tus historias favoritas. 
                  <strong className="text-white"> 💡 Consejo:</strong> Lee varias historias antes de votar para encontrar las que realmente te impacten.
                </p>
                <div className="bg-white/15 rounded-lg p-3 mb-3 border border-white/20">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">💬</span>
                    <div className="text-sm">
                      <span className="font-medium text-white">
                        ¡Deja comentarios constructivos!
                      </span>
                      <p className="text-green-100 mt-1">
                        Tu feedback ayuda a los escritores a crecer. Comparte
                        qué te gustó, qué te emocionó o qué te hizo reflexionar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats integradas */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">
                      Has usado{" "}
                      <strong>{votingStats.currentContestVotes}/3</strong>{" "}
                      votos disponibles
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      <strong>{contestStats.totalStories}</strong> historias
                      disponibles
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
                                {/* Avatar */}
                                <UserAvatar
                                  user={{
                                    name: story.author,
                                    email: `${story.author}@mock.com`,
                                  }}
                                  size="md"
                                />
                                <UserWithTopBadge
                                  userId={story.user_id}
                                  userName={story.author}
                                  className="truncate"
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
                      🎲 Cada usuario ve las historias en orden diferente para que todas tengan oportunidad de ser leídas y votadas
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
                        <option value="viewed">Más vistas</option>
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

                        return (
                          <div
                            key={story.id}
                            className={`backdrop-blur-sm border rounded-2xl p-4 md:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden relative ${
                              hasVoted
                                ? "bg-gray-50/80 border-gray-300 opacity-75 hover:opacity-90 dark:bg-dark-700/80 dark:border-dark-500 hover:dark:border-purple-400"
                                : "bg-white/95 border-indigo-100 hover:border-purple-200 dark:bg-dark-800/95 dark:border-dark-600 hover:dark:border-purple-500"
                            }`}
                            onClick={() => navigate(`/story/${story.id}`)}
                          >
                            {/* Header responsive */}
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                {/* Posición si es resultados - más compacta */}
                                {sortBy === "popular" &&
                                  phaseInfo?.phase === "results" &&
                                  index < 3 && (
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
                                    </div>
                                  )}

                                {/* Badge sutil para historias votadas - centrado */}
                                {hasVoted && (
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1 bg-gray-400/90 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md backdrop-blur-sm">
                                    <Heart className="h-4 w-4 fill-current" />
                                    <span>Tu voto</span>
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
                                  <UserAvatar
                                    user={{
                                      name: story.author,
                                      email: `${story.author}@mock.com`,
                                    }}
                                    size="xs"
                                  />
                                  <span className="truncate max-w-32 md:max-w-none">
                                    <UserWithTopBadge
                                      userId={story.user_id}
                                      userName={story.author}
                                      className="inline-flex"
                                    />
                                  </span>
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

                              {/* Botones de acción - Stack en móvil */}
                              <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                                <a
                                  href={`/story/${story.id}`}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-sm whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Leer
                                </a>
                                {getShareData() && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <ShareDropdown
                                      shareData={getShareData()}
                                      size="small"
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
                                {/* Ocultar votos y vistas durante votación para evitar sesgo */}
                                {phaseInfo?.phase !== "voting" && (
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

                                    {/* Views compacto */}
                                    <div
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
                                    </div>
                                  </>
                                )}

                                {/* Durante votación, mostrar mensaje de votación justa */}
                                {phaseInfo?.phase === "voting" && (
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <span className="text-xs">
                                      🗳️ Votación ciega - vota por la historia
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
