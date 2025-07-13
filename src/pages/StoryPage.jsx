// pages/StoryPage.jsx - COMPLETAMENTE REFACTORIZADO
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Eye,
  Clock,
  User,
  Calendar,
  PenTool,
  Trophy,
  Star,
  ChevronLeft,
  Share2,
  Flag,
  BookOpen,
  Award,
  Loader,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import AuthModal from "../components/forms/AuthModal";
import SimpleComments from "../components/comments/SimpleComments";
import EnhancedVoteButton from "../components/voting/EnhancedVoteButton";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ TODO DESDE EL CONTEXTO GLOBAL
  const {
    // Auth state
    user,
    isAuthenticated,

    // App state
    initialized,
    globalLoading,
    galleryStories,

    // Functions
    getStoryById,
    recordStoryView,
    checkUserLike,
    canVoteInStory,
    toggleLike,
    getContestPhase,
  } = useGlobalApp();

  // ✅ LOCAL STATE SIMPLIFICADO
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [votingInfo, setVotingInfo] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);

  // Refs para control
  const loadingRef = useRef(false);
  const storyContentRef = useRef(null);

  // ✅ CARGAR HISTORIA Y DATOS RELACIONADOS
  useEffect(() => {
    const loadStoryData = async () => {
      if (!id || !initialized || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log("📖 Cargando historia:", id);

        // 1. Obtener la historia
        const storyResult = await getStoryById(id);

        if (!storyResult.success) {
          setError(storyResult.error);
          setStory(null);
          return;
        }

        const storyData = storyResult.story;
        setStory(storyData);
        setLikesCount(storyData.likes_count || 0);

        console.log("✅ Historia cargada:", storyData.title);

        // 2. Verificar si el usuario ya votó por esta historia (solo si está autenticado)
        if (isAuthenticated && user?.id) {
          try {
            const likeResult = await checkUserLike(id);
            if (likeResult.success) {
              setIsLiked(likeResult.liked);
            }
          } catch (err) {
            console.warn("⚠️ Error verificando like:", err);
          }
        }

        // 3. Obtener información de votación (permisos)
        try {
          const votingResult = await canVoteInStory(id);
          setVotingInfo(votingResult);
        } catch (err) {
          console.warn("⚠️ Error verificando permisos de votación:", err);
          setVotingInfo({
            canVote: false,
            reason: "Error verificando permisos",
          });
        }

        // 4. Registrar vista (después de un momento para asegurar que se cargó)
        if (!viewRecorded) {
          setTimeout(async () => {
            try {
              await recordStoryView(id);
              setViewRecorded(true);
              console.log("👁️ Vista registrada para historia:", id);
            } catch (err) {
              console.warn("⚠️ Error registrando vista:", err);
            }
          }, 2000); // 2 segundos para asegurar que leyó algo
        }
      } catch (err) {
        console.error("💥 Error general cargando historia:", err);
        setError("Error inesperado: " + err.message);
        setStory(null);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadStoryData();
  }, [
    id,
    initialized,
    isAuthenticated,
    user?.id,
    getStoryById,
    checkUserLike,
    canVoteInStory,
    recordStoryView,
    // ✅ REMOVED viewRecorded - CAUSABA LOOP INFINITO
  ]);

  // ✅ ACTUALIZAR STORY LOCAL CUANDO CAMBIE GALLERYSTORIES (para views_count)
  useEffect(() => {
    if (story && galleryStories.length > 0) {
      const updatedStory = galleryStories.find((s) => s.id === story.id);
      if (updatedStory && updatedStory.views_count !== story.views_count) {
        console.log(
          `🔄 Actualizando views_count en StoryPage: ${story.views_count} → ${updatedStory.views_count}`
        );
        setStory((prev) => ({
          ...prev,
          views_count: updatedStory.views_count,
        }));
      }
    }
  }, [galleryStories, story?.id, story?.views_count]);

  // ✅ HANDLE VOTE
  const handleVote = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!votingInfo.canVote) {
      console.log("❌ No se puede votar:", votingInfo.reason);
      return;
    }

    try {
      const result = await toggleLike(id);

      if (result.success) {
        // Actualizar estado local inmediatamente
        setIsLiked(result.liked);
        setLikesCount((prev) => {
          const newCount = prev + (result.liked ? 1 : -1);
          return Math.max(0, newCount);
        });

        console.log(
          `${result.liked ? "❤️" : "💔"} Like ${
            result.liked ? "agregado" : "removido"
          }`
        );
      } else {
        console.error("❌ Error voting:", result.error);
        alert("Error al procesar el voto: " + result.error);
      }
    } catch (err) {
      console.error("💥 Error inesperado al votar:", err);
      alert("Error inesperado al votar");
    }
  };

  // ✅ SHARE FUNCTIONALITY
  const handleShare = async () => {
    const shareData = {
      title: `"${story.title}" por ${story.author.name}`,
      text: story.title,
      url: window.location.href,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback - copiar al clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("¡Enlace copiado al portapapeles!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Fallback manual
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  // ✅ REPORT FUNCTIONALITY
  const handleReport = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const reason = prompt(
      "¿Por qué quieres reportar esta historia?\n\n" +
        "Razones válidas:\n" +
        "- Contenido ofensivo o inapropiado\n" +
        "- Spam o contenido irrelevante\n" +
        "- Violación de las reglas de la comunidad\n" +
        "- Plagio o contenido copiado\n\n" +
        "Escribe tu razón:"
    );

    if (reason && reason.trim()) {
      console.log("🚨 Historia reportada:", id, "Razón:", reason);
      alert("Gracias por tu reporte. Nuestro equipo lo revisará pronto.");
      // TODO: Implementar sistema de reportes real
    }
  };

  // ✅ UTILITY FUNCTIONS
  const getReadingTime = (wordCount) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ LOADING STATE
  if (!initialized || globalLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Cargando historia...</p>
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
            Historia no encontrada
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/contest/current")}
              className="btn-secondary"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </button>
            <Link to="/gallery" className="btn-primary">
              <BookOpen className="h-4 w-4 mr-2" />
              Explorar historias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NO STORY STATE
  if (!story) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Historia no disponible
          </h2>
          <p className="text-gray-600 mb-6">
            Esta historia puede haber sido eliminada o no está disponible.
          </p>
          <Link to="/gallery" className="btn-primary">
            Explorar otras historias
          </Link>
        </div>
      </div>
    );
  }

  // ✅ RENDER PRINCIPAL
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/contest/current")}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Volver
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Compartir historia"
          >
            <Share2 className="h-5 w-5" />
          </button>

          <button
            onClick={handleReport}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Reportar historia"
          >
            <Flag className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Story Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Contest Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              <span className="font-medium">
                Concurso de {story.contest.month} - {story.contest.category}
              </span>
            </div>

            <Link
              to="/contest/current"
              className="text-primary-100 hover:text-white text-sm flex items-center"
            >
              Ver concurso
              <ExternalLink className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Main Header */}
        <div className="p-8">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {story.title}
          </h1>

          {/* Author Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {story.author.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="h-4 w-4 mr-1" />
                  <span>{story.author.wins} victorias</span>
                  <span className="mx-2">•</span>
                  <Heart className="h-4 w-4 mr-1" />
                  <span>{story.author.totalLikes} likes totales</span>
                </div>
              </div>
            </div>

            {/* Story Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{getReadingTime(story.word_count)} min de lectura</span>
              </div>
              <div className="flex items-center">
                <PenTool className="h-4 w-4 mr-1" />
                <span>{story.word_count} palabras</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(story.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Mature Content Warning */}
          {story.is_mature && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">
                    Contenido para adultos (18+)
                  </h4>
                  <p className="text-red-700 text-sm">
                    Esta historia contiene temas maduros. La discreción del
                    lector es aconsejada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Voting Section */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <EnhancedVoteButton
                isLiked={isLiked}
                likesCount={likesCount}
                canVote={votingInfo.canVote}
                votingInfo={votingInfo}
                isAuthenticated={isAuthenticated}
                onVote={handleVote}
                onAuthRequired={() => setShowAuthModal(true)}
                size="default"
                showTooltip={true}
              />

              <div className="flex items-center text-gray-600">
                <Eye className="h-5 w-5 mr-2" />
                <span>{story.views_count || 0} vistas</span>
              </div>
            </div>

            {/* Contest Phase Info */}
            {story.contest.status && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  story.contest.status === "submission"
                    ? "bg-blue-100 text-blue-800"
                    : story.contest.status === "voting"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {story.contest.status === "submission" && "📝 Período de envío"}
                {story.contest.status === "voting" && "🗳️ Votación activa"}
                {story.contest.status === "results" && "🏆 Resultados"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div
          ref={storyContentRef}
          className="prose prose-lg max-w-none"
          style={{
            fontSize: "18px",
            lineHeight: "1.7",
            fontFamily: "Georgia, serif",
          }}
        >
          {story.content.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-800 leading-relaxed">
              {paragraph.trim() || "\u00A0"}
            </p>
          ))}
        </div>

        {/* Story Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 text-sm mb-2">
                Esta historia participó en el concurso{" "}
                <strong>"{story.contest.title}"</strong>
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Publicada el {formatDate(story.created_at)}</span>
                <span>•</span>
                <span>{story.word_count} palabras</span>
                <span>•</span>
                <span>
                  {getReadingTime(story.word_count)} minutos de lectura
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <EnhancedVoteButton
                isLiked={isLiked}
                likesCount={likesCount}
                canVote={votingInfo.canVote}
                votingInfo={votingInfo}
                isAuthenticated={isAuthenticated}
                onVote={handleVote}
                onAuthRequired={() => setShowAuthModal(true)}
                size="large"
                showTooltip={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <SimpleComments storyId={story.id} storyTitle={story.title} />
      </div>

      {/* Related Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          ¿Qué hacer ahora?
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/contest/current"
            className="bg-primary-50 border border-primary-200 rounded-lg p-4 hover:bg-primary-100 transition-colors group"
          >
            <div className="flex items-center mb-2">
              <Trophy className="h-5 w-5 text-primary-600 mr-2" />
              <span className="font-medium text-primary-900">
                Ver concurso actual
              </span>
            </div>
            <p className="text-primary-700 text-sm">
              Descubre más historias del concurso de {story.contest.month}
            </p>
          </Link>

          <Link
            to="/gallery"
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors group"
          >
            <div className="flex items-center mb-2">
              <BookOpen className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900">
                Explorar galería
              </span>
            </div>
            <p className="text-green-700 text-sm">
              Lee más historias increíbles de nuestra comunidad
            </p>
          </Link>

          {isAuthenticated && (
            <Link
              to="/write"
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center mb-2">
                <PenTool className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">
                  Escribir mi historia
                </span>
              </div>
              <p className="text-blue-700 text-sm">
                ¿Te inspiraste? Crea tu propia historia
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          initialMode="register"
        />
      )}
    </div>
  );
};

export default StoryPage;
