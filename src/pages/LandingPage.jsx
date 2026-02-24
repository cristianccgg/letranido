// pages/LandingPage.jsx - Landing con feed integrado para usuarios autenticados
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  TrendingUp,
  Heart,
  BookOpen,
  Loader,
  Shield,
  Copyright,
  Lock,
  Eye,
  HelpCircle,
  Zap,
  MessageCircle,
  Vote,
  Crown,
  Rss,
  Send,
  Archive,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import SEOHead from "../components/SEO/SEOHead";
import ContestActionButton from "../components/ui/ContestActionButton";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import UserAvatar from "../components/ui/UserAvatar";
import UserCardWithBadges from "../components/ui/UserCardWithBadges";
import KarmaRankingsSidebar from "../components/ui/KarmaRankingsSidebar";
import NextContestOrPoll from "../components/ui/NextContestOrPoll";
import ContestCard from "../components/ui/ContestCard";
import NewsletterSignup from "../components/ui/NewsletterSignup";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import { useBadgesCache } from "../hooks/useBadgesCache";
import Badge from "../components/ui/Badge";
import WelcomeBanner from "../components/ui/WelcomeBanner";
import FeatureAnnouncementModal from "../components/modals/FeatureAnnouncementModal";
import { FEATURES } from "../lib/config";
import logo from "../assets/images/letranido-logo.png";
// Feed components
import useFeedPrompts from "../hooks/useFeedPrompts";
import useMicroStories from "../hooks/useMicroStories";
import MicroStoryCard from "../components/feed/MicroStoryCard";
import ArchivedPromptsView from "../components/feed/ArchivedPromptsView";
import { supabase } from "../lib/supabase";

// Componente para mostrar el badge del ganador
const WinnerBadgeDisplay = ({ userId }) => {
  const { userBadges, loading } = useBadgesCache(userId);

  if (loading) {
    return <span className="text-yellow-600">🏆</span>;
  }

  // Orden de prestigio para badges (mayor a menor)
  const prestigeOrder = {
    contest_winner_veteran: 5, // Ganador múltiple
    contest_winner: 4, // Ganador
    contest_finalist: 3, // Finalista
    writer_15: 2, // Veterano escritor
    writer_5: 1, // Escritor constante
    first_story: 0, // Primera historia
  };

  // Encontrar el badge de mayor prestigio
  const topBadge = userBadges
    .filter((badge) =>
      Object.prototype.hasOwnProperty.call(prestigeOrder, badge.id),
    )
    .sort((a, b) => (prestigeOrder[b.id] || 0) - (prestigeOrder[a.id] || 0))[0];

  if (topBadge) {
    return (
      <div>
        <Badge badge={topBadge} size="xs" showDescription={false} />
      </div>
    );
  }

  // Fallback al trofeo si no hay badge
  return <span className="text-yellow-600">🏆</span>;
};

const LandingPage = () => {
  const {
    // Contest state
    currentContest,
    nextContest,
    currentContestPhase,
    contestsLoading,
    contests,
    getStoriesByContest,
    // App state
    initialized,
    user,
    globalLoading,
    // Global stats
    globalStats,
    globalStatsLoading,
    loadGlobalStats,
    // Auth modal
    openAuthModal,
  } = useGlobalApp();

  // 🆕 FEED STATE - Solo para usuarios autenticados
  const {
    activePrompt,
    nextPrompt,
    loading: promptsLoading,
  } = useFeedPrompts("active");
  const {
    stories,
    loading: storiesLoading,
    refreshStories,
    updateStoryLikeCount,
    deleteStory,
    userHasPublished,
  } = useMicroStories(activePrompt?.id);

  // Estado del formulario de feed
  const [feedTitle, setFeedTitle] = useState("");
  const [feedContent, setFeedContent] = useState("");
  const [feedWordCount, setFeedWordCount] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [feedSuccess, setFeedSuccess] = useState(null);

  // Estado de likes (optimistic UI)
  const [userLikes, setUserLikes] = useState({});

  // Tab para ver archivo
  const [showArchive, setShowArchive] = useState(false);

  // Tab principal: Reto Mensual vs Microhistorias
  const [activeTab, setActiveTab] = useState("mensual");

  // Countdown para el prompt del feed
  const [feedTimeLeft, setFeedTimeLeft] = useState("");

  // Expandir/colapsar próximo prompt semanal
  const [nextPromptExpanded, setNextPromptExpanded] = useState(false);

  // ✅ ESTADÍSTICAS DESDE CONTEXTO GLOBAL - Con fallbacks locales
  const historicalStats = {
    totalUsers: globalStats.totalUsers ?? 34,
    totalStories: globalStats.totalStories ?? 13,
    totalWords: globalStats.totalWords ?? 7800,
  };

  // ✅ Cargar estadísticas si no están disponibles (solo si es necesario)
  useEffect(() => {
    // Si no tenemos stats y no estamos cargando, intentar cargar
    if (!globalStats.lastUpdated && !globalStatsLoading && initialized) {
      console.log("📊 Stats no disponibles, cargando desde contexto...");
      loadGlobalStats().catch((error) => {
        console.error("❌ Error cargando stats desde contexto:", error);
      });
    }
  }, [
    globalStats.lastUpdated,
    globalStatsLoading,
    initialized,
    loadGlobalStats,
  ]);

  // 🆕 ESTADO PARA GANADORES DEL RETO ANTERIOR
  const [lastContestWinners, setLastContestWinners] = useState(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // 🆕 ESTADO PARA FEATURE ANNOUNCEMENT MODAL
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  // 🆕 Mostrar modal de anuncio de features automáticamente a usuarios logueados
  useEffect(() => {
    if (user && initialized) {
      // Pequeño delay para que el usuario vea la página primero
      const timer = setTimeout(() => {
        setShowFeatureModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, initialized]);

  // 🆕 FEED: Countdown del prompt activo
  useEffect(() => {
    if (!activePrompt?.end_date) {
      setFeedTimeLeft("");
      return;
    }

    const updateFeedTime = () => {
      const now = new Date();
      const deadline = new Date(activePrompt.end_date);
      const diff = deadline - now;

      if (diff <= 0) {
        setFeedTimeLeft("Prompt cerrado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setFeedTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setFeedTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    updateFeedTime();
    const interval = setInterval(updateFeedTime, 60000);
    return () => clearInterval(interval);
  }, [activePrompt?.end_date]);

  // 🆕 FEED: Calcular word count
  useEffect(() => {
    const words = feedContent
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setFeedWordCount(words.length);
  }, [feedContent]);

  // 🆕 FEED: Cargar likes del usuario
  // Usar story IDs como dependencia estable para no re-ejecutar al cambiar likes_count
  const storyIds = stories.map((s) => s.id).join(",");
  useEffect(() => {
    const loadUserLikes = async () => {
      if (!user || !storyIds) return;

      const ids = storyIds.split(",");
      const { data } = await supabase.rpc("get_user_feed_story_likes_batch", {
        p_user_id: user.id,
        p_story_ids: ids,
      });

      if (data) {
        const likesMap = {};
        data.forEach((item) => {
          likesMap[item.story_id] = true;
        });
        setUserLikes(likesMap);
      }
    };

    loadUserLikes();
  }, [user, storyIds]);

  // ✅ Las estadísticas ahora se calculan automáticamente desde statsFromContext
  // No necesitamos useEffect ni queries a Supabase

  // 🆕 CARGAR GANADORES DEL ÚLTIMO RETO FINALIZADO
  useEffect(() => {
    const loadLastContestWinners = async () => {
      if (!initialized || contests.length === 0) return;

      setLoadingWinners(true);
      try {
        // Encontrar el último reto finalizado (excluyendo el actual)
        const finishedContests = contests
          .filter(
            (contest) =>
              contest.status === "results" && contest.id !== currentContest?.id,
          )
          .sort(
            (a, b) =>
              new Date(b.finalized_at || b.voting_deadline) -
              new Date(a.finalized_at || a.voting_deadline),
          );

        if (finishedContests.length === 0) {
          setLastContestWinners(null);
          return;
        }

        const lastContest = finishedContests[0];
        const result = await getStoriesByContest(lastContest.id);

        if (result.success && result.stories.length > 0) {
          // Ordenar por likes y obtener top 3
          const sortedStories = result.stories.sort((a, b) => {
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

          const winners = sortedStories.slice(0, 3);

          setLastContestWinners({
            contest: lastContest,
            winners: winners,
          });
        } else {
          setLastContestWinners(null);
        }
      } catch (error) {
        console.error("Error cargando ganadores del último reto:", error);
        setLastContestWinners(null);
      } finally {
        setLoadingWinners(false);
      }
    };

    loadLastContestWinners();
  }, [initialized, contests, currentContest, getStoriesByContest]);

  // Estado para forzar re-render cuando cambia la fase automáticamente
  const [phaseCheckTimestamp, setPhaseCheckTimestamp] = useState(Date.now());

  // Contador de tiempo restante (dinámico según la fase del reto)
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!currentContest) {
      setTimeLeft("");
      return;
    }

    const updateTime = () => {
      const now = new Date();
      let deadline;

      // Usar la fecha correcta según la fase del reto)
      if (currentContestPhase === "submission") {
        deadline = new Date(currentContest.submission_deadline);
      } else if (currentContestPhase === "voting") {
        deadline = new Date(currentContest.voting_deadline);
      } else {
        setTimeLeft("Reto cerrado");
        return;
      }

      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft("Reto cerrado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`,
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentContest, currentContestPhase]);

  // ✅ DETECCIÓN AUTOMÁTICA DE CAMBIO DE FASE
  // Programa un timeout para el momento exacto del deadline para forzar actualización
  useEffect(() => {
    if (!currentContest) return;

    const now = new Date();
    let deadline;

    // Determinar el próximo deadline según la fase actual
    if (currentContestPhase === "submission") {
      deadline = new Date(currentContest.submission_deadline);
    } else if (currentContestPhase === "voting") {
      deadline = new Date(currentContest.voting_deadline);
    } else {
      // Ya está en counting o results, no hay más deadlines automáticos
      return;
    }

    const timeUntilDeadline = deadline - now;

    // Si el deadline ya pasó, forzar actualización inmediata
    if (timeUntilDeadline <= 0) {
      console.log("🔄 Deadline alcanzado, forzando actualización de fase");
      setPhaseCheckTimestamp(Date.now());
      return;
    }

    // Programar timeout para el deadline + 2 segundos de buffer
    console.log(
      `⏰ Próximo cambio de fase programado en ${Math.round(timeUntilDeadline / 1000)} segundos`,
    );
    const timeout = setTimeout(() => {
      console.log("🔄 Deadline alcanzado, actualizando fase automáticamente");
      setPhaseCheckTimestamp(Date.now());
      // Forzar refresh del contexto global para actualizar la fase
      window.location.reload();
    }, timeUntilDeadline + 2000); // +2s de buffer

    return () => clearTimeout(timeout);
  }, [currentContest, currentContestPhase]);

  // 🆕 FEED: Handlers
  const handlePublishFeed = async (e) => {
    e.preventDefault();

    if (!user) {
      setFeedError("Debes iniciar sesión para publicar");
      return;
    }

    if (!feedTitle.trim()) {
      setFeedError("El título es obligatorio");
      return;
    }

    if (feedWordCount < 50 || feedWordCount > 300) {
      setFeedError("La microhistoria debe tener entre 50 y 300 palabras");
      return;
    }

    try {
      setPublishing(true);
      setFeedError(null);

      const { error: insertError } = await supabase
        .from("feed_stories")
        .insert([
          {
            prompt_id: activePrompt.id,
            user_id: user.id,
            title: feedTitle.trim(),
            content: feedContent.trim(),
            word_count: feedWordCount,
          },
        ]);

      if (insertError) throw insertError;

      setFeedSuccess("¡Microhistoria publicada!");
      setFeedTitle("");
      setFeedContent("");
      setFeedWordCount(0);

      refreshStories();

      setTimeout(() => setFeedSuccess(null), 3000);
    } catch (err) {
      console.error("Error publishing feed story:", err);
      setFeedError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleLikeFeed = async (storyId) => {
    if (!user) return;

    const currentlyLiked = userLikes[storyId] || false;
    const likeChange = currentlyLiked ? -1 : 1;

    setUserLikes((prev) => ({ ...prev, [storyId]: !currentlyLiked }));
    updateStoryLikeCount(storyId, likeChange);

    try {
      await supabase.rpc("toggle_feed_story_like", {
        p_user_id: user.id,
        p_story_id: storyId,
      });
    } catch (err) {
      setUserLikes((prev) => ({ ...prev, [storyId]: currentlyLiked }));
      updateStoryLikeCount(storyId, -likeChange);
      console.error("Error toggling like:", err);
    }
  };

  const handleDeleteFeed = async (storyId) => {
    if (!user) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta historia?"))
      return;

    const result = await deleteStory(storyId, user.id);
    if (!result.success) {
      setFeedError("Error al eliminar la historia");
    }
  };

  const handleReportFeed = async (storyId) => {
    if (!user) return;
    try {
      const { error: reportError } = await supabase.from("reports").insert([
        {
          reporter_id: user.id,
          reported_item_type: "feed_story",
          reported_item_id: storyId,
          reason: "Reportado por usuario",
        },
      ]);

      if (reportError) throw reportError;
      alert("Historia reportada. Gracias por ayudar a mantener la comunidad.");
    } catch (err) {
      console.error("Error reporting feed story:", err);
      setFeedError("Error al reportar la historia");
    }
  };

  // Estado para mostrar el modal de reglas
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesModalContest, setRulesModalContest] = useState(null);
  const [nextContestExpanded, setNextContestExpanded] = useState(false);

  // Estado para el sidebar de rankings
  const [showRankingsSidebar, setShowRankingsSidebar] = useState(false);

  // ✅ Contador para el siguiente reto
  const [nextTimeLeft, setNextTimeLeft] = useState("");
  useEffect(() => {
    if (
      !nextContest?.submission_deadline ||
      (currentContestPhase !== "voting" && currentContestPhase !== "counting")
    ) {
      setNextTimeLeft("");
      return;
    }

    const updateNextTime = () => {
      const now = new Date();
      const deadline = new Date(nextContest.submission_deadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setNextTimeLeft("Reto cerrado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setNextTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setNextTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setNextTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setNextTimeLeft(`${seconds}s`);
      }
    };

    updateNextTime();
    const interval = setInterval(updateNextTime, 1000);
    return () => clearInterval(interval);
  }, [nextContest?.submission_deadline, currentContestPhase]);

  // ✅ LOADING STATE
  if (globalLoading || contestsLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Cargando Letranido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Inicio"
        description="Únete a Letranido, la comunidad de escritores creativos. Participa en retos mensuales, comparte tus historias originales y conecta con otros escritores apasionados."
        keywords="escritura creativa, retos de escritura, comunidad escritores, historias originales, ficción, narrativa, letranido, literatura"
        url="/"
      />

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Hero Section - Elegante y moderno */}
      <section className="bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 relative overflow-hidden transition-colors duration-300">
        {/* Elementos decorativos modernos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-linear-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl"></div>
          <div className="absolute top-32 right-16 w-24 h-24 bg-linear-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-linear-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
          <div className="absolute bottom-32 right-10 w-40 h-40 bg-linear-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-12 md:py-8 lg:py-8 text-center">
          {/* Logo/Título con tagline */}
          <div className="mb-0 flex flex-col items-center">
            <div className="flex items-center mb-0">
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-primary-600 font-dm-serif tracking-tight">
                Letranido
              </h1>
              <img
                src={logo}
                alt="Logo de Letranido - Pluma en nido, símbolo de escritura creativa"
                className="h-15 md:h-25 w-auto transition-all duration-300 hover:scale-110 hover:rotate-3 hover:drop-shadow-lg cursor-pointer"
              />
            </div>

            {/* HERO PRINCIPAL - Claro y motivacional */}
            <div className="mb-8">
              {/* Tagline emocional */}
              <p className="font-dancing-script text-xl md:text-2xl lg:text-3xl text-gray-800 dark:text-dark-200 mb-4 font-semibold transition-colors duration-300">
                <span className="text-indigo-600 dark:text-indigo-400">
                  Escribe
                </span>
                .
                <span className="text-purple-600 dark:text-purple-400">
                  {" "}
                  Recibe feedback
                </span>
                .
                <span className="text-indigo-600 dark:text-indigo-400">
                  {" "}
                  Crece como escritor
                </span>
                .
              </p>

              {/* Explicación clara del concepto */}
              <p className="text-lg md:text-2xl text-gray-700 dark:text-dark-300 mb-4 max-w-3xl leading-relaxed transition-colors duration-300">
                Cada mes un{" "}
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold transition-colors duration-300">
                  prompt diferente
                </span>{" "}
                que puedes interpretar como quieras: síguelo exactamente,
                adáptalo o úsalo como inspiración
              </p>

              <p className="text-base md:text-lg text-gray-600 dark:text-dark-400 mb-6 max-w-2xl mx-auto italic transition-colors duration-300">
                ✨ Recuerda: escribimos para crecer, mejorar y disfrutar, no
                solo para ganar. Cada historia es un paso en tu viaje literario.
              </p>
            </div>

            {/* 🆕 CTAs PRINCIPALES ESTILO WATTPAD - Solo visible en desarrollo */}
            {FEATURES.PORTFOLIO_STORIES && (
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-lg mx-auto">
                  {/* Leer Historias */}
                  <Link
                    to="/stories"
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-2xl hover:bg-purple-700 hover:shadow-xl transition-all duration-300 shadow-lg whitespace-nowrap"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span>Leer Historias</span>
                  </Link>

                  {/* Escribir Historia */}
                  <Link
                    to="/contest/current"
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-white font-bold text-lg rounded-2xl hover:bg-amber-600 hover:shadow-xl transition-all duration-300 shadow-lg whitespace-nowrap"
                  >
                    <PenTool className="h-6 w-6" />
                    <span>Escribir Historia</span>
                  </Link>
                </div>

                {/* Subtextos explicativos */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center max-w-2xl mx-auto">
                  <div className="text-sm text-gray-600 dark:text-dark-400">
                    <span className="font-medium text-purple-700 dark:text-purple-400">
                      ✨ Descubre
                    </span>{" "}
                    creatividad premium sin límites
                  </div>
                  <div className="text-sm text-gray-600 dark:text-dark-400">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      🏆 Participa
                    </span>{" "}
                    en el reto mensual
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Beneficios y ganador - diseño original */}
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] md:text-base">
              <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-indigo-100 dark:border-dark-600 transition-colors duration-300 min-h-[60px] md:min-h-auto">
                <span className="font-medium text-gray-900 dark:text-dark-100 transition-colors duration-300 text-center">
                  Feedback real
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-purple-100 dark:border-dark-600 transition-colors duration-300 min-h-[60px] md:min-h-auto">
                <span className="font-medium text-gray-900 dark:text-dark-100 transition-colors duration-300 text-center">
                  Tus derechos 100%
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-pink-100 dark:border-dark-600 transition-colors duration-300 min-h-[60px] md:min-h-auto">
                <span className="font-medium text-gray-900 dark:text-dark-100 transition-colors duration-300 text-center">
                  Comunidad activa
                </span>
              </div>
              {/* Tarjeta especial del ganador - MEJORADA */}
              {lastContestWinners && (
                <button
                  onClick={() => {
                    const winnersSection =
                      document.querySelector("#winners-section");
                    if (winnersSection) {
                      winnersSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="flex items-center justify-center gap-1 md:gap-2 bg-linear-to-r from-yellow-50 to-yellow-100 dark:bg-linear-to-r dark:from-yellow-900/30 dark:to-yellow-800/40 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-yellow-400 dark:border-yellow-500 hover:border-yellow-500 dark:hover:border-yellow-400 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden min-h-[60px] md:min-h-auto"
                >
                  {/* Efecto de brillo sutil */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-yellow-200/20 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <WinnerBadgeDisplay
                    userId={lastContestWinners.winners[0].user_id}
                  />
                  <div className="text-center relative z-10">
                    <div className="font-bold text-yellow-800 dark:text-yellow-200 text-[8px] md:text-xs leading-tight">
                      1ER LUGAR
                    </div>
                    <div className="font-medium text-yellow-900 dark:text-yellow-100 text-[8px] md:text-xs">
                      {lastContestWinners.contest.month}
                    </div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-[8px] md:text-xs truncate max-w-[60px] md:max-w-none">
                      {lastContestWinners.winners[0].author}
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {currentContest && (
            <div className="space-y-6">
              {/* Tab Bar - Visible para todos */}
              <div className="flex bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-indigo-200 dark:border-dark-600">
                <button
                  onClick={() => setActiveTab("mensual")}
                  className={`flex-1 flex items-center cursor-pointer justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    activeTab === "mensual"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                      : "text-gray-600 dark:text-dark-300 hover:bg-indigo-50 dark:hover:bg-dark-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Reto Mensual
                </button>
                <button
                  onClick={() => setActiveTab("semanal")}
                  className={`relative flex-1 flex flex-col items-center cursor-pointer justify-center gap-0.5 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden ${
                    activeTab === "semanal"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm"
                  }`}
                >
                  {/* Shimmer cuando no está activo */}
                  {activeTab !== "semanal" && (
                    <span className="tab-shimmer" />
                  )}
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Microhistorias
                  </span>
                  <span className={`text-[10px] font-normal ${activeTab === "semanal" ? "text-white/80" : "text-purple-400 dark:text-purple-400"}`}>
                    práctica libre · sin votación
                  </span>
                  {activeTab !== "semanal" && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                      Nuevo
                    </span>
                  )}
                </button>
              </div>

              {/* Reto Mensual */}
              {activeTab === "mensual" && (
                <>
                  <ContestCard
                    contest={currentContest}
                    phase={currentContestPhase}
                    timeLeft={timeLeft}
                    isNext={false}
                    onRulesClick={() => {
                      setRulesModalContest(currentContest);
                      setShowRulesModal(true);
                    }}
                    onExpandNext={() => setNextContestExpanded(true)}
                  />

                  {nextContest && (
                    <div data-next-contest>
                      <ContestCard
                        contest={nextContest}
                        phase="submission"
                        timeLeft={
                          currentContestPhase === "voting" ||
                          currentContestPhase === "counting"
                            ? nextTimeLeft
                            : null
                        }
                        isNext={true}
                        isEnabled={
                          currentContestPhase === "voting" ||
                          currentContestPhase === "counting"
                        }
                        forceExpanded={nextContestExpanded}
                        onRulesClick={() => {
                          setRulesModalContest(nextContest);
                          setShowRulesModal(true);
                        }}
                      />
                    </div>
                  )}

                  <NextContestOrPoll
                    nextContest={nextContest}
                    currentContest={currentContest}
                    isEnabled={true}
                  />
                </>
              )}

              {/* Microhistorias - Visible para todos */}
              {activeTab === "semanal" && (
                <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-purple-200 dark:border-dark-600">
                  {/* Header compacto */}
                  <div className="flex items-center justify-between p-4 border-b border-purple-100 dark:border-dark-600">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Microhistorias
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                        Espacio de práctica libre · sin votación ni ganadores
                      </p>
                    </div>
                    <button
                      onClick={() => setShowArchive(!showArchive)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-dark-700 hover:bg-purple-200 dark:hover:bg-dark-600 rounded-lg transition-colors text-sm font-medium text-purple-700 dark:text-purple-300"
                    >
                      <Archive className="w-4 h-4" />
                      {showArchive ? "Ver Actual" : "Ver Archivo"}
                    </button>
                  </div>

                  <div className="p-6">
                    {!showArchive ? (
                      <>
                        {/* Prompt Activo */}
                        {activePrompt && (
                          <div className="mb-6">
                            {/* Título */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                              <h3 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-white leading-tight text-center">
                                {activePrompt.title || "Prompt de esta semana"}
                              </h3>
                            </div>

                            {/* Descripción destacada */}
                            {activePrompt.description && (
                              <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 dark:from-purple-900/20 dark:via-dark-800 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-3">
                                <p className="text-gray-700 dark:text-dark-300 md:text-lg leading-relaxed">
                                  {activePrompt.description}
                                </p>
                              </div>
                            )}

                            {/* Texto de inspiración destacado */}
                            {activePrompt.prompt_text && (
                              <div className="pl-4 border-l-2 border-purple-300 dark:border-purple-600">
                                <p className="text-gray-600 dark:text-gray-400 italic">
                                  &ldquo;{activePrompt.prompt_text}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Nota fija + stats */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                              No tiene que ser una historia completa, puede ser
                              un momento, un recuerdo, un fragmento. Solo déjate
                              llevar.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span>50–300 palabras</span>
                              <span>•</span>
                              <span>
                                {activePrompt.stories_count || 0} microhistorias
                              </span>
                              {feedTimeLeft &&
                                feedTimeLeft !== "Prompt cerrado" && (
                                  <>
                                    <span>•</span>
                                    <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {feedTimeLeft}
                                    </span>
                                  </>
                                )}
                              {feedTimeLeft === "Prompt cerrado" && (
                                <>
                                  <span>•</span>
                                  <span>Prompt cerrado</span>
                                </>
                              )}
                            </div>

                            {/* Formulario de publicación o CTA de registro */}
                            {!user ? (
                              <div className="mt-4 p-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-center">
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                  Inicia sesión o crea una cuenta para publicar
                                  tu microhistoria o microrrelato
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                  <button
                                    onClick={() => openAuthModal("login")}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
                                  >
                                    Iniciar sesión
                                  </button>
                                  <button
                                    onClick={() => openAuthModal("register")}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300 font-semibold rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                                  >
                                    <PenTool className="w-4 h-4" />
                                    Crear cuenta gratis
                                  </button>
                                </div>
                              </div>
                            ) : !userHasPublished ? (
                              <form
                                onSubmit={handlePublishFeed}
                                className="mt-4 space-y-4"
                              >
                                <div>
                                  <input
                                    type="text"
                                    value={feedTitle}
                                    onChange={(e) =>
                                      setFeedTitle(e.target.value)
                                    }
                                    placeholder="Título de tu microhistoria"
                                    maxLength={100}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <textarea
                                    value={feedContent}
                                    onChange={(e) =>
                                      setFeedContent(e.target.value)
                                    }
                                    placeholder="Escribe una escena, un fragmento, un momento..."
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                  />
                                  <div className="flex items-center justify-between mt-2">
                                    <span
                                      className={`text-sm ${
                                        feedWordCount < 50 ||
                                        feedWordCount > 300
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {feedWordCount} / 50-300 palabras
                                    </span>
                                  </div>
                                </div>

                                {feedError && (
                                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    <span className="text-sm text-red-600 dark:text-red-400">
                                      {feedError}
                                    </span>
                                  </div>
                                )}

                                {feedSuccess && (
                                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-green-600 dark:text-green-400">
                                      {feedSuccess}
                                    </span>
                                  </div>
                                )}

                                <button
                                  type="submit"
                                  disabled={
                                    publishing ||
                                    feedWordCount < 50 ||
                                    feedWordCount > 300
                                  }
                                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                  {publishing ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                      Publicando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-5 h-5" />
                                      Publicar Microhistoria
                                    </>
                                  )}
                                </button>
                              </form>
                            ) : (
                              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-green-700 dark:text-green-300 text-center">
                                  ✓ Ya publicaste tu microhistoria para este
                                  prompt
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lista de microhistorias */}
                        {storiesLoading ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Cargando microhistorias...
                            </p>
                          </div>
                        ) : stories.length > 0 ? (
                          <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                              Microhistorias de la comunidad ({stories.length})
                            </h3>
                            {stories.map((story) => (
                              <MicroStoryCard
                                key={story.id}
                                story={story}
                                onLike={handleLikeFeed}
                                isLiked={userLikes[story.id] || false}
                                currentUserId={user?.id}
                                onDelete={handleDeleteFeed}
                                onReport={handleReportFeed}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>
                              Sé el primero en publicar una microhistoria para
                              este prompt
                            </p>
                          </div>
                        )}

                        {/* Preview del próximo prompt - Collapsible */}
                        {nextPrompt && (
                          <div className="mt-6 relative">
                            <div
                              className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-800 shadow-lg transition-all duration-700 ease-out ${
                                nextPromptExpanded
                                  ? "max-h-96 opacity-100"
                                  : "max-h-20 opacity-90"
                              }`}
                            >
                              {/* Botón de expansión */}
                              <button
                                onClick={() =>
                                  setNextPromptExpanded(!nextPromptExpanded)
                                }
                                className="w-full p-4 flex items-center cursor-pointer justify-between hover:bg-white/20 dark:hover:bg-white/5 transition-all duration-300 group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                      <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="absolute inset-0 w-10 h-10 bg-purple-400 rounded-full animate-pulse opacity-20"></div>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400 block">
                                      Próximo prompt
                                    </span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                                      {nextPrompt.title}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight
                                  className={`h-5 w-5 text-purple-600 dark:text-purple-400 transition-transform duration-300 ${
                                    nextPromptExpanded
                                      ? "rotate-90"
                                      : "group-hover:translate-x-1"
                                  }`}
                                />
                              </button>

                              {/* Contenido expandido */}
                              <div
                                className={`px-4 pb-4 transition-all duration-500 ${
                                  nextPromptExpanded
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-4"
                                }`}
                              >
                                {nextPrompt.description && (
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                    {nextPrompt.description}
                                  </p>
                                )}
                                {nextPrompt.prompt_text && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">
                                    &ldquo;{nextPrompt.prompt_text}&rdquo;
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-4 w-4 text-purple-500" />
                                  <span>
                                    Inicia el{" "}
                                    {new Date(
                                      nextPrompt.start_date,
                                    ).toLocaleDateString("es-CO", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    })}
                                  </span>
                                </div>
                                <div className="mt-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                                    <BookOpen className="h-4 w-4" />
                                    <span>
                                      Microhistoria de 50 a 300 palabras
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Estado vacío */}
                        {!activePrompt && !nextPrompt && !promptsLoading && (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay prompt activo en este momento</p>
                            <p className="text-sm mt-1">
                              Vuelve pronto para el próximo prompt de
                              microhistorias
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <ArchivedPromptsView />
                    )}
                  </div>
                </div>
              )}

              {/* Estadísticas integradas en el hero */}
              <div className="mt-12 ">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 ring-1 ring-accent-500 gap-8 bg-white/95 dark:bg-dark-800/95 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-8 hover:shadow-2xl hover:scale-105 transition-all duration-500 border-2 border-indigo-200 dark:border-dark-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-linear-to-r hover:from-white hover:to-purple-50 dark:hover:from-dark-800 dark:hover:to-purple-900/20">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key="users-counter"
                          end={historicalStats.totalUsers}
                          duration={2000}
                          startDelay={200}
                          className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block w-full"
                        />
                      </div>
                      <div className="text-gray-700 dark:text-dark-300 md:text-lg lg:text-xl text-sm font-medium transition-colors duration-300">
                        Escritores en la comunidad
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key="stories-counter"
                          end={historicalStats.totalStories}
                          duration={2200}
                          startDelay={400}
                          className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block w-full"
                        />
                      </div>
                      <div className="text-gray-700 dark:text-dark-300 md:text-lg lg:text-xl text-sm font-medium transition-colors duration-300">
                        Historias publicadas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key="words-counter"
                          end={historicalStats.totalWords}
                          duration={2500}
                          startDelay={600}
                          formatNumber={true}
                          className="bg-linear-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent inline-block w-full"
                        />
                      </div>
                      <div className="text-gray-700 dark:text-dark-300 md:text-lg lg:text-xl text-sm font-medium transition-colors duration-300">
                        Palabras escritas
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 🆕 SISTEMA DE KARMA RANKINGS - ANUNCIO */}
      <section className="py-12 lg:py-16 bg-linear-to-r from-primary-500 to-indigo-600 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/15 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Badge "NUEVO" */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              ¡NUEVO!
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🏆 Sistema de Karma Rankings
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Ahora puedes ganar karma por cada acción en la comunidad y ver tu
              posición en el ranking. ¡Participa, comenta, vota y escala
              posiciones!
            </p>

            {/* Puntos de karma destacados */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <PenTool className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">+15</div>
                <div className="text-sm text-white/80">Por historia</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <MessageCircle className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">+2</div>
                <div className="text-sm text-white/80">Por comentario</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Vote className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">+1</div>
                <div className="text-sm text-white/80">Por voto</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Crown className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">+75</div>
                <div className="text-sm text-white/80">Por ganar</div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-white/80 text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                ¡Ve tu posición en el ranking ahora mismo!
              </div>
              <ArrowRight className="h-5 w-5 text-white/60 hidden sm:block" />
              <button
                onClick={() => setShowRankingsSidebar(true)}
                className="inline-flex cursor-pointer items-center px-6 py-3 bg-white dark:bg-white/95 text-primary-600 dark:text-primary-700 rounded-xl font-semibold hover:bg-white/90 dark:hover:bg-white/85 transition-all duration-200 shadow-lg hover:scale-105 transform"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Ver Rankings
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ¿CÓMO FUNCIONA EL RETO? - Sección principal */}
      <section className="py-20 lg:py-24 bg-linear-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
              ¿Cómo funciona el reto?
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-dark-300 transition-colors duration-300">
              Un proceso simple y divertido para participar en nuestra comunidad
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 dark:border-dark-700 hover:border-purple-200 dark:hover:border-purple-500">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
                <PenTool className="h-8 w-8 text-indigo-600 dark:text-indigo-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                1. Escribe tu historia
              </h3>
              <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl mb-3 transition-colors duration-300">
                Usa el prompt mensual como quieras: síguelo exactamente,
                reinterpretalo o úsalo como inspiración.
              </p>
              <p className="text-sm text-gray-500 dark:text-dark-400 font-medium transition-colors duration-300">
                ✨ Total libertad creativa
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-purple-100 dark:border-dark-700 hover:border-pink-200 dark:hover:border-pink-500">
              <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                2. Vota por tus favoritas
              </h3>
              <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl mb-3 transition-colors duration-300">
                Cuando termine el periodo de envío, podrás leer y comentar todas
                las historias.
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium transition-colors duration-300">
                ✨ Tienes 3 votos por reto para elegir tus favoritas
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-pink-100 dark:border-dark-700 hover:border-indigo-200 dark:hover:border-indigo-500">
              <div className="w-16 h-16 bg-linear-to-br from-pink-100 to-indigo-200 dark:from-pink-800 dark:to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
                <Trophy className="h-8 w-8 text-pink-600 dark:text-pink-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                3. Descubre los ganadores
              </h3>
              <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl transition-colors duration-300">
                Al finalizar la votación, se celebran las historias más votadas
                con menciones especiales e insignias destacadas.
              </p>
            </div>
          </div>

          {/* Links to more info */}
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-dark-300 mb-6">
              ¿Quieres conocer más detalles sobre el proceso?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/como-funciona"
                className="inline-flex items-center px-6 py-3 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Guía Completa
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 text-indigo-700 font-semibold hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                Preguntas Frecuentes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🆕 GANADORES DEL RETO ANTERIOR */}
      {lastContestWinners && !loadingWinners && (
        <section
          id="winners-section"
          className="py-16 lg:py-20 bg-linear-to-b from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-800 dark:via-dark-900 dark:to-dark-800 relative overflow-hidden transition-colors duration-300"
        >
          {/* Elementos decorativos */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-linear-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-16 w-24 h-24 bg-linear-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
            <div className="absolute bottom-20 left-20 w-20 h-20 bg-linear-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
            <div className="absolute bottom-32 right-10 w-40 h-40 bg-linear-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 relative">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                Historias Destacadas de {lastContestWinners.contest.month}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-dark-300 max-w-2xl mx-auto transition-colors duration-300">
                "{lastContestWinners.contest.title}"
              </p>
              <div className="w-32 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-6 shadow-lg"></div>
            </div>

            {/* 🏆 GANADOR DESTACADO - MÁXIMA VISIBILIDAD */}
            <div className="mb-8">
              <div className="bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 rounded-2xl shadow-2xl border-2 border-indigo-200 dark:border-dark-600 p-8 relative overflow-hidden">
                {/* Elementos decorativos tipo spotlight */}
                <div className="absolute inset-0 bg-linear-to-r from-indigo-100/20 via-purple-100/30 to-pink-100/20 dark:from-indigo-900/20 dark:via-purple-900/30 dark:to-pink-900/20 rounded-2xl"></div>
                <div className="absolute top-6 right-6 w-24 h-24 bg-linear-to-br from-indigo-200 to-purple-300 dark:from-indigo-700 dark:to-purple-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-linear-to-br from-purple-200 to-pink-300 dark:from-purple-700 dark:to-pink-600 rounded-full opacity-15 blur-lg animate-pulse"></div>

                <div className="relative max-w-4xl mx-auto">
                  {/* Header motivacional */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-bold text-sm shadow-lg mb-4">
                      <Sparkles className="h-4 w-4" />
                      Historia Más Votada de {lastContestWinners.contest.month}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                      ¡La historia que más resonó con la comunidad!
                    </h2>
                    <p className="text-gray-600 dark:text-dark-300 text-lg">
                      Esta historia brilló entre todas y capturó los corazones
                      de los lectores
                    </p>
                  </div>

                  {/* Ganador - mismo ancho que finalistas pero destacado */}
                  <div className="mb-8 flex justify-center">
                    <div className="w-full max-w-lg">
                      <div className="relative p-6 rounded-2xl border-3 bg-linear-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-indigo-400 dark:border-indigo-500 transition-all duration-300 shadow-lg ring-4 ring-yellow-300/50 ring-offset-2">
                        {/* Badge destacado */}
                        <div className="absolute -top-3 left-6">
                          <div className="px-5 py-2 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-xl animate-pulse ring-2 ring-yellow-400/60">
                            🏆 1ER LUGAR
                          </div>
                        </div>

                        {/* Corona más grande y llamativa */}
                        <div className="text-center mb-4 mt-6">
                          <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-xl border-4 border-yellow-300 ring-2 ring-yellow-400/60">
                            <span className="text-5xl">👑</span>
                          </div>
                        </div>

                        {/* Título - clickeable */}
                        <Link
                          to={`/story/${lastContestWinners.winners[0].id}`}
                          className="block mb-4"
                        >
                          <h5 className="text-xl font-bold text-gray-900 dark:text-dark-100 text-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
                            "{lastContestWinners.winners[0].title}"
                          </h5>
                        </Link>

                        {/* Autor - con ProfileButton funcional */}
                        <div className="flex justify-center mb-4">
                          <UserCardWithBadges
                            userId={lastContestWinners.winners[0].user_id}
                            userName={lastContestWinners.winners[0].author}
                            userEmail={`${lastContestWinners.winners[0].author}@mock.com`}
                            avatarSize="md"
                            badgeSize="sm"
                            maxBadges={1}
                            className="text-lg font-semibold"
                          />
                        </div>

                        {/* Estadísticas más destacadas */}
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-3 bg-indigo-100 dark:bg-dark-700 border-indigo-400 dark:border-indigo-500 text-indigo-800 dark:text-indigo-300 shadow-md ring-2 ring-yellow-400/40">
                            <Heart className="h-5 w-5" />
                            <span className="font-bold text-lg">
                              {lastContestWinners.winners[0].likes_count || 0}{" "}
                              votos
                            </span>
                          </div>
                        </div>

                        {/* Call to action - Link separado */}
                        <div className="text-center">
                          <Link
                            to={`/story/${lastContestWinners.winners[0].id}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-white font-bold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ring-2 ring-yellow-400/50"
                          >
                            <BookOpen className="h-5 w-5" />
                            <span>Leer historia destacada</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Podium completo con protagonismo equilibrado */}
                  {lastContestWinners.winners.length > 1 && (
                    <div className="mt-8 pt-6 border-t border-indigo-200 dark:border-dark-600">
                      <h4 className="text-lg font-semibold text-gray-600 dark:text-dark-300 text-center mb-2">
                        Finalistas
                      </h4>
                      {/* Nota sobre criterio de desempate */}
                      <p className="text-xs text-gray-500 dark:text-dark-400 text-center mb-6 max-w-2xl mx-auto">
                        Las posiciones se determinan por número de votos. En
                        caso de empate, se prioriza la historia enviada primero.
                      </p>
                      <div className="grid gap-6 max-w-6xl mx-auto grid-cols-1 lg:grid-cols-2">
                        {lastContestWinners.winners
                          .slice(1, 3)
                          .map((story, index) => {
                            const position = index + 2;
                            const isSecond = position === 2;

                            return (
                              <div
                                key={story.id}
                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 shadow-lg h-full flex flex-col ${
                                  isSecond
                                    ? "bg-linear-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-indigo-300 dark:border-indigo-500"
                                    : "bg-linear-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-indigo-300 dark:border-indigo-500"
                                }`}
                              >
                                {/* Badge de posición */}
                                <div className="absolute -top-3 left-6">
                                  <div
                                    className={`px-4 py-1 rounded-full text-white font-bold text-sm shadow-lg ${
                                      isSecond
                                        ? "bg-linear-to-r from-indigo-500 to-purple-600"
                                        : "bg-linear-to-r from-indigo-500 to-purple-600"
                                    }`}
                                  >
                                    {isSecond ? "🥈 2º LUGAR" : "🥉 3º LUGAR"}
                                  </div>
                                </div>

                                {/* Medalla grande */}
                                <div className="text-center mb-4 mt-4">
                                  <div
                                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg ${
                                      isSecond
                                        ? "bg-linear-to-br from-indigo-400 to-purple-500"
                                        : "bg-linear-to-br from-indigo-400 to-purple-500"
                                    }`}
                                  >
                                    <span className="text-4xl">
                                      {isSecond ? "🥈" : "🥉"}
                                    </span>
                                  </div>
                                </div>

                                {/* Título de la historia - clickeable */}
                                <Link
                                  to={`/story/${story.id}`}
                                  className="block mb-3"
                                >
                                  <h5 className="text-lg font-bold text-gray-900 dark:text-dark-100 text-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
                                    "{story.title}"
                                  </h5>
                                </Link>

                                {/* Autor - con ProfileButton funcional */}
                                <div className="flex justify-center mb-4">
                                  <UserCardWithBadges
                                    userId={story.user_id}
                                    userName={story.author}
                                    userEmail={`${story.author}@mock.com`}
                                    avatarSize="md"
                                    badgeSize="xs"
                                    maxBadges={1}
                                    className="font-semibold"
                                  />
                                </div>

                                {/* Estadísticas */}
                                <div className="text-center mb-4">
                                  <div
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                                      isSecond
                                        ? "bg-indigo-100 dark:bg-dark-700 border-indigo-300 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                        : "bg-indigo-100 dark:bg-dark-700 border-indigo-300 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                    }`}
                                  >
                                    <Heart className="h-4 w-4" />
                                    <span className="font-bold">
                                      {story.likes_count || 0} votos
                                    </span>
                                  </div>
                                </div>

                                {/* Call to action - Link separado */}
                                <div className="text-center mt-auto">
                                  <Link
                                    to={`/story/${story.id}`}
                                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg ${
                                      isSecond
                                        ? "bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                        : "bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                    }`}
                                  >
                                    <BookOpen className="h-4 w-4" />
                                    <span>Leer historia</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                      </div>
                    </div>
                  )}

                  {/* Sección combinada con ambos CTAs */}
                  <div className="text-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-xl border border-indigo-100 dark:border-dark-600 p-6 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                      ¿Qué quieres hacer ahora?
                    </h3>
                    <p className="text-gray-600 dark:text-dark-300 mb-6">
                      Explora todas las historias del reto anterior o únete al
                      reto actual
                    </p>

                    {/* Botones lado a lado */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      {/* Botón Ver listado */}
                      <Link
                        to={`/contest/${lastContestWinners.contest.id}#stories-section`}
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 w-full sm:w-auto"
                      >
                        <Trophy className="h-5 w-5 mr-2" />
                        Ver todas las historias
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>

                      {/* Botón Participar */}
                      <Link
                        to="/contest/current"
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                      >
                        <PenTool className="h-5 w-5 mr-2" />
                        Participar en el reto actual
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/contest-history"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border-2 border-indigo-200 dark:border-dark-600 text-indigo-700 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-dark-700 hover:border-purple-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 shadow-sm"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Ver historial completo de retos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Original */}
      <section className="py-20 lg:py-24 bg-linear-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
              Más que una plataforma, somos una comunidad
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-dark-300 transition-colors duration-300">
              Donde cada historia importa y cada escritor encuentra su lugar
            </p>
          </div>

          {/* Features principales - 3 columnas balanceadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 - Siempre visible */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 dark:border-dark-700 hover:border-purple-200 dark:hover:border-purple-500">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
                <PenTool className="h-8 w-8 text-indigo-600 dark:text-indigo-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                Retos Mensuales
              </h3>
              <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl mb-3 transition-colors duration-300">
                Participa en desafíos creativos cada mes. Nuevos escenarios,
                situaciones y conceptos para explorar con tu escritura.
              </p>
            </div>

            {/* Feature 2 - Siempre visible */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 dark:border-dark-700 hover:border-purple-200 dark:hover:border-purple-500">
              <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                Comunidad Activa
              </h3>
              <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl mb-3 transition-colors duration-300">
                Conecta con otros escritores, recibe feedback constructivo y haz
                crecer tu audiencia.
              </p>
            </div>

            {/* Feature 3 - Sistema de Badges mejorado */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 dark:border-dark-700 hover:border-purple-200 dark:hover:border-purple-500">
              <div className="w-16 h-16 bg-linear-to-br from-yellow-100 to-orange-200 dark:from-yellow-800 dark:to-orange-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                Sistema de Badges
              </h3>
              <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl mb-3 transition-colors duration-300">
                Colecciona reconocimientos únicos por tus logros <br />
                ¡Cada badge cuenta tu historia como escritor!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Derechos de Autor */}
      <section className="py-12 lg:py-16 bg-linear-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-dark-100 mb-3 tracking-tight transition-colors duration-300">
              Tu obra, tus derechos
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-dark-300 transition-colors duration-300 max-w-2xl mx-auto">
              En Letranido, tu creatividad está completamente protegida.
              Mantienes todos los derechos sobre tus historias.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 dark:border-dark-700 hover:border-purple-200 dark:hover:border-purple-500">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-colors duration-300">
                  <Copyright className="h-8 w-8 text-indigo-600 dark:text-indigo-400 transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-3 tracking-tight transition-colors duration-300">
                    Derechos completos
                  </h3>
                  <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl">
                    Mantienes todos los derechos de autor sobre tus historias.
                    Son tuyas y siempre lo serán.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 dark:border-dark-700 hover:border-pink-200 dark:hover:border-pink-500 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-200 dark:from-purple-700 dark:to-pink-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-3">
                    Protección total
                  </h3>
                  <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl">
                    Nadie puede republicar, copiar o usar tu historia sin tu
                    permiso expreso.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-pink-100 dark:border-dark-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-linear-to-br from-pink-100 to-indigo-200 dark:from-pink-600 dark:to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Users className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-3">
                    Solo la plataforma
                  </h3>
                  <p className="text-gray-600 dark:text-dark-300 md:text-lg lg:text-xl">
                    Letranido solo proporciona el espacio para compartir. Tu
                    trabajo es completamente tuyo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm dark:text-dark-300  text-gray-500 max-w-3xl mx-auto">
              Al participar en Letranido, solo nos das permiso para mostrar tu
              historia en la plataforma durante los retos o publicarla en redes
              sociales si eres ganador o finalista. Puedes retirar tu obra
              cuando quieras y usarla libremente en cualquier otro lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Modal de reglas */}
      <ContestRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        contest={rulesModalContest || currentContest}
      />

      {/* Sidebar de rankings */}
      <KarmaRankingsSidebar
        isOpen={showRankingsSidebar}
        onClose={() => setShowRankingsSidebar(false)}
      />

      {/* Modal de anuncio de nuevas features */}
      <FeatureAnnouncementModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        userId={user?.id}
        onGoToMicrohistorias={() => setActiveTab("semanal")}
      />
    </div>
  );
};

export default LandingPage;
