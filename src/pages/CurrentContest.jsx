// pages/CurrentContest.jsx - VERSIÓN CORREGIDA Y LIMPIA
import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
import VotingGuidance from "../components/voting/VotingGuidance";
import AuthModal from "../components/forms/AuthModal";
import ContestRulesModal from "../components/forms/ContestRulesModal";
import ContestActionButton from "../components/ui/ContestActionButton";
import UserAvatar from "../components/ui/UserAvatar";
import ShareDropdown from "../components/ui/ShareDropdown";

const CurrentContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ TODO DESDE EL CONTEXTO GLOBAL
  const {
    user,
    isAuthenticated,
    currentContest,
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
  } = useGlobalApp();

  // ✅ LOCAL STATE PARA CURRENTCONTEST - USA GALLERYSTORIES DEL CONTEXTO
  const [contest, setContest] = useState(null);

  // ✅ ALIAS PARA COMPATIBILIDAD - AHORA STORIES = GALLERYSTORIES
  const stories = galleryStories;
  const storiesLoading = galleryLoading;
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

      // Reset state al iniciar
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
            return;
          }
        } else {
          if (contests.length > 0) {
            contestData = contests[0];
          } else {
            setError("No hay concursos disponibles");
            setContest(null);
            return;
          }
        }

        setContest(contestData);
        console.log("✅ Concurso cargado:", contestData.title);

        // 2. Cargar historias usando SIEMPRE galleryStories para máxima reactividad
        console.log("🔄 Cargando historias vía galleryStories");
        await loadGalleryStories({ contestId: contestData.id });
        console.log("✅ GalleryStories cargadas para CurrentContest");
      } catch (err) {
        console.error("💥 Error general cargando concurso:", err);
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

  // ✅ DETECTAR CAMBIOS EN GALLERYSTORIES Y FORZAR RE-RENDER INMEDIATO
  const [forceRender, setForceRender] = useState(0);

  useLayoutEffect(() => {
    if (contest?.id === currentContest?.id && galleryStories.length > 0) {
      console.log(
        "🔄 GalleryStories cambió, forzando re-render de CurrentContest"
      );
      setForceRender((prev) => prev + 1);
    }
  }, [galleryStories, contest?.id, currentContest?.id]);

  // ✅ FORZAR RE-RENDER CUANDO SE NAVEGA DE VUELTA
  useLayoutEffect(() => {
    console.log(
      "🔄 CurrentContest montado/actualizado - Force render:",
      forceRender
    );
  }, [forceRender]);

  // ✅ REFRESH COMPLETO
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshContests(),
        refreshUserData(),
        contest?.id
          ? loadGalleryStories({ contestId: contest.id })
          : Promise.resolve(),
      ]);
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ HANDLE VOTE SIMPLIFICADO - SOLO CONTEXTO GLOBAL (SE SINCRONIZA AUTOMÁTICAMENTE)
  const handleVote = async (storyId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const result = await toggleLike(storyId);

      if (result.success) {
        // ✅ NO NECESITAMOS ACTUALIZACIÓN LOCAL - SE SINCRONIZA AUTOMÁTICAMENTE VIA useEffect
        console.log(
          `${
            result.liked ? "❤️" : "💔"
          } Voto procesado, sincronización automática`
        );
      } else {
        console.error("Error voting:", result.error);
        alert("Error al procesar el voto: " + result.error);
      }
    } catch (err) {
      console.error("Error voting:", err);
      alert("Error inesperado al votar");
    }
  };

  // ✅ FILTROS Y ORDENAMIENTO - USAR SOLO GALLERYSTORIES (FUENTE ÚNICA DE VERDAD)
  const filteredAndSortedStories = (() => {
    // Usar SIEMPRE galleryStories como fuente única de verdad
    console.log("🔍 CurrentContest usando galleryStories:", {
      contestId: contest?.id,
      galleryStoriesCount: galleryStories.length,
      storiesLoading,
      // Debug: mostrar likes de las historias para verificar sincronización
      storiesWithLikes: galleryStories.map((s) => ({
        id: s.id.slice(-6),
        likes: s.likes_count,
        views: s.views_count, // ← Agregar views para debug
        isLiked: s.isLiked,
      })),
    });

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
        return filtered.sort(() => Math.random() - 0.5);
      case "recent":
      default:
        return filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
  })();

  // ✅ FUNCIONES DE COMPARTIR
  // Generar datos para compartir
  const getShareData = () => {
    if (!contest) return null;

    // Verificar si el usuario participó en este concurso
    const userParticipated = userStories.some(userStory => 
      userStory.contest_id === contest.id
    );

    // URL del concurso (no de la historia específica)
    const contestUrl = `${window.location.origin}/contest/${contest.id}`;

    // Generar texto según si el usuario participó o no
    return userParticipated 
      ? {
          title: `Letranido - ${contest.title}`,
          text: `¡Participé con mi historia en el concurso "${contest.title}" en Letranido! ✍️\n📚 Únete como escritor y comparte tu historia\n🚀 Participa en:`,
          url: contestUrl,
        }
      : {
          title: `Letranido - ${contest.title}`,
          text: `📝 ¡Descubre historias increíbles en Letranido!\n🎯 Concurso activo: "${contest.title}"\n✍️ Únete como escritor:`,
          url: contestUrl,
        };
  };

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
    <div className="max-w-6xl mx-auto space-y-6 overflow-hidden">
      {/* Header del concurso - Más compacto */}
      <div className="bg-gradient-to-br from-primary-100 via-white to-accent-100 rounded-xl p-4 md:p-6 text-center relative overflow-hidden">
        {/* Elementos decorativos sutiles - Ocultos en mobile */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-primary-200 rounded-full opacity-10 hidden md:block"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-accent-200 rounded-full opacity-15 hidden md:block"></div>

        <div className="relative">
          <div className="mb-3">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Concurso de {contest.month}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {contest.title}
          </h1>

          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-4">
            {contest.description}
          </p>

          {/* Stats del concurso - Modernizadas */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="truncate font-semibold text-indigo-700">
                {contest.participants_count || 0} participantes
              </span>
            </div>
            <div className="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                <Star className="h-4 w-4 text-white" />
              </div>
              <span className="truncate font-semibold text-purple-700">{contest.category}</span>
            </div>
            <div className="flex items-center bg-gradient-to-r from-pink-50 to-indigo-50 border border-pink-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                <PenTool className="h-4 w-4 text-white" />
              </div>
              <span className="truncate font-semibold text-pink-700">
                {contest.min_words}-{contest.max_words} palabras
              </span>
            </div>
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
            <div className="space-y-6">
              {/* Header compacto con CTA */}
              <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <PenTool className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Fase de envío de historias
                  </h2>
                </div>

                <p className="text-gray-600 mb-4 max-w-xl mx-auto">
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
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 hover:border-purple-200 overflow-hidden transition-all duration-300">
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 border-b border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        Escritores participando
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {storiesLoading
                          ? "Cargando..."
                          : `${stories.length} historias enviadas`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {storiesLoading ? "..." : stories.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
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
                          className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <UserAvatar 
                              user={{ name: story.author, email: `${story.author}@mock.com` }} 
                              size="md" 
                            />

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

              {/* Estadísticas estilo landing page - Modernizadas */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 hover:border-purple-200 p-6 md:p-8 overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                <div className="grid grid-cols-3 gap-6 md:gap-8">
                  <div className="text-center min-w-0">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {storiesLoading ? "..." : stories.length}
                    </div>
                    <div className="text-gray-500 text-sm md:text-base">
                      Historias enviadas
                    </div>
                  </div>

                  <div className="text-center min-w-0">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      {Math.max(
                        0,
                        Math.floor(
                          (new Date(contest.submission_deadline) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}
                    </div>
                    <div className="text-gray-500 text-sm md:text-base">
                      Días restantes
                    </div>
                  </div>

                  <div className="text-center min-w-0">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {storiesLoading
                        ? "..."
                        : (() => {
                            const totalWords = stories.reduce(
                              (total, story) => total + (story.word_count || 0),
                              0
                            );
                            return totalWords >= 1000
                              ? `${Math.floor(totalWords / 1000)}k`
                              : totalWords.toLocaleString();
                          })()}
                    </div>
                    <div className="text-gray-500 text-sm md:text-base">
                      Palabras escritas
                    </div>
                  </div>
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

              {/* Panel de filtros - Modernizado */}
              {showFilters && (
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-2xl p-6 space-y-4 shadow-lg">
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
                    <div className="grid gap-3">
                      {filteredAndSortedStories.map((story, index) => (
                        <div
                          key={story.id}
                          className="bg-white/95 backdrop-blur-sm border border-indigo-100 hover:border-purple-200 rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/story/${story.id}`)}
                        >
                          {/* Header compacto */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              {/* Posición si es resultados - más compacta */}
                              {sortBy === "popular" &&
                                phaseInfo?.phase === "results" &&
                                index < 3 && (
                                  <div className="flex items-center mb-1">
                                    {index === 0 && (
                                      <div className="flex items-center text-yellow-600 text-sm">
                                        <Crown className="h-4 w-4 mr-1" />
                                        <span className="font-bold">1º</span>
                                      </div>
                                    )}
                                    {index === 1 && (
                                      <div className="flex items-center text-gray-600 text-sm">
                                        <Medal className="h-4 w-4 mr-1" />
                                        <span className="font-bold">2º</span>
                                      </div>
                                    )}
                                    {index === 2 && (
                                      <div className="flex items-center text-orange-600 text-sm">
                                        <Award className="h-4 w-4 mr-1" />
                                        <span className="font-bold">3º</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer truncate">
                                <a href={`/story/${story.id}`}>{story.title}</a>
                              </h3>

                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <UserAvatar 
                                  user={{ name: story.author, email: `${story.author}@mock.com` }} 
                                  size="xs" 
                                />
                                <span>
                                  por <strong>{story.author}</strong>
                                </span>
                                <span className="mx-1">•</span>
                                <span>{getReadingTime(story.word_count)} </span>
                                <span className="mx-1">•</span>
                                <span>{story.word_count}</span>
                                {story.is_mature && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-red-600 font-medium">
                                      18+
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                              {getShareData() && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <ShareDropdown shareData={getShareData()} size="small" />
                                </div>
                              )}
                              <a
                                href={`/story/${story.id}`}
                                className="btn-primary text-sm px-3 py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Leer
                              </a>
                            </div>
                          </div>

                          {/* Excerpt más corto */}
                          <div
                            className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: story.excerpt,
                            }}
                          />

                          {/* Actions compactas */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Likes display compacto - SIN FUNCIONALIDAD DE CLICK */}
                              <div className="flex items-center space-x-1 text-red-600 text-sm">
                                <Heart className="h-3 w-3 fill-current" />
                                <span className="font-medium">
                                  {story.likes_count || 0}
                                </span>
                              </div>

                              {/* Views compacto */}
                              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                                <Eye className="h-3 w-3" />
                                <span>{story.views_count || 0}</span>
                              </div>
                            </div>

                            {/* Info de votación - solo mostrar mensaje */}
                            {!isAuthenticated && (
                              <span className="text-xs text-blue-600">
                                Lee la historia para dar like
                              </span>
                            )}

                            {isAuthenticated && story.user_id === user?.id && (
                              <span className="text-xs text-purple-600">
                                Tu historia
                              </span>
                            )}
                          </div>
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
