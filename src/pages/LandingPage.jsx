import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Clock,
  Trophy,
  Users,
  ArrowRight,
  Star,
  Calendar,
  Loader,
} from "lucide-react";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import { useContests } from "../hooks/useContests";
import { useStories } from "../hooks/useStories";

const LandingPage = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [featuredTexts, setFeaturedTexts] = useState([]);
  const [totalStats, setTotalStats] = useState({
    writers: 0,
    texts: 0,
    contests: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Hooks
  const {
    currentContest,
    contests,
    loading: contestLoading,
    getContestPhase,
  } = useContests();
  const { getStoriesByContest, getStoriesForGallery } = useStories();

  // Calcular la fase actual
  const currentPhase = currentContest ? getContestPhase(currentContest) : null;

  // Countdown timer
  useEffect(() => {
    if (!currentContest) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();

      // Determinar fecha objetivo según la fase
      let targetDate;
      if (currentPhase === "submission") {
        targetDate = new Date(currentContest.submission_deadline).getTime();
      } else if (currentPhase === "voting") {
        targetDate = new Date(currentContest.voting_deadline).getTime();
      } else {
        // Fase de resultados - no mostrar countdown
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [currentContest, currentPhase]);

  // Cargar historias ganadoras del mes anterior
  useEffect(() => {
    const loadFeaturedTexts = async () => {
      try {
        // SOLO buscar concursos que ya terminaron completamente (status = "results")
        const finishedContests = contests.filter(
          (contest) =>
            contest.status === "results" && contest.id !== currentContest?.id
        );

        if (finishedContests.length > 0) {
          // Obtener el concurso más reciente que ya terminó
          const mostRecentFinished = finishedContests.sort(
            (a, b) => new Date(b.voting_deadline) - new Date(a.voting_deadline)
          )[0];

          const result = await getStoriesByContest(mostRecentFinished.id);
          if (result.success && result.stories.length > 0) {
            // Ordenar por likes y tomar los 3 primeros
            const topStories = result.stories
              .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
              .slice(0, 3)
              .map((story, index) => ({
                id: story.id,
                title: story.title,
                author: story.user_profiles?.display_name || "Usuario",
                excerpt:
                  story.content?.substring(0, 150) + "..." ||
                  "Sin contenido disponible",
                likes: story.likes_count || 0,
                category: story.contests?.category || "Ficción",
                contestMonth: story.contests?.month || "Concurso anterior",
              }));

            setFeaturedTexts(topStories);
          }
        } else {
          // Si no hay concursos terminados, no mostrar historias
          console.log(
            "ℹ️ No hay concursos terminados para mostrar historias destacadas"
          );
          setFeaturedTexts([]);
        }
      } catch (error) {
        console.error("Error loading featured texts:", error);
        setFeaturedTexts([]);
      }
    };

    if (contests.length > 0) {
      loadFeaturedTexts();
    }
  }, [contests, currentContest, getStoriesByContest]);

  // Cargar estadísticas totales
  useEffect(() => {
    const loadTotalStats = async () => {
      try {
        setLoadingStats(true);

        // Obtener todas las historias para contar escritores únicos y total de historias
        const result = await getStoriesForGallery({});

        if (result.success) {
          const stories = result.stories;
          const uniqueWriters = new Set(stories.map((story) => story.authorId))
            .size;

          setTotalStats({
            writers: uniqueWriters,
            texts: stories.length,
            contests: contests.length,
          });
        }
      } catch (error) {
        console.error("Error loading stats:", error);
        // Mantener estadísticas por defecto en caso de error
        setTotalStats({
          writers: 0,
          texts: 0,
          contests: contests.length,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (contests.length > 0) {
      loadTotalStats();
    }
  }, [contests, getStoriesForGallery]);

  // Texto del estado actual del concurso
  const getCurrentContestStatus = () => {
    if (!currentContest) return "No hay concurso activo";

    switch (currentPhase) {
      case "submission":
        return "Actualmente en: Fase de Envío";
      case "voting":
        return "Actualmente en: Fase de Votación";
      case "results":
        return "Concurso finalizado - Ver resultados";
      default:
        return "Estado del concurso: Desconocido";
    }
  };

  // Texto del botón principal
  const getMainButtonText = () => {
    if (!currentContest) return "Ver concursos";

    switch (currentPhase) {
      case "submission":
        return "Participar en el concurso";
      case "voting":
        return "Ver participaciones y votar";
      case "results":
        return "Ver resultados finales";
      default:
        return "Ver concurso";
    }
  };

  // URL del botón principal
  const getMainButtonHref = () => {
    if (!currentContest) return "/contest/current";

    switch (currentPhase) {
      case "submission":
        return `/write/${currentContest.id}`;
      case "voting":
      case "results":
        return "/contest/current";
      default:
        return "/contest/current";
    }
  };

  if (contestLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Libera tu
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                {" "}
                creatividad
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Únete a una comunidad de escritores apasionados. Recibe prompts
              mensuales, comparte tus historias y descubre nuevos talentos
              literarios.
            </p>

            {/* Current Contest Card */}
            {currentContest ? (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">
                  {/* Contest badge */}
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-bl-lg font-bold text-sm">
                    🏆 CONCURSO MENSUAL
                  </div>

                  <div className="flex items-center justify-between mb-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {currentContest.month}
                      </span>
                      <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
                        {currentContest.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Premio</div>
                      <div className="text-sm font-medium text-yellow-600">
                        {currentContest.prize ||
                          "Insignia de Oro + Destacado del mes"}
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {currentContest.title}
                  </h2>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {currentContest.description}
                  </p>

                  {/* Countdown Timer - Solo en fases activas */}
                  {currentPhase !== "results" && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-semibold text-red-800">
                          {currentPhase === "submission"
                            ? "¡El concurso cierra en:"
                            : "¡La votación cierra en:"}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2 border">
                          <div className="text-2xl font-bold text-red-600">
                            {timeLeft.days}
                          </div>
                          <div className="text-xs text-gray-600">Días</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border">
                          <div className="text-2xl font-bold text-red-600">
                            {timeLeft.hours}
                          </div>
                          <div className="text-xs text-gray-600">Horas</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border">
                          <div className="text-2xl font-bold text-red-600">
                            {timeLeft.minutes}
                          </div>
                          <div className="text-xs text-gray-600">Min</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border">
                          <div className="text-2xl font-bold text-red-600">
                            {timeLeft.seconds}
                          </div>
                          <div className="text-xs text-gray-600">Seg</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {currentContest.participants_count || 0} participantes
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Hasta{" "}
                      {new Date(
                        currentContest.voting_deadline ||
                          currentContest.end_date
                      ).toLocaleDateString("es-ES")}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      to={getMainButtonHref()}
                      className={`btn-primary flex items-center justify-center text-lg py-3 ${
                        currentPhase === "submission" ? "animate-pulse" : ""
                      }`}
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      {getMainButtonText()}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>

                    <Link
                      to="/contest/current"
                      className="btn-secondary flex items-center justify-center text-lg py-3 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Ver participaciones
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    No hay concurso activo
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Pronto habrá un nuevo concurso. ¡Mantente atento!
                  </p>
                  <Link
                    to="/contest/current"
                    className="btn-secondary inline-flex items-center"
                  >
                    Ver concursos anteriores
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {loadingStats ? (
                    <Loader className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    totalStats.writers.toLocaleString()
                  )}
                </div>
                <div className="text-gray-600">Escritores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {loadingStats ? (
                    <Loader className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    totalStats.texts.toLocaleString()
                  )}
                </div>
                <div className="text-gray-600">Historias</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {loadingStats ? (
                    <Loader className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    totalStats.contests
                  )}
                </div>
                <div className="text-gray-600">Concursos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline del concurso */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona el concurso?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nuestro sistema de fases garantiza que todos los participantes
              tengan las mismas oportunidades de ganar, sin importar cuándo
              envíen su historia.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Línea de tiempo */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200"></div>

              <div className="space-y-12">
                {/* Fase 1: Envío */}
                <div className="relative flex items-center">
                  <div className="flex-1 pr-8 text-right">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <h3 className="text-xl font-bold text-blue-900">
                          Fase de Envío
                        </h3>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            1
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-800 font-medium mb-2">
                        📅 Durante todo el mes
                      </div>
                      <p className="text-blue-700 text-sm mb-3">
                        Los escritores envían sus historias basadas en el prompt
                        del mes. Todas las historias son visibles desde el
                        primer día.
                      </p>
                      <div className="flex items-center justify-end gap-2 text-sm text-blue-600">
                        <span>📝 Escribir historia</span>
                        <span>•</span>
                        <span>👀 Leer otras historias</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white z-10"></div>

                  <div className="flex-1 pl-8"></div>
                </div>

                {/* Fase 2: Votación */}
                <div className="relative flex items-center">
                  <div className="flex-1 pr-8"></div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white z-10"></div>

                  <div className="flex-1 pl-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            2
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-green-900">
                          Fase de Votación
                        </h3>
                      </div>
                      <div className="text-green-800 font-medium mb-2">
                        📅 Durante todo el concurso
                      </div>
                      <p className="text-green-700 text-sm mb-3">
                        Los usuarios pueden votar por sus historias favoritas
                        dando likes. La votación está abierta desde el primer
                        día hasta el cierre.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <span>❤️ Dar likes</span>
                        <span>•</span>
                        <span>📖 Leer y descubrir</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fase 3: Resultados */}
                <div className="relative flex items-center">
                  <div className="flex-1 pr-8 text-right">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <h3 className="text-xl font-bold text-yellow-900">
                          Resultados
                        </h3>
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            3
                          </span>
                        </div>
                      </div>
                      <div className="text-yellow-800 font-medium mb-2">
                        📅 Al cierre del concurso
                      </div>
                      <p className="text-yellow-700 text-sm mb-3">
                        Se anuncian los ganadores automáticamente. Los tres
                        primeros lugares reciben insignias especiales y
                        reconocimiento.
                      </p>
                      <div className="flex items-center justify-end gap-2 text-sm text-yellow-600">
                        <span>🏆 Ganadores</span>
                        <span>•</span>
                        <span>🎖️ Insignias</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full border-4 border-white z-10"></div>

                  <div className="flex-1 pl-8"></div>
                </div>
              </div>
            </div>

            {/* Estado actual */}
            {currentContest && (
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200 rounded-lg px-6 py-3">
                  <div
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      currentPhase === "submission"
                        ? "bg-blue-500"
                        : currentPhase === "voting"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  ></div>
                  <span className="font-medium text-gray-800">
                    {getCurrentContestStatus()}
                    {currentPhase !== "results" && timeLeft.days > 0 && (
                      <> • Cierra en {timeLeft.days} días</>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Stories Section o Launch Section */}
      {featuredTexts.length > 0 ? (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ganadores del concurso anterior
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Descubre las historias ganadoras de concursos pasados y
                encuentra inspiración para tu próxima creación
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredTexts.map((text, index) => (
                <div
                  key={text.id}
                  className="card hover:shadow-md transition-shadow relative cursor-pointer p-4 rounded-2xl shadow-accent-500 bg-white border border-gray-200"
                >
                  {/* Winner badges */}
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full p-2 shadow-lg">
                      <Trophy className="h-4 w-4" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-full p-2 shadow-lg">
                      <Star className="h-4 w-4" />
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full p-2 shadow-lg">
                      <Star className="h-4 w-4" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {text.category}
                      </span>
                      {index === 0 && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                          🥇 MÁS POPULAR
                        </span>
                      )}
                      {index === 1 && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                          🥈 2º LUGAR
                        </span>
                      )}
                      {index === 2 && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                          🥉 3º LUGAR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                      {text.likes}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {text.title}
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {text.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      por <span className="font-medium">{text.author}</span>
                    </span>
                    <Link
                      to={`/story/${text.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Leer completa →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/contest/current"
                className="btn-secondary inline-flex items-center"
              >
                Ver todas las historias
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* Launch Section - Para cuando no hay historias previas */
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 ¡Bienvenido al lanzamiento de LiteraLab!
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Eres parte de los primeros escritores en unirse a nuestra
                comunidad. ¡Tu historia podría ser la primera en hacer historia!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Invitation Cards */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PenTool className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Sé el primero
                </h3>
                <p className="text-gray-600 mb-6">
                  Tu historia podría ser la primera en ganar un concurso en
                  LiteraLab. ¡Haz historia siendo pionero!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium">
                    🏆 Reconocimiento especial para los fundadores
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Forma la comunidad
                </h3>
                <p className="text-gray-600 mb-6">
                  Ayuda a establecer el tono y la calidad de nuestra comunidad
                  de escritores. Tu participación importa.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-medium">
                    🌱 Badge exclusivo de "Fundador"
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Inspiración pura
                </h3>
                <p className="text-gray-600 mb-6">
                  Sin historias previas que te condicionen. Solo tú, el prompt y
                  tu creatividad sin límites.
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-purple-800 text-sm font-medium">
                    ✨ Libertad creativa total
                  </p>
                </div>
              </div>
            </div>

            {/* Stats for Launch */}
            <div className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  El futuro de LiteraLab comienza contigo
                </h3>
                <p className="text-gray-600">
                  Estos serán los primeros números de nuestra comunidad
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {currentContest?.participants_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    Pioneros inscritos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    1
                  </div>
                  <div className="text-sm text-gray-600">Primer concurso</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">∞</div>
                  <div className="text-sm text-gray-600">Posibilidades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    🚀
                  </div>
                  <div className="text-sm text-gray-600">Lanzamiento</div>
                </div>
              </div>

              {currentContest && (
                <div className="text-center mt-8">
                  <Link
                    to={getMainButtonHref()}
                    className="btn-primary inline-flex items-center px-8 py-3 text-lg"
                  >
                    <PenTool className="h-5 w-5 mr-2" />
                    ¡Ser parte de la historia!
                  </Link>
                </div>
              )}
            </div>

            {/* Testimonials placeholder for future */}
            <div className="mt-16 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ¿Qué dicen nuestros primeros escritores?
              </h3>
              <p className="text-gray-500 italic">
                "Pronto aquí aparecerán las primeras reseñas de nuestra
                increíble comunidad..."
              </p>
              <div className="mt-6">
                <Link
                  to="/contest/current"
                  className="btn-secondary inline-flex items-center"
                >
                  Únete al primer concurso
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {currentContest && (
        <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {currentPhase === "results"
                ? `¡Felicitaciones a todos los participantes de ${currentContest.month}!`
                : `¿Listo para ${
                    currentPhase === "submission" ? "participar en" : "votar en"
                  } el concurso de ${currentContest.month}?`}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {currentPhase === "results"
                ? "Gracias por hacer de este concurso un éxito. ¡Nos vemos en el próximo!"
                : `${
                    currentPhase === "voting"
                      ? "Lee las historias y vota por tus favoritas"
                      : `Únete a ${
                          currentContest.participants_count || 0
                        } escritores que ya están compitiendo por la gloria literaria`
                  }`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {currentPhase !== "results" && (
                <Link
                  to={getMainButtonHref()}
                  className="bg-white text-primary-600 hover:bg-gray-50 font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
                >
                  <PenTool className="h-5 w-5 mr-2" />
                  {currentPhase === "submission"
                    ? "Participar ahora"
                    : "Ver y votar"}
                </Link>
              )}
              <button
                onClick={() => setShowRulesModal(true)}
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold py-3 px-8 rounded-lg transition-colors"
              >
                Ver las reglas
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Contest Rules Modal */}
      {showRulesModal && currentContest && (
        <ContestRulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          contest={{
            ...currentContest,
            endDate: new Date(
              currentContest.voting_deadline || currentContest.end_date
            ),
          }}
        />
      )}
    </div>
  );
};

export default LandingPage;
