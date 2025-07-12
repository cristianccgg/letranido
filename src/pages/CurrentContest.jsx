// pages/CurrentContest.jsx - VERSIÓN CORREGIDA Y LIMPIA
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  PenTool,
  Calendar,
  Users,
  Clock,
  Star,
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
  User,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { useBadgeNotifications } from "../contexts/BadgeNotificationContext";
import VotingGuidance from "../components/voting/VotingGuidance";
import AuthModal from "../components/forms/AuthModal";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import ContestActionButton from "../components/ui/ContestActionButton";

const CurrentContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ TODO DESDE EL CONTEXTO GLOBAL
  const {
    user,
    isAuthenticated,
    currentContest,
    currentContestPhase,
    contests,
    contestsLoading,
    galleryStories,
    galleryLoading,
    votingStats,
    votingStatsLoading,
    initialized,
    globalLoading,
    getContestById,
    getStoriesByContest,
    refreshContests,
    refreshUserData,
    toggleLike,
    getContestPhase,
  } = useGlobalApp();

  const { checkFirstStoryBadge } = useBadgeNotifications();

  // ✅ LOCAL STATE PARA CURRENTCONTEST (DIFERENTE DE GALLERY)
  const [contest, setContest] = useState(null);
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Refs para scroll
  const storiesSectionRef = useRef(null);

  // ✅ DETERMINAR QUE CONCURSO MOSTRAR
  const contestToLoad = id || currentContest?.id;

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
      
      // Reset loading state al iniciar
      setStoriesLoading(true);
      setError(null);

      try {
        console.log("🏆 Cargando datos del concurso:", contestToLoad);

        let contestData;

        // 1. Obtener datos del concurso
        if (contestToLoad) {
          try {
            contestData = await getContestById(contestToLoad);
          } catch (err) {
            console.error("❌ Error obteniendo concurso:", err);
            setError("Concurso no encontrado");
            setContest(null);
            setStories([]);
            return;
          }
        } else {
          if (contests.length > 0) {
            contestData = contests[0];
          } else {
            setError("No hay concursos disponibles");
            setContest(null);
            setStories([]);
            return;
          }
        }

        setContest(contestData);
        console.log("✅ Concurso cargado:", contestData.title);

        // 2. Cargar historias (siempre, pero determinar visibilidad después)
        const storiesResult = await getStoriesByContest(contestData.id);

        if (storiesResult.success) {
          console.log("✅ Historias cargadas:", storiesResult.stories.length);
          setStories(storiesResult.stories);
        } else {
          console.error("❌ Error cargando historias:", storiesResult.error);
          setError("Error al cargar las historias: " + storiesResult.error);
          setStories([]);
        }
      } catch (err) {
        console.error("💥 Error general cargando concurso:", err);
        setError("Error inesperado: " + err.message);
        setContest(null);
        setStories([]);
      } finally {
        setStoriesLoading(false);
      }
    };

    loadContestData();
  }, [
    contestToLoad,
    initialized,
    // Removidas las funciones que no cambian para evitar re-renders
  ]);

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
  }, [stories.length]);

  // ✅ REFRESH COMPLETO
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshContests(), refreshUserData()]);

      if (contest?.id) {
        const storiesResult = await getStoriesByContest(contest.id);
        if (storiesResult.success) {
          setStories(storiesResult.stories);
        }
      }
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ HANDLE VOTE OPTIMIZADO - ACTUALIZACION OPTIMISTA LOCAL + CONTEXTO GLOBAL
  const handleVote = async (storyId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const result = await toggleLike(storyId);

      if (result.success) {
        // ✅ ACTUALIZACIÓN OPTIMISTA LOCAL PARA CURRENTCONTEST
        setStories((prevStories) =>
          prevStories.map((story) => {
            if (story.id === storyId) {
              const newLikesCount = story.likes_count + (result.liked ? 1 : -1);
              return {
                ...story,
                likes_count: Math.max(0, newLikesCount),
                isLiked: result.liked,
              };
            }
            return story;
          })
        );

        if (result.liked && user?.id) {
          setTimeout(() => {
            checkFirstStoryBadge(user.id);
          }, 1000);
        }
      } else {
        console.error("Error voting:", result.error);
        alert("Error al procesar el voto: " + result.error);
      }
    } catch (err) {
      console.error("Error voting:", err);
      alert("Error inesperado al votar");
    }
  };

  // ✅ FILTROS Y ORDENAMIENTO - USANDO ESTADO LOCAL DE CURRENTCONTEST
  const filteredAndSortedStories = (() => {
    let filtered = [...stories];

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
        return filtered.sort(() => Math.random() - 0.5);
      case "recent":
      default:
        return filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
  })();

  // ✅ FUNCIONES DE UTILIDAD
  const getPhaseInfo = () => {
    if (!contest) return null;

    const phase = getContestPhase(contest);
    const now = new Date();

    switch (phase) {
      case "submission": {
        const submissionEnd = new Date(contest.submission_deadline);
        const daysLeft = Math.ceil(
          (submissionEnd - now) / (1000 * 60 * 60 * 24)
        );
        return {
          phase: "submission",
          title: "📝 Período de Envío",
          description: `Quedan ${Math.max(0, daysLeft)} días para participar`,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          buttonText: "Escribir mi historia",
          buttonLink: `/write/${contest.id}`,
          showStories: false,
          message: "Las historias se mostrarán cuando inicie la votación",
        };
      }
      case "voting": {
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
      case "results":
        return {
          phase: "results",
          title: "🏆 Resultados Finales",
          description: "¡Concurso finalizado! Conoce a los ganadores",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          buttonText: "Ver ganadores",
          scrollToStories: true,
          showStories: true,
        };

      default:
        return {
          phase: "unknown",
          title: "🏆 Concurso",
          description: "Estado del concurso",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          showStories: false,
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  // ✅ LOADING STATES
  if (globalLoading || contestsLoading || (!initialized && !error)) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Cargando concurso...</p>
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
            <button onClick={() => navigate("/")} className="btn-secondary">
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
            No hay concursos disponibles
          </h2>
          <p className="text-gray-600 mb-6">
            Pronto habrá nuevos concursos. ¡Mantente atento!
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header del concurso */}
      <div className="text-center">
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            <Calendar className="h-4 w-4 mr-1" />
            {contest.month}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {contest.title}
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          {contest.description}
        </p>

        {/* Stats del concurso */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <span>{contest.participants_count || 0} participantes</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Star className="h-5 w-5 mr-2" />
            <span>{contest.category}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <PenTool className="h-5 w-5 mr-2" />
            <span>
              {contest.min_words}-{contest.max_words} palabras
            </span>
          </div>
        </div>
      </div>

      {/* Guidance de votación */}
      {phaseInfo?.phase === "voting" && (
        <VotingGuidance
          currentPhase={phaseInfo.phase}
          userVotesCount={votingStats.currentContestVotes}
          totalStories={stories.length}
          contestMonth={contest.month}
        />
      )}

      {/* SECCIÓN DE HISTORIAS SEGÚN LA FASE */}
      {phaseInfo && (
        <div ref={storiesSectionRef} id="stories-section" className="space-y-6">
          {/* FASE DE SUBMISSION - Mostrar participantes sin contenido */}
          {phaseInfo.phase === "submission" && (
            <div className="space-y-8">
              {/* Header motivacional */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenTool className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Fase de envío de historias
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                  Los participantes están escribiendo sus historias. Las
                  historias se revelarán cuando inicie la votación.
                </p>

                {/* CTA Principal */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    ¿Aún no participas?
                  </h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Únete a estos escritores y demuestra tu talento creativo
                  </p>
                  <ContestActionButton
                    variant="primary"
                    size="large"
                    showDescription={false}
                  />
                </div>
              </div>

              {/* Lista de participantes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-green-600" />
                        Escritores que ya participaron
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Sus historias se revelarán cuando inicie la votación
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        {storiesLoading ? "..." : stories.length}
                      </div>
                      <div className="text-sm text-gray-500">participantes</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Loading state */}
                  {storiesLoading && (
                    <div className="text-center py-8">
                      <Loader className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                      <p className="text-gray-600">Cargando participantes...</p>
                    </div>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
                      <p className="text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!storiesLoading && !error && stories.length === 0 && (
                    <div className="text-center py-8">
                      <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Aún no hay participantes
                      </h4>
                      <p className="text-gray-600 mb-4">
                        ¡Sé el primero en participar en este concurso!
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
                      {stories.map((story, index) => (
                        <div
                          key={story.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 truncate">
                                  {story.author}
                                </span>
                                {/* Badges del autor */}
                                {story.authorWins > 0 && (
                                  <span
                                    className="text-sm"
                                    title="Ganador de concursos"
                                  >
                                    🏆
                                  </span>
                                )}
                                {story.likes_count > 50 && (
                                  <span
                                    className="text-sm"
                                    title="Autor popular"
                                  >
                                    ⭐
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{story.authorWins || 0} victorias</span>
                                <span>•</span>
                                <span>{formatDate(story.created_at)}</span>
                              </div>
                            </div>

                            {/* Indicador de envío */}
                            <div className="flex items-center">
                              <div
                                className="w-2 h-2 bg-green-500 rounded-full"
                                title="Historia enviada"
                              ></div>
                            </div>
                          </div>

                          {/* Preview mínimo SIN spoilers */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span className="flex items-center">
                                <PenTool className="h-3 w-3 mr-1" />
                                Historia enviada
                              </span>
                              <span>{story.word_count || 0} palabras</span>
                            </div>
                            {story.is_mature && (
                              <div className="mt-2">
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                                  Contenido 18+
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas motivacionales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {storiesLoading ? "..." : stories.length}
                  </div>
                  <div className="text-blue-800 font-medium">
                    Historias enviadas
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    ¡Únete a ellos!
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.max(
                      0,
                      Math.floor(
                        (new Date(contest.submission_deadline) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}
                  </div>
                  <div className="text-green-800 font-medium">
                    Días restantes
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Para enviar tu historia
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {storiesLoading
                      ? "..."
                      : stories
                          .reduce(
                            (total, story) => total + (story.word_count || 0),
                            0
                          )
                          .toLocaleString()}
                  </div>
                  <div className="text-purple-800 font-medium">
                    Palabras escritas
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    Por la comunidad
                  </div>
                </div>
              </div>

              {/* CTA final para participar */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¡Aún estás a tiempo de participar!
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Tienes hasta el{" "}
                  <strong>
                    {new Date(contest.submission_deadline).toLocaleDateString(
                      "es-ES"
                    )}
                  </strong>{" "}
                  para enviar tu historia al concurso de {contest.month}.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {phaseInfo.buttonLink && (
                    <a
                      href={phaseInfo.buttonLink}
                      className="btn-primary px-8 py-3"
                    >
                      {phaseInfo.buttonText}
                    </a>
                  )}
                  <button
                    onClick={() => setShowRulesModal(true)}
                    className="btn-secondary px-8 py-3"
                  >
                    Ver reglas del concurso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FASES DE VOTACIÓN Y RESULTADOS - Mostrar historias completas */}
          {phaseInfo.showStories && (
            <div className="space-y-6">
              {/* Header de historias con filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Historias ({filteredAndSortedStories.length})
                  </h2>
                  {searchTerm && (
                    <p className="text-sm text-gray-600">
                      Mostrando resultados para "{searchTerm}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Actualizar"
                  >
                    <RefreshCw
                      className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtros</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showFilters ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Panel de filtros */}
              {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Búsqueda */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar historias
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Título, autor o contenido..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* Ordenamiento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ordenar por
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="recent">Más recientes</option>
                        <option value="popular">Más populares</option>
                        <option value="viewed">Más vistas</option>
                        <option value="alphabetical">
                          Alfabético (título)
                        </option>
                        <option value="author">Por autor</option>
                        <option value="random">Aleatorio</option>
                      </select>
                    </div>
                  </div>

                  {/* Limpiar filtros */}
                  {(searchTerm || sortBy !== "recent") && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSortBy("recent");
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loading de historias */}
              {storiesLoading && (
                <div className="text-center py-12">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
                  <p className="text-gray-600">Cargando historias...</p>
                </div>
              )}

              {/* Lista de historias */}
              {!storiesLoading && (
                <>
                  {filteredAndSortedStories.length === 0 ? (
                    <div className="text-center py-12">
                      <PenTool className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {searchTerm
                          ? "No se encontraron historias"
                          : "Aún no hay historias"}
                      </h3>
                      <p className="text-gray-600 mb-6">
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
                    <div className="grid gap-6">
                      {filteredAndSortedStories.map((story, index) => (
                        <div
                          key={story.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                          {/* Header con posición si es resultados */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              {sortBy === "popular" &&
                                phaseInfo?.phase === "results" &&
                                index < 3 && (
                                  <div className="flex items-center mb-2">
                                    {index === 0 && (
                                      <div className="flex items-center text-yellow-600">
                                        <Crown className="h-5 w-5 mr-1" />
                                        <span className="font-bold">
                                          1º Lugar
                                        </span>
                                      </div>
                                    )}
                                    {index === 1 && (
                                      <div className="flex items-center text-gray-600">
                                        <Medal className="h-5 w-5 mr-1" />
                                        <span className="font-bold">
                                          2º Lugar
                                        </span>
                                      </div>
                                    )}
                                    {index === 2 && (
                                      <div className="flex items-center text-orange-600">
                                        <Award className="h-5 w-5 mr-1" />
                                        <span className="font-bold">
                                          3º Lugar
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                              <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 cursor-pointer">
                                <a href={`/story/${story.id}`}>{story.title}</a>
                              </h3>

                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <span>
                                  por <strong>{story.author}</strong>
                                </span>
                                <span className="mx-2">•</span>
                                <span>{getReadingTime(story.word_count)}</span>
                                <span className="mx-2">•</span>
                                <span>{story.word_count} palabras</span>
                                {story.is_mature && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span className="text-red-600 font-medium">
                                      18+
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Excerpt */}
                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {story.excerpt}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Vote button - SOLO EN FASE DE VOTACIÓN */}
                              {phaseInfo?.phase === "voting" && (
                                <button
                                  onClick={() => handleVote(story.id)}
                                  disabled={
                                    !isAuthenticated && !setShowAuthModal
                                  }
                                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                                    story.isLiked
                                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                  }`}
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      story.isLiked ? "fill-current" : ""
                                    }`}
                                  />
                                  <span>{story.likes_count || 0}</span>
                                </button>
                              )}

                              {/* Likes display - SOLO EN FASE DE RESULTADOS */}
                              {phaseInfo?.phase === "results" && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <Heart className="h-4 w-4 fill-current" />
                                  <span className="font-medium">
                                    {story.likes_count || 0} likes
                                  </span>
                                </div>
                              )}

                              {/* Views */}
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Eye className="h-4 w-4" />
                                <span>{story.views_count || 0}</span>
                              </div>
                            </div>

                            {/* Read button */}
                            <a
                              href={`/story/${story.id}`}
                              className="btn-primary text-sm"
                            >
                              Leer historia
                            </a>
                          </div>

                          {/* Voting restrictions info */}
                          {!isAuthenticated &&
                            phaseInfo?.phase === "voting" && (
                              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                💡{" "}
                                <button
                                  onClick={() => setShowAuthModal(true)}
                                  className="underline hover:no-underline"
                                >
                                  Inicia sesión
                                </button>{" "}
                                para votar por esta historia
                              </div>
                            )}

                          {isAuthenticated && story.user_id === user?.id && (
                            <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
                              ✨ Esta es tu historia - no puedes votar por ella
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          initialMode="register"
        />
      )}

      {showRulesModal && (
        <ContestRulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          contest={{
            ...contest,
            endDate: new Date(contest.voting_deadline || contest.end_date),
          }}
        />
      )}
    </div>
  );
};

export default CurrentContest;
