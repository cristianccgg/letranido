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
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { supabase } from "../lib/supabase"; // 👈 Agrega este import
import ContestActionButton from "../components/ui/ContestActionButton";
import ContestPhaseBadge from "../components/ui/ContestPhaseBadge";
import ContestRulesModal from "../components/forms/ContestRulesModal";

const LandingPage = () => {
  const {
    // Contest state
    currentContest,
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

  // ✅ LOADING STATE
  if (globalLoading || contestsLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Cargando LiteraLab...</p>
        </div>
      </div>
    );
  }

  // Estado para mostrar el modal de reglas
  const [showRulesModal, setShowRulesModal] = useState(false);

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
      {/* Hero Section - Minimalista */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
            LiteraLab
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8">
            Escribe con nosotros, mejora, gana y haz parte de una comunidad
            creativa. Un prompt. Un límite. Una historia. ¿Aceptas el reto?
          </p>
          {currentContest && (
            <div className="w-full flex flex-col items-center gap-6">
              {/* Prompt destacado */}
              <div className="bg-white/10 rounded-xl px-6 py-4 mb-2 w-full">
                <span className="text-sm text-primary-200">Prompt actual</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-2 mb-1">
                  {currentContest.title}
                </h2>
                <p className="text-primary-100 text-base">
                  {currentContest.description}
                </p>
              </div>
              {/* Contador llamativo */}
              <div className="bg-white/20 rounded-xl px-8 py-6 mb-2 flex flex-col items-center shadow-lg">
                <span className="text-sm text-primary-200 mb-2">
                  Cierre de envíos en
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-8 w-8 text-primary-100" />
                  <span className="text-3xl md:text-4xl font-bold text-white tracking-wide">
                    {timeLeft}
                  </span>
                </div>
                {/* Aclaración de zona horaria */}
                <div className="mt-2 text-xs text-primary-100">
                  {currentContest?.submission_deadline &&
                    `La fase de envíos cierra el ${new Date(
                      currentContest.submission_deadline
                    ).toLocaleString("es-CO", {
                      timeZone: "America/Bogota",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })} (GMT-5)`}
                </div>
              </div>
              {/* Botones principales */}
              <div className="flex flex-col md:flex-row gap-3 justify-center items-center mt-4">
                <ContestActionButton
                  variant="primary"
                  size="large"
                  showDescription={false}
                />
                {secondaryButton && (
                  <Link
                    to={secondaryButton.href}
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary-700 font-semibold shadow hover:bg-primary-50 transition-colors"
                  >
                    <secondaryButton.icon className="h-5 w-5 mr-2" />
                    {secondaryButton.text}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="inline-flex cursor-pointer items-center px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 transition-colors"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Ver reglas
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Estadísticas - separadas y limpias */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">
                {stats.totalParticipants}+
              </div>
              <div className="text-gray-500">Escritores participando</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">
                {stats.totalStories}+
              </div>
              <div className="text-gray-500">Historias publicadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">
                {stats.totalWords.toLocaleString()}+
              </div>
              <div className="text-gray-500">Palabras escritas</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🆕 GANADORES DEL CONCURSO ANTERIOR */}
      {lastContestWinners && !loadingWinners && (
        <section className="py-12 bg-gradient-to-b from-yellow-50 to-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                Ganadores de {lastContestWinners.contest.month}
              </h2>
              <p className="text-gray-600">
                "{lastContestWinners.contest.title}"
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {lastContestWinners.winners.map((story, index) => (
                <div
                  key={story.id}
                  className={`p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform ${
                    index === 0
                      ? "bg-gradient-to-b from-yellow-100 to-yellow-50 border-2 border-yellow-300"
                      : index === 1
                      ? "bg-gradient-to-b from-gray-100 to-gray-50 border-2 border-gray-300"
                      : "bg-gradient-to-b from-orange-100 to-orange-50 border-2 border-orange-300"
                  }`}
                >
                  <div className="text-center mb-4">
                    {index === 0 ? (
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 text-white rounded-full text-2xl font-bold mb-2">
                        🥇
                      </div>
                    ) : index === 1 ? (
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-500 text-white rounded-full text-2xl font-bold mb-2">
                        🥈
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full text-2xl font-bold mb-2">
                        🥉
                      </div>
                    )}
                    <div className="font-bold text-lg">
                      {index === 0 ? "1º" : index === 1 ? "2º" : "3º"} Lugar
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 text-center line-clamp-2">
                    {story.title}
                  </h3>

                  <p className="text-sm text-gray-600 text-center mb-3">
                    por {story.author}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-red-600 text-sm">
                      ❤️ {story.likes_count || 0}
                    </span>
                    <Link
                      to={`/story/${story.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Leer →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/contest-history"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver historial completo de concursos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Explicación del flujo del concurso */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Cómo funciona el concurso?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <PenTool className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">
                1. Escribe tu historia
              </h3>
              <p className="text-gray-600 text-sm">
                Lee el prompt, escribe tu historia y envíala antes del cierre.
              </p>
            </div>
            <div>
              <Heart className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">
                2. Vota por tus favoritas
              </h3>
              <p className="text-gray-600 text-sm">
                Cuando termine el periodo de envío, podrás leer y votar por las
                historias.
              </p>
            </div>
            <div>
              <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">
                3. Descubre los ganadores
              </h3>
              <p className="text-gray-600 text-sm">
                Al finalizar la votación, se anuncian los ganadores y se otorgan
                premios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - MANTENER */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir LiteraLab?
            </h2>
            <p className="text-xl text-gray-600">
              La plataforma perfecta para escritores creativos de todos los
              niveles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PenTool className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Concursos Mensuales
              </h3>
              <p className="text-gray-600">
                Participa en desafíos creativos cada mes. Nuevos prompts, nuevas
                oportunidades de brillar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Comunidad Activa
              </h3>
              <p className="text-gray-600">
                Conecta con otros escritores, recibe feedback constructivo y haz
                crecer tu audiencia.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Sistema de Reconocimiento
              </h3>
              <p className="text-gray-600">
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
