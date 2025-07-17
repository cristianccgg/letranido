// pages/LandingPage.jsx - VERSIÓN CORREGIDA SIN HISTORIAS
import { useState, useEffect } from "react";
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
  Zap,
  TrendingUp,
  Heart,
  BookOpen,
  Loader,
  Shield,
  Copyright,
  Lock,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { supabase } from "../lib/supabase"; // 👈 Agrega este import
import ContestActionButton from "../components/ui/ContestActionButton";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import UserAvatar from "../components/ui/UserAvatar";
import NextContestPreview from "../components/ui/NextContestPreview";
import NewsletterSignup from "../components/ui/NewsletterSignup";

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
    totalParticipants: 0,
    totalStories: 0,
    totalWords: 0, // Cambiado de totalLikes a totalWords
  });

  // 🆕 ESTADO PARA GANADORES DEL CONCURSO ANTERIOR
  const [lastContestWinners, setLastContestWinners] = useState(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // ✅ CARGAR SOLO ESTADÍSTICAS BÁSICAS
  useEffect(() => {
    const loadBasicStats = async () => {
      if (!initialized) return;

      try {
        // Solo estadísticas del concurso actual
        if (currentContest) {
          // Obtener el total de palabras de todas las historias enviadas
          let totalWords = 0;
          try {
            const { data: stories, error } = await supabase // 👈 Usa supabase importado
              .from("stories")
              .select("word_count")
              .eq("contest_id", currentContest.id);

            if (!error && stories && stories.length > 0) {
              totalWords = stories.reduce(
                (acc, story) => acc + (story.word_count || 0),
                0
              );
            }
          } catch (err) {
            console.error("Error cargando total de palabras:", err);
          }

          setStats({
            totalParticipants: currentContest.participants_count || 0,
            totalStories: currentContest.participants_count || 0,
            totalWords, // Nuevo campo
          });
        }
      } catch (error) {
        console.error("Error cargando stats básicas:", error);
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

  // Contador de tiempo restante para cierre de submissions (con segundos)
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!currentContest?.submission_deadline) {
      setTimeLeft("");
      return;
    }
    const updateTime = () => {
      const now = new Date();
      const deadline = new Date(currentContest.submission_deadline);
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
    const interval = setInterval(updateTime, 1000); // 👈 cada segundo
    return () => clearInterval(interval);
  }, [currentContest?.submission_deadline]);

  // Estado para mostrar el modal de reglas
  const [showRulesModal, setShowRulesModal] = useState(false);

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

  // Configuración del segundo botón según la fase
  const getSecondaryButton = () => {
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
        icon: Heart,
      };
    }
    // No mostrar en results
    return null;
  };

  const secondaryButton = getSecondaryButton();

  return (
    <div className="min-h-screen">
      {/* Hero Section - Elegante y moderno */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Elementos decorativos modernos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl"></div>
          <div className="absolute top-32 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg animate-pulse"></div>
          <div className="absolute bottom-32 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-8 blur-2xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16 lg:pt-20 lg:pb-8 text-center">
          {/* Logo/Título con más personalidad */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-2 tracking-tight">
              Letranido
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto shadow-lg"></div>
          </div>

          {/* Subtítulo con mejor tipografía */}
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto font-medium leading-relaxed tracking-wide">
            Crea historias increíbles. Recibe feedback valioso. Ayuda a otros a
            brillar.{" "}
            <span className="text-indigo-600 tracking-wide">
              Crece como escritor en comunidad.
            </span>
          </p>

          {currentContest && (
            <div className="space-y-6">
              {/* Prompt en card con más personalidad */}
              <div className="bg-white/95 backdrop-blur-md border-2 border-indigo-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-300">
                <div className="mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    Concurso de {currentContest.month}
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
                  {currentContest.title}
                </h2>

                <p className="text-gray-700 md:text-lg lg:text-xl mb-6 leading-relaxed">
                  {currentContest.description}
                </p>

                {/* Contador con más estilo */}
                <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-xl p-4 inline-flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm md:text-base lg:text-lg text-indigo-700 font-medium block tracking-wide">
                      Cierre en
                    </span>
                    <span className="text-xl md:text-2xl lg:text-3xl font-bold text-indigo-900 tracking-tight">
                      {timeLeft}
                    </span>
                  </div>
                </div>
              </div>

              {/* Siguiente concurso preview */}
              <NextContestPreview
                nextContest={nextContest}
                currentContest={currentContest}
              />

              {/* Botones con más estilo */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <ContestActionButton
                  variant="primary"
                  size="large"
                  showDescription={false}
                  className="w-full"
                />

                {secondaryButton && (
                  <Link
                    to={secondaryButton.href}
                    className="inline-flex w-full items-center justify-center px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-lg transition-all duration-300 shadow-sm hover:scale-105"
                  >
                    <secondaryButton.icon className="h-5 w-5 mr-2" />
                    {secondaryButton.text}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="inline-flex w-full cursor-pointer items-center justify-center px-6 py-3 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 hover:shadow-lg transition-all duration-300 shadow-sm hover:scale-105"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Ver reglas
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Estadísticas - modernas y elegantes */}
      <section className="py-8 lg:py-12 bg-gradient-to-r from-slate-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-indigo-100 hover:border-purple-200">
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {stats.totalParticipants}
              </div>
              <div className="text-gray-600 md:text-lg lg:text-xl font-medium">
                Escritores participando
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {stats.totalStories}
              </div>
              <div className="text-gray-600 md:text-lg lg:text-xl font-medium">
                Historias publicadas
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {stats.totalWords.toLocaleString()}
              </div>
              <div className="text-gray-600 md:text-lg lg:text-xl font-medium">
                Palabras escritas
              </div>
            </div>
          </div>
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
                      Su historia brilló entre todas las demás y se llevó el reconocimiento de los lectores
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
                          <p className="text-xl font-bold text-gray-900">
                            {lastContestWinners.winners[0].author}
                          </p>
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
                            {lastContestWinners.winners[0].likes_count || 0} votos
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
                      Únete al concurso actual y demuestra tu talento. Tu historia podría ser la próxima en brillar.
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
                      <p className="mb-2">También destacaron en este concurso:</p>
                      <div className="flex items-center justify-center gap-6 text-xs">
                        {lastContestWinners.winners.slice(1, 3).map((story, index) => (
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
              <p className="text-gray-600 md:text-lg lg:text-xl">
                Lee el prompt, escribe tu historia y envíala antes del cierre.
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
                Cuando termine el periodo de envío, podrás leer y votar por las
                historias.
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

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Features Section - Modernizada */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              ¿Por qué elegir Letranido?
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600">
              La plataforma perfecta para escritores creativos de todos los
              niveles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-100 hover:border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <PenTool className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                Concursos Mensuales
              </h3>
              <p className="text-gray-600 md:text-lg lg:text-xl">
                Participa en desafíos creativos cada mes. Nuevos prompts, nuevas
                oportunidades de brillar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-purple-100 hover:border-pink-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                Comunidad Activa
              </h3>
              <p className="text-gray-600 md:text-lg lg:text-xl">
                Conecta con otros escritores, recibe feedback constructivo y haz
                crecer tu audiencia.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-pink-100 hover:border-indigo-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                Sistema de Reconocimiento
              </h3>
              <p className="text-gray-600 md:text-lg lg:text-xl">
                Gana badges especiales, reconocimiento y construye tu reputación
                como escritor.
              </p>
            </div>
          </div>
        </div>
      </section>

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
