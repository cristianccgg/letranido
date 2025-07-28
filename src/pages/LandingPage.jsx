// pages/LandingPage.jsx - VERSIÓN CORREGIDA SIN HISTORIAS
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Trophy,
  Users,
  Star,
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
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { supabase } from "../lib/supabase"; // 👈 Agrega este import
import SEOHead from "../components/SEO/SEOHead";
import ContestActionButton from "../components/ui/ContestActionButton";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import UserAvatar from "../components/ui/UserAvatar";
import { UserWithWinnerBadges } from "../components/ui/UserNameWithBadges";
import NextContestPreview from "../components/ui/NextContestPreview";
import ContestCard from "../components/ui/ContestCard";
import NewsletterSignup from "../components/ui/NewsletterSignup";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import logo from "../assets/images/letranido-logo.png";

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
  } = useGlobalApp();

  // ✅ SOLO ESTADÍSTICAS GENERALES - SIN CARGAR HISTORIAS
  const [stats, setStats] = useState({
    totalUsers: 0, // Cambiado de totalParticipants a totalUsers
    totalStories: 0,
    totalWords: 0, // Cambiado de totalLikes a totalWords
  });

  // 🆕 ESTADO PARA GANADORES DEL CONCURSO ANTERIOR
  const [lastContestWinners, setLastContestWinners] = useState(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // ✅ CARGAR SOLO ESTADÍSTICAS BÁSICAS
  useEffect(() => {
    console.log(
      "🔄 useEffect triggered - initialized:",
      initialized,
      "currentContest:",
      !!currentContest
    );

    const loadBasicStats = async () => {
      console.log("📊 loadBasicStats called - initialized:", initialized);
      if (!initialized) {
        console.log("❌ Not initialized, returning");
        return;
      }

      console.log("✅ Starting to load stats...");
      try {
        // Obtener total de usuarios registrados
        let totalUsers = 0;
        try {
          console.log("📤 Fetching user count...");
          const { count, error: usersError } = await supabase
            .from("user_profiles")
            .select("*", { count: "exact", head: true });

          console.log("📥 User count response:", { count, error: usersError });
          if (!usersError) {
            totalUsers = count || 0;
          }
        } catch (err) {
          console.error("❌ Error cargando total de usuarios:", err);
        }

        // Estadísticas de todas las historias publicadas
        let totalStories = 0;
        let totalWords = 0;

        try {
          console.log("📤 Fetching stories stats...");
          const { data: stories, error } = await supabase
            .from("stories")
            .select("word_count")
            .not("published_at", "is", null); // Solo historias publicadas

          console.log("📥 Stories response:", {
            storiesCount: stories?.length,
            error,
          });
          if (!error && stories && stories.length > 0) {
            totalStories = stories.length;
            totalWords = stories.reduce(
              (acc, story) => acc + (story.word_count || 0),
              0
            );
          }
        } catch (err) {
          console.error("❌ Error cargando estadísticas totales:", err);
        }

        console.log("📊 Final stats:", {
          totalUsers,
          totalStories,
          totalWords,
        });
        setStats({
          totalUsers,
          totalStories,
          totalWords,
        });
        console.log("✅ Stats set successfully");
      } catch (error) {
        console.error("❌ Error cargando stats básicas:", error);
      }
    };

    loadBasicStats();
  }, [initialized, currentContest]);

  // 🆕 CARGAR GANADORES DEL ÚLTIMO CONCURSO FINALIZADO
  useEffect(() => {
    const loadLastContestWinners = async () => {
      if (!initialized || contests.length === 0) return;

      setLoadingWinners(true);
      try {
        // Encontrar el último concurso finalizado (excluyendo el actual)
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
          const sortedStories = result.stories.sort(
            (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
          );

          setLastContestWinners({
            contest: lastContest,
            winners: sortedStories.slice(0, 3),
          });
        } else {
          setLastContestWinners(null);
        }
      } catch (error) {
        console.error("Error cargando ganadores del último concurso:", error);
        setLastContestWinners(null);
      } finally {
        setLoadingWinners(false);
      }
    };

    loadLastContestWinners();
  }, [initialized, contests, currentContest, getStoriesByContest]);

  // Contador de tiempo restante (dinámico según la fase del concurso)
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!currentContest) {
      setTimeLeft("");
      return;
    }

    const updateTime = () => {
      const now = new Date();
      let deadline;

      // Usar la fecha correcta según la fase del concurso
      if (currentContestPhase === "submission") {
        deadline = new Date(currentContest.submission_deadline);
      } else if (currentContestPhase === "voting") {
        deadline = new Date(currentContest.voting_deadline);
      } else {
        setTimeLeft("Concurso cerrado");
        return;
      }

      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft("Concurso cerrado");
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

  // ✅ Contador para el siguiente concurso
  const [nextTimeLeft, setNextTimeLeft] = useState("");
  useEffect(() => {
    if (!nextContest?.submission_deadline || currentContestPhase !== "voting") {
      setNextTimeLeft("");
      return;
    }

    const updateNextTime = () => {
      const now = new Date();
      const deadline = new Date(nextContest.submission_deadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setNextTimeLeft("Concurso cerrado");
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

  // Configuración del segundo botón según la fase (Optimizado con useMemo)
  const secondaryButton = useMemo(() => {
    if (!currentContestPhase || !currentContest) return null;
    if (currentContestPhase === "submission") {
      return {
        text: "Ver participantes",
        href: "/contest/current",
        icon: Users,
      };
    }
    if (currentContestPhase === "voting") {
      return {
        text: "Leer y votar",
        href: "/contest/current",
        icon: Eye,
      };
    }
    if (currentContestPhase === "finished") {
      return {
        text: "Ver ganador",
        href: "/contest/current",
        icon: Trophy,
      };
    }
    return null;
  }, [currentContestPhase, currentContest]);

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
        description="Únete a Letranido, la comunidad de escritores creativos. Participa en concursos mensuales, comparte tus historias originales y conecta con otros escritores apasionados."
        keywords="escritura creativa, concursos de escritura, comunidad escritores, historias originales, ficción, narrativa, letranido, literatura"
        url="/"
      />

      {/* Hero Section - Elegante y moderno */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Elementos decorativos modernos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl"></div>
          <div className="absolute top-32 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
          <div className="absolute bottom-32 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-12 md:py-8 lg:py-8 text-center">
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

            {/* Tagline */}
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-800 mb-6 font-dancing-script font-semibold">
              Tu nido creativo de escritura
            </p>

            {/* Qué es - explicación clara y directa */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 max-w-2xl leading-relaxed">
              Cada mes un{" "}
              <span className="text-indigo-600 font-semibold">
                prompt diferente
              </span>{" "}
              que puedes interpretar como quieras: síguelo exactamente, adaptalo
              o úsalo como inspiración
            </p>
          </div>

          {/* Beneficios específicos - más concisos */}
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4 text-[10px] md:text-base">
              <div className="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-indigo-100">
                <span className="font-medium">Feedback real</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-purple-100">
                <span className="font-medium">Tus derechos 100%</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-pink-100">
                <span className="font-medium">Comunidad activa</span>
              </div>
            </div>
          </div>

          {currentContest && (
            <div className="space-y-6">
              {/* Tarjeta del concurso actual */}
              <ContestCard
                contest={currentContest}
                phase={currentContestPhase}
                timeLeft={timeLeft}
                isNext={false}
                onRulesClick={() => setShowRulesModal(true)}
              />

              {/* Tarjeta del siguiente concurso - igual diseño que actual */}
              {nextContest && (
                <ContestCard
                  contest={nextContest}
                  phase="submission" // El siguiente siempre está en submission
                  timeLeft={
                    currentContestPhase === "voting" ? nextTimeLeft : null
                  } // Contador real cuando esté habilitado
                  isNext={true}
                  isEnabled={currentContestPhase === "voting"} // Solo habilitado si actual está en votación
                  onRulesClick={() => setShowRulesModal(true)}
                />
              )}

              {/* Mantener NextContestPreview solo si NO hay nextContest (para newsletter, etc.) */}
              {!nextContest && (
                <NextContestPreview
                  nextContest={nextContest}
                  currentContest={currentContest}
                />
              )}

              {/* Estadísticas integradas en el hero */}
              <div className="mt-12">
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-8 hover:shadow-2xl hover:scale-105 transition-all duration-500 border-2 border-white/20 hover:border-purple-200 hover:bg-gradient-to-r hover:from-white hover:to-purple-50">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key={`users-${stats.totalUsers}`}
                          end={stats.totalUsers}
                          duration={2000}
                          startDelay={200}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block w-full"
                        />
                      </div>
                      <div className="text-gray-700 md:text-lg lg:text-xl text-sm font-medium">
                        Escritores en la comunidad
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key={`stories-${stats.totalStories}`}
                          end={stats.totalStories}
                          duration={2200}
                          startDelay={400}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block w-full"
                        />
                      </div>
                      <div className="text-gray-700 md:text-lg lg:text-xl text-sm font-medium">
                        Historias publicadas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 min-w-0 px-2">
                        <AnimatedCounter
                          key={`words-${stats.totalWords}`}
                          end={stats.totalWords}
                          duration={2500}
                          startDelay={600}
                          formatNumber={true}
                          className="bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent inline-block w-full"
                        />
                      </div>
                      <div className="text-gray-700 md:text-lg lg:text-xl text-sm font-medium">
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

      {/* 🆕 GANADORES DEL CONCURSO ANTERIOR */}
      {lastContestWinners && !loadingWinners && (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
            <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
            <div className="absolute bottom-32 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full mb-6 shadow-xl">
                <Trophy className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Ganadores de {lastContestWinners.contest.month}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
                "{lastContestWinners.contest.title}"
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-6 shadow-lg"></div>
            </div>

            {/* 🏆 GANADOR DESTACADO - MÁXIMA VISIBILIDAD */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl border-2 border-indigo-200 p-8 relative overflow-hidden">
                {/* Elementos decorativos tipo spotlight */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 via-purple-100/30 to-pink-100/20 rounded-2xl"></div>
                <div className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg animate-pulse"></div>

                <div className="relative max-w-4xl mx-auto">
                  {/* Header motivacional */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-bold text-sm shadow-lg mb-4">
                      <Sparkles className="h-4 w-4" />
                      Historia Ganadora de {lastContestWinners.contest.month}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      ¡Conoce al ganador que conquistó a la comunidad!
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Su historia brilló entre todas las demás y se llevó el
                      reconocimiento de los lectores
                    </p>
                  </div>

                  {/* Tarjeta del ganador - VERTICAL Y COMPACTA */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 p-8 mb-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center text-center">
                      {/* Corona y posición */}
                      <div className="mb-6">
                        <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
                          <span className="text-5xl">👑</span>
                        </div>
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg">
                          🏆 GANADOR
                        </div>
                      </div>

                      {/* Título de la historia */}
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight max-w-lg">
                        "{lastContestWinners.winners[0].title}"
                      </h3>

                      {/* Autor */}
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <UserAvatar
                          user={{
                            name: lastContestWinners.winners[0].author,
                            email: `${lastContestWinners.winners[0].author}@mock.com`,
                          }}
                          size="lg"
                        />
                        <div className="text-left">
                          <div className="text-xl font-bold text-gray-900 mb-1">
                            <UserWithWinnerBadges
                              userId={lastContestWinners.winners[0].user_id}
                              userName={lastContestWinners.winners[0].author}
                            />
                          </div>
                          <p className="text-indigo-600 font-semibold">
                            🌟 Autor destacado del mes
                          </p>
                        </div>
                      </div>

                      {/* Estadísticas */}
                      <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-full">
                          <Heart className="h-5 w-5 text-red-500" />
                          <span className="font-bold text-gray-800">
                            {lastContestWinners.winners[0].likes_count || 0}{" "}
                            votos
                          </span>
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full">
                          <span className="font-semibold text-indigo-700 text-sm">
                            {lastContestWinners.contest.title}
                          </span>
                        </div>
                      </div>

                      {/* Botón principal */}
                      <Link
                        to={`/story/${lastContestWinners.winners[0].id}`}
                        className="inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                      >
                        <BookOpen className="h-5 w-5 mr-3" />
                        Leer la historia ganadora
                        <ArrowRight className="h-5 w-5 ml-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Sección motivacional */}
                  <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-100 p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      ¡Podrías ser el próximo ganador!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Únete al concurso actual y demuestra tu talento. Tu
                      historia podría ser la próxima en brillar.
                    </p>
                    <Link
                      to="/contest/current"
                      className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      Participar ahora
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>

                  {/* Mini-mención discreta de otros lugares */}
                  {lastContestWinners.winners.length > 1 && (
                    <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
                      <p className="mb-2">
                        También destacaron en este concurso:
                      </p>
                      <div className="flex items-center justify-center gap-6 text-xs">
                        {lastContestWinners.winners
                          .slice(1, 3)
                          .map((story, index) => (
                            <Link
                              key={story.id}
                              to={`/story/${story.id}`}
                              className="hover:text-indigo-600 transition-colors duration-200"
                            >
                              <span className="font-medium">
                                {index === 0 ? "🥈" : "🥉"} {story.author}
                              </span>
                              <span className="text-gray-400 ml-1">
                                - "{story.title}"
                              </span>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/contest-history"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 hover:border-purple-300 hover:shadow-lg transition-all duration-300 shadow-sm"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Ver historial completo de concursos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Explicación del flujo del concurso - Modernizada */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              ¿Cómo funciona el concurso?
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600">
              Un proceso simple y divertido para participar en nuestra comunidad
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 hover:border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <PenTool className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                1. Escribe tu historia
              </h3>
              <p className="text-gray-600 md:text-lg lg:text-xl mb-3">
                Usa el prompt mensual como quieras: síguelo exactamente,
                reinterpretalo o úsalo como inspiración.
              </p>
              <p className="text-sm text-gray-500 font-medium">
                ✨ Total libertad creativa
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-purple-100 hover:border-pink-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                2. Vota por tus favoritas
              </h3>
              <p className="text-gray-600 md:text-lg lg:text-xl">
                Cuando termine el periodo de envío, podrás leer, votar y
                comentar por las historias que más te gusten.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-pink-100 hover:border-indigo-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                3. Descubre los ganadores
              </h3>
              <p className="text-gray-600 md:text-lg lg:text-xl">
                Al finalizar la votación, se celebran las historias más votadas
                con menciones especiales e insignias destacadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Original */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Más que una plataforma, somos una comunidad
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600">
              Donde cada historia importa y cada escritor encuentra su lugar
            </p>
          </div>

          {/* Mobile: Prompt destacado primero */}
          <div className="block md:hidden mb-12">
            {currentContest && (
              <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-1 rounded-2xl shadow-xl">
                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <PenTool className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Prompt del mes
                  </h3>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                    "{currentContest.title}"
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {currentContest.description}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                    <Clock className="h-3 w-3 mr-1" />
                    Cierre: {timeLeft}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Grid original, Mobile: Solo las 2 features más importantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 - Siempre visible */}
            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 hover:border-purple-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                <PenTool className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4 tracking-tight">
                Concursos Mensuales
              </h3>
              <p className="text-sm md:text-lg lg:text-xl text-gray-600">
                Participa en desafíos creativos cada mes. Nuevos escenarios,
                situaciones y conceptos para explorar con tu escritura.
              </p>
            </div>

            {/* Feature 2 - Siempre visible */}
            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-purple-100 hover:border-pink-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4 tracking-tight">
                Comunidad Activa
              </h3>
              <p className="text-sm md:text-lg lg:text-xl text-gray-600">
                Conecta con otros escritores, recibe feedback constructivo y haz
                crecer tu audiencia.
              </p>
            </div>

            {/* Feature 3 - Solo visible en lg+ */}
            <div className="hidden lg:block bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-pink-100 hover:border-indigo-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                Badges y Reconocimiento
              </h3>
              <p className="text-lg lg:text-xl text-gray-600">
                Consigue badges únicos por escribir, ganar concursos y
                participar. ¡Muestra tus logros y motiva a otros!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Derechos de Autor */}
      <section className="py-12 lg:py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Tu obra, tus derechos
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
              En Letranido, tu creatividad está completamente protegida.
              Mantienes todos los derechos sobre tus historias.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-indigo-100 hover:border-purple-200 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Copyright className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                    Derechos completos
                  </h3>
                  <p className="text-gray-600 md:text-lg lg:text-xl">
                    Mantienes todos los derechos de autor sobre tus historias.
                    Son tuyas y siempre lo serán.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 hover:border-pink-200 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                    Protección total
                  </h3>
                  <p className="text-gray-600 md:text-lg lg:text-xl">
                    Nadie puede republicar, copiar o usar tu historia sin tu
                    permiso expreso.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-pink-100 hover:border-indigo-200 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-indigo-200 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Users className="h-8 w-8 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                    Solo la plataforma
                  </h3>
                  <p className="text-gray-600 md:text-lg lg:text-xl">
                    Letranido solo proporciona el espacio para compartir. Tu
                    trabajo es completamente tuyo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm md:text-base lg:text-lg text-gray-500 max-w-3xl mx-auto">
              Al participar en Letranido, solo nos das permiso para mostrar tu
              historia en la plataforma durante los concursos. Puedes retirar tu
              obra cuando quieras y usarla libremente en cualquier otro lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Badges - Movida aquí */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl"></div>
          <div className="absolute top-32 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full mb-6 shadow-xl">
              <Trophy className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Sistema de Badges
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              Colecciona badges únicos que celebran tu crecimiento como escritor
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Badge de Escritura */}
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 hover:border-purple-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <PenTool className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Badges de Escritura
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Primera Pluma, Escritor Constante, Veterano
                </p>
                <div className="flex justify-center space-x-1">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Badge de Ganador */}
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-purple-100 hover:border-pink-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Badges de Victoria
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Ganador, Finalista, Veterano Ganador
                </p>
                <div className="flex justify-center space-x-1">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-pink-100 hover:border-indigo-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Notificaciones
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Te avisamos cuando consigas un nuevo badge
                </p>
                <div className="flex justify-center">
                  <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                    ¡Nuevo badge!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA motivacional */}
          <div className="text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-8 border border-indigo-200 shadow-xl">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              ¡Empieza tu colección de badges hoy!
            </h3>
            <p className="text-gray-700 mb-6 text-lg">
              Tu primera historia te dará el badge "Primera Pluma". ¿Qué
              esperas?
            </p>
            <Link
              to="/write/:promptId?"
              className="inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Trophy className="h-5 w-5 mr-3" />
              Conseguir mi primer badge
              <ArrowRight className="h-5 w-5 ml-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Modal de reglas */}
      <ContestRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        contest={currentContest}
      />
    </div>
  );
};

export default LandingPage;
