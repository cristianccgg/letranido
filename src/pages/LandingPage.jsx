// pages/LandingPage.jsx - VERSIÓN CORREGIDA SIN HISTORIAS
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
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import SEOHead from "../components/SEO/SEOHead";
import ContestActionButton from "../components/ui/ContestActionButton";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import UserAvatar from "../components/ui/UserAvatar";
import {
  UserWithWinnerBadges,
  UserWithTopBadge,
} from "../components/ui/UserNameWithBadges";
import KarmaRankingsSidebar from "../components/ui/KarmaRankingsSidebar";
import NextContestOrPoll from "../components/ui/NextContestOrPoll";
import ContestCard from "../components/ui/ContestCard";
import NewsletterSignup from "../components/ui/NewsletterSignup";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import { useBadgesCache } from "../hooks/useBadgesCache";
import Badge from "../components/ui/Badge";
import WelcomeBanner from "../components/ui/WelcomeBanner";
import { FEATURES } from "../lib/config";
import logo from "../assets/images/letranido-logo.png";
import ComingSoonModal from "../components/modals/ComingSoonModal";
import { useComingSoonModal } from "../hooks/useComingSoonModal";

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
      Object.prototype.hasOwnProperty.call(prestigeOrder, badge.id)
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
    globalLoading,
    // Global stats
    globalStats,
    globalStatsLoading,
    loadGlobalStats,
  } = useGlobalApp();

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

  // 🎉 MODAL DE COMING SOON
  const { isOpen: comingSoonOpen, closeModal: closeComingSoon } = useComingSoonModal();

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
              contest.status === "results" && contest.id !== currentContest?.id
          )
          .sort(
            (a, b) =>
              new Date(b.finalized_at || b.voting_deadline) -
              new Date(a.finalized_at || a.voting_deadline)
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
          
          // Verificar si hay mención de honor (4º lugar con mismos votos que 3º)
          let honoraryMention = null;
          if (sortedStories.length >= 4) {
            const thirdPlace = winners[2];
            const fourthPlace = sortedStories[3];
            
            if (thirdPlace && fourthPlace && thirdPlace.likes_count === fourthPlace.likes_count) {
              honoraryMention = { ...fourthPlace, position: 4, isHonoraryMention: true };
              console.log("🎖️ Mención de Honor detectada en landing:", honoraryMention.title);
            }
          }

          setLastContestWinners({
            contest: lastContest,
            winners: winners,
            honoraryMention: honoraryMention,
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
  }, [currentContest, currentContestPhase]);

  // Estado para mostrar el modal de reglas
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesModalContest, setRulesModalContest] = useState(null);
  const [nextContestExpanded, setNextContestExpanded] = useState(false);

  // Estado para el sidebar de rankings
  const [showRankingsSidebar, setShowRankingsSidebar] = useState(false);

  // ✅ Contador para el siguiente reto
  const [nextTimeLeft, setNextTimeLeft] = useState("");
  useEffect(() => {
    if (!nextContest?.submission_deadline || (currentContestPhase !== "voting" && currentContestPhase !== "counting")) {
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
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
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
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 relative overflow-hidden transition-colors duration-300">
        {/* Elementos decorativos modernos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl"></div>
          <div className="absolute top-32 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
          <div className="absolute bottom-32 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
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
                adaptalo o úsalo como inspiración
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
              <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-indigo-100 dark:border-dark-600 transition-colors duration-300 min-h-[60px] md:min-h-[auto]">
                <span className="font-medium text-gray-900 dark:text-dark-100 transition-colors duration-300 text-center">
                  Feedback real
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-purple-100 dark:border-dark-600 transition-colors duration-300 min-h-[60px] md:min-h-[auto]">
                <span className="font-medium text-gray-900 dark:text-dark-100 transition-colors duration-300 text-center">
                  Tus derechos 100%
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-pink-100 dark:border-dark-600 transition-colors duration-300 min-h-[60px] md:min-h-[auto]">
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
                  className="flex items-center justify-center gap-1 md:gap-2 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:bg-gradient-to-r dark:from-yellow-900/30 dark:to-yellow-800/40 backdrop-blur-sm rounded-lg px-2 py-3 md:px-4 md:py-3 border border-yellow-400 dark:border-yellow-500 hover:border-yellow-500 dark:hover:border-yellow-400 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden min-h-[60px] md:min-h-[auto]"
                >
                  {/* Efecto de brillo sutil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

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
              {/* Tarjeta del reto actual */}
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

              {/* Tarjeta del siguiente reto - igual diseño que actual */}
              {nextContest && (
                <div data-next-contest>
                  <ContestCard
                    contest={nextContest}
                    phase="submission" // El siguiente siempre está en submission
                    timeLeft={
                      (currentContestPhase === "voting" || currentContestPhase === "counting") ? nextTimeLeft : null
                    } // Contador real cuando esté habilitado
                    isNext={true}
                    isEnabled={currentContestPhase === "voting" || currentContestPhase === "counting"} // Habilitado durante votación y counting
                    forceExpanded={nextContestExpanded} // ✅ Controlar expansión externamente
                    onRulesClick={() => {
                      setRulesModalContest(nextContest);
                      setShowRulesModal(true);
                    }}
                  />
                </div>
              )}

              {/* Mostrar encuesta activa (cuando esté disponible) */}
              <NextContestOrPoll
                nextContest={nextContest}
                currentContest={currentContest}
                isEnabled={true} // Siempre habilitado para verificar encuestas disponibles
              />

              {/* Estadísticas integradas en el hero */}
              <div className="mt-12 ">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 ring-1 ring-accent-500 gap-8 bg-white/95 dark:bg-dark-800/95 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-8 hover:shadow-2xl hover:scale-105 transition-all duration-500 border-2 border-indigo-200 dark:border-dark-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-gradient-to-r hover:from-white hover:to-purple-50 dark:hover:from-dark-800 dark:hover:to-purple-900/20">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key="users-counter"
                          end={historicalStats.totalUsers}
                          duration={2000}
                          startDelay={200}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block w-full"
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
                          className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block w-full"
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
                          className="bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent inline-block w-full"
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
      <section className="py-12 lg:py-16 bg-gradient-to-r from-primary-500 to-indigo-600 relative overflow-hidden">
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
      <section className="py-20 lg:py-24 bg-gradient-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
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
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
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
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
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
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-indigo-200 dark:from-pink-800 dark:to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
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
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl"
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
          className="py-16 lg:py-20 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-800 dark:via-dark-900 dark:to-dark-800 relative overflow-hidden transition-colors duration-300"
        >
          {/* Elementos decorativos */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
            <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
            <div className="absolute bottom-32 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 relative">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
                Ganadores de {lastContestWinners.contest.month}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-dark-300 max-w-2xl mx-auto transition-colors duration-300">
                "{lastContestWinners.contest.title}"
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-6 shadow-lg"></div>
            </div>

            {/* 🏆 GANADOR DESTACADO - MÁXIMA VISIBILIDAD */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 rounded-2xl shadow-2xl border-2 border-indigo-200 dark:border-dark-600 p-8 relative overflow-hidden">
                {/* Elementos decorativos tipo spotlight */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 via-purple-100/30 to-pink-100/20 dark:from-indigo-900/20 dark:via-purple-900/30 dark:to-pink-900/20 rounded-2xl"></div>
                <div className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-indigo-200 to-purple-300 dark:from-indigo-700 dark:to-purple-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-300 dark:from-purple-700 dark:to-pink-600 rounded-full opacity-15 blur-lg animate-pulse"></div>

                <div className="relative max-w-4xl mx-auto">
                  {/* Header motivacional */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-bold text-sm shadow-lg mb-4">
                      <Sparkles className="h-4 w-4" />
                      Historia Ganadora de {lastContestWinners.contest.month}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                      ¡Conoce al ganador que conquistó a la comunidad!
                    </h2>
                    <p className="text-gray-600 dark:text-dark-300 text-lg">
                      Su historia brilló entre todas las demás y se llevó el
                      reconocimiento de los lectores
                    </p>
                  </div>

                  {/* Ganador - mismo ancho que finalistas pero destacado */}
                  <div className="mb-8 flex justify-center">
                    <div className="w-full max-w-lg">
                      <Link
                        to={`/story/${lastContestWinners.winners[0].id}`}
                        className="group block"
                      >
                        <div className="relative p-6 rounded-2xl border-3 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-indigo-400 dark:border-indigo-500 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg ring-4 ring-yellow-300/50 ring-offset-2">
                          {/* Badge de ganador más prominente */}
                          <div className="absolute -top-3 left-6">
                            <div className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-xl animate-pulse ring-2 ring-yellow-400/60">
                              🏆 GANADOR
                            </div>
                          </div>

                          {/* Corona más grande y llamativa */}
                          <div className="text-center mb-4 mt-6">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-xl border-4 border-yellow-300 ring-2 ring-yellow-400/60">
                              <span className="text-5xl">👑</span>
                            </div>
                          </div>

                          {/* Título */}
                          <h5 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            "{lastContestWinners.winners[0].title}"
                          </h5>

                          {/* Autor */}
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <UserAvatar
                              user={{
                                name: lastContestWinners.winners[0].author,
                                email: `${lastContestWinners.winners[0].author}@mock.com`,
                              }}
                              size="md"
                            />
                            <div className="text-center">
                              <UserWithWinnerBadges
                                userId={lastContestWinners.winners[0].user_id}
                                userName={lastContestWinners.winners[0].author}
                                className="font-semibold text-lg"
                              />
                            </div>
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

                          {/* Call to action */}
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ring-2 ring-yellow-400/50">
                              <BookOpen className="h-5 w-5" />
                              <span>Leer historia ganadora</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Podium completo con protagonismo equilibrado */}
                  {lastContestWinners.winners.length > 1 && (
                    <div className="mt-8 pt-6 border-t border-indigo-200 dark:border-dark-600">
                      <h4 className="text-lg font-semibold text-gray-600 dark:text-dark-300 text-center mb-6">
                        {lastContestWinners.honoraryMention ? "Finalistas y Menciones" : "Finalistas"}
                      </h4>
                      <div className={`grid gap-6 max-w-6xl mx-auto ${
                        lastContestWinners.honoraryMention 
                          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" // 4 tarjetas más compactas
                          : "grid-cols-1 lg:grid-cols-2" // 2 tarjetas más grandes
                      }`}>
                        {lastContestWinners.winners
                          .slice(1, 3)
                          .map((story, index) => {
                            const position = index + 2;
                            const isSecond = position === 2;

                            return (
                              <Link
                                key={story.id}
                                to={`/story/${story.id}`}
                                className="group block h-full"
                              >
                                <div
                                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 h-full flex flex-col ${
                                    isSecond
                                      ? "bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-indigo-300 dark:border-indigo-500 hover:border-indigo-400 dark:hover:border-indigo-400"
                                      : "bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-indigo-300 dark:border-indigo-500 hover:border-indigo-400 dark:hover:border-indigo-400"
                                  }`}
                                >
                                  {/* Badge de posición */}
                                  <div className="absolute -top-3 left-6">
                                    <div
                                      className={`px-4 py-1 rounded-full text-white font-bold text-sm shadow-lg ${
                                        isSecond
                                          ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                                          : "bg-gradient-to-r from-indigo-500 to-purple-600"
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
                                          ? "bg-gradient-to-br from-indigo-400 to-purple-500"
                                          : "bg-gradient-to-br from-indigo-400 to-purple-500"
                                      }`}
                                    >
                                      <span className="text-4xl">
                                        {isSecond ? "🥈" : "🥉"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Título de la historia */}
                                  <h5 className="text-lg font-bold text-gray-900 dark:text-dark-100 mb-3 text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                    "{story.title}"
                                  </h5>

                                  {/* Autor */}
                                  <div className="flex items-center justify-center gap-3 mb-4">
                                    <UserAvatar
                                      user={{
                                        name: story.author,
                                        email: `${story.author}@mock.com`,
                                      }}
                                      size="md"
                                    />
                                    <div className="text-center">
                                      <UserWithWinnerBadges
                                        userId={story.user_id}
                                        userName={story.author}
                                        className="font-semibold"
                                      />
                                    </div>
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

                                  {/* Call to action */}
                                  <div className="text-center mt-auto">
                                    <div
                                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg ${
                                        isSecond
                                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                          : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                      }`}
                                    >
                                      <BookOpen className="h-4 w-4" />
                                      <span>Leer historia</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        
                        {/* Tarjeta de Mención de Honor */}
                        {lastContestWinners.honoraryMention && (
                          <Link
                            to={`/story/${lastContestWinners.honoraryMention.id}`}
                            className="group block h-full"
                          >
                            <div className="relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 h-full flex flex-col bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 border-blue-300 dark:border-blue-500 hover:border-blue-400 dark:hover:border-blue-400">
                              {/* Badge de mención de honor */}
                              <div className="absolute -top-3 left-6">
                                <div className="px-4 py-1 rounded-full text-white font-bold text-sm shadow-lg bg-gradient-to-r from-blue-500 to-sky-600">
                                  🎖️ MENCIÓN DE HONOR
                                </div>
                              </div>

                              {/* Medalla */}
                              <div className="text-center mb-4 mt-4">
                                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-sky-500">
                                  <span className="text-4xl">🎖️</span>
                                </div>
                              </div>

                              {/* Título de la historia */}
                              <h5 className="text-lg font-bold text-gray-900 dark:text-dark-100 mb-3 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                "{lastContestWinners.honoraryMention.title}"
                              </h5>

                              {/* Autor */}
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <UserAvatar
                                  user={{
                                    name: lastContestWinners.honoraryMention.author,
                                    email: `${lastContestWinners.honoraryMention.author}@mock.com`,
                                  }}
                                  size="sm"
                                />
                                <div className="text-center">
                                  <UserWithWinnerBadges
                                    userId={lastContestWinners.honoraryMention.user_id}
                                    userName={lastContestWinners.honoraryMention.author}
                                    className="font-semibold text-sm"
                                  />
                                </div>
                              </div>

                              {/* Explicación del empate */}
                              <div className="text-center mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm">
                                  <Heart className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {lastContestWinners.honoraryMention.likes_count || 0} votos (= 3º lugar)
                                  </span>
                                </div>
                              </div>

                              <div className="text-center text-xs text-blue-600 dark:text-blue-400 mb-4">
                                Criterio de desempate: fecha de envío
                              </div>

                              {/* Call to action */}
                              <div className="text-center mt-auto">
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-600 text-white font-semibold hover:from-blue-600 hover:to-sky-700 transition-all duration-300 hover:scale-105 shadow-md">
                                  <BookOpen className="h-4 w-4" />
                                  <span>Leer historia</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sección combinada con ambos CTAs */}
                  <div className="text-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-xl border border-indigo-100 dark:border-dark-600 p-6 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                      ¿Qué quieres hacer ahora?
                    </h3>
                    <p className="text-gray-600 dark:text-dark-300 mb-6">
                      Explora todas las historias del reto anterior o únete al reto actual
                    </p>
                    
                    {/* Botones lado a lado */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      {/* Botón Ver listado */}
                      <Link
                        to={`/contest/${lastContestWinners.contest.id}#stories-section`}
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 w-full sm:w-auto"
                      >
                        <Trophy className="h-5 w-5 mr-2" />
                        Ver todas las historias
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>

                      {/* Botón Participar */}
                      <Link
                        to="/contest/current"
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
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
      <section className="py-20 lg:py-24 bg-gradient-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
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
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
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
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
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
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-200 dark:from-yellow-800 dark:to-orange-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors duration-300">
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
      <section className="py-12 lg:py-16 bg-gradient-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 transition-colors duration-300">
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
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-700 dark:to-pink-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
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
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-indigo-200 dark:from-pink-600 dark:to-indigo-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
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

      {/* Modal de Coming Soon */}
      <ComingSoonModal isOpen={comingSoonOpen} onClose={closeComingSoon} />
    </div>
  );
};

export default LandingPage;
