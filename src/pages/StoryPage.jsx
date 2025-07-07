import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Eye,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Flag,
  Trophy,
  Star,
  Calendar,
  Award,
  MessageSquare,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useStories } from "../hooks/useStories";
import AuthModal from "../components/forms/AuthModal";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [story, setStory] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingInfo, setVotingInfo] = useState({ canVote: false, reason: "" });

  // Hooks
  const {
    getStoryById,
    toggleLike,
    checkUserLike,
    recordStoryView,
    canVoteInStory,
  } = useStories();

  // Cargar historia
  const loadStory = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Cargando historia:", id);

      const result = await getStoryById(id);

      if (result.success) {
        console.log("✅ Historia cargada:", result.story.title);
        setStory(result.story);
        setLikesCount(result.story.likes_count || 0);

        // Verificar si el usuario ya dio like
        if (isAuthenticated) {
          const likeResult = await checkUserLike(id);
          if (likeResult.success) {
            setIsLiked(likeResult.liked);
          }
        }

        // Verificar si se puede votar en esta historia
        const votingResult = await canVoteInStory(id);
        setVotingInfo(votingResult);
        console.log("🗳️ Info de votación:", votingResult);

        // Registrar vista
        await recordStoryView(id);
      } else {
        console.error("❌ Error cargando historia:", result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error("💥 Error inesperado:", err);
      setError("Error inesperado al cargar la historia");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, getStoryById, checkUserLike, recordStoryView]);

  // Cargar historia al montar o cambiar ID
  useEffect(() => {
    loadStory();
  }, [loadStory]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Verificar si se puede votar antes de intentar
    if (!votingInfo.canVote) {
      alert(votingInfo.reason);
      return;
    }

    try {
      const result = await toggleLike(id);

      if (result.success) {
        setIsLiked(result.liked);
        setLikesCount((prev) => (result.liked ? prev + 1 : prev - 1));
        console.log("✅ Like actualizado:", result.liked);
      } else {
        alert(result.error || "Error al procesar el like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Error inesperado al procesar el like");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: story.title,
        text: `Lee "${story.title}" por ${story.author.name} en LiteraLab`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Hace menos de una hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hace 1 día";
    return `Hace ${diffInDays} días`;
  };

  const getBadgeInfo = (badge) => {
    switch (badge) {
      case "🏆":
        return { name: "Ganador de concursos", color: "text-yellow-600" };
      case "⭐":
        return { name: "Autor popular", color: "text-blue-600" };
      case "🔥":
        return { name: "Racha ganadora", color: "text-red-600" };
      default:
        return { name: "", color: "text-gray-600" };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Cargando historia...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error al cargar la historia
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Volver
            </button>
            <button onClick={loadStory} className="btn-primary">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Story not found
  if (!story) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Historia no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            La historia que buscas no existe o ha sido eliminada.
          </p>
          <button onClick={() => navigate("/gallery")} className="btn-primary">
            Ver galería
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
      </div>

      {/* Story Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            {story.contest?.category || "Ficción"}
          </span>
          <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
            {story.contest?.month || "Mes"}
          </span>
          {story.is_mature && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
              Contenido Maduro
            </span>
          )}
          {story.is_winner && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
              🏆 GANADOR
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {story.title}
        </h1>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${story.author.id}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    {story.author.name}
                  </Link>
                  {/* Badges dinámicos basados en estadísticas */}
                  {story.author.wins > 0 && (
                    <span
                      className="text-sm text-yellow-600"
                      title="Ganador de concursos"
                    >
                      🏆
                    </span>
                  )}
                  {story.author.totalLikes > 50 && (
                    <span
                      className="text-sm text-blue-600"
                      title="Autor popular"
                    >
                      ⭐
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {story.author.wins} victorias • {story.author.totalLikes}{" "}
                  likes totales
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {story.readTime}
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {story.views_count} lecturas
            </div>
            <div>{formatDate(story.published_at || story.created_at)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={!votingInfo.canVote}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !votingInfo.canVote
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  : isLiked
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600"
              }`}
              title={!votingInfo.canVote ? votingInfo.reason : ""}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              {likesCount} likes
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              Compartir
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {story.word_count} palabras
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Información de votación */}
        {!votingInfo.canVote && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              votingInfo.phase === "submission"
                ? "bg-blue-50 border-blue-200"
                : votingInfo.phase === "results"
                ? "bg-yellow-50 border-yellow-200"
                : votingInfo.reason.includes("propia")
                ? "bg-purple-50 border-purple-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {votingInfo.phase === "submission" && (
                <>
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="text-blue-800 font-medium block">
                      ⏳ Votación aún no disponible
                    </span>
                    <span className="text-blue-600 text-sm">
                      La votación comenzará cuando termine la fase de envío de
                      historias
                    </span>
                  </div>
                </>
              )}
              {votingInfo.phase === "results" && (
                <>
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <div>
                    <span className="text-yellow-800 font-medium block">
                      🏆 Votación finalizada
                    </span>
                    <span className="text-yellow-600 text-sm">
                      Este concurso ya terminó y se están mostrando los
                      resultados finales
                    </span>
                  </div>
                </>
              )}
              {votingInfo.reason.includes("propia") && (
                <>
                  <User className="h-5 w-5 text-purple-600" />
                  <div>
                    <span className="text-purple-800 font-medium block">
                      ✍️ Esta es tu historia
                    </span>
                    <span className="text-purple-600 text-sm">
                      No puedes votar por tu propia participación, pero otros
                      usuarios sí pueden
                    </span>
                  </div>
                </>
              )}
            </div>
            {votingInfo.votingStartsAt && (
              <div className="mt-2 text-sm text-blue-600 bg-blue-100 rounded px-2 py-1 inline-block">
                📅 Votación inicia:{" "}
                {votingInfo.votingStartsAt.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
            {votingInfo.votingEndsAt && votingInfo.canVote && (
              <div className="mt-2 text-sm text-green-600 bg-green-100 rounded px-2 py-1 inline-block">
                ⏰ Votación termina:{" "}
                {votingInfo.votingEndsAt.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </div>
        )}

        {/* Información positiva cuando SÍ se puede votar */}
        {votingInfo.canVote && isAuthenticated && (
          <div className="mt-4 p-3 rounded-lg border bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-600" />
              <span className="text-green-800 text-sm font-medium">
                🗳️ ¡Votación activa! Dale like si te gustó esta historia
              </span>
            </div>
            {votingInfo.votingEndsAt && (
              <div className="mt-1 text-xs text-green-600">
                Tienes hasta el{" "}
                {votingInfo.votingEndsAt.toLocaleDateString("es-ES")} para votar
              </div>
            )}
          </div>
        )}
      </header>

      {/* Story Content */}
      <article className="prose prose-lg max-w-none mb-12">
        <div className="bg-white rounded-lg p-8 font-writing text-lg leading-relaxed text-gray-800">
          {story.content.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* Contest Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">
          Prompt del concurso:
        </h3>
        <p className="text-gray-600 italic">
          "{story.contest?.title || "Concurso"}"
        </p>
        {story.contest?.description && (
          <p className="text-gray-600 text-sm mt-2">
            {story.contest.description}
          </p>
        )}
        <div className="mt-3">
          <Link
            to="/contest/current"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Ver todas las participaciones del concurso →
          </Link>
        </div>
      </div>

      {/* Author Info */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {story.author.name}
              </h3>
              {/* Badges dinámicos */}
              {story.author.wins > 0 && (
                <span className="text-lg" title="Ganador de concursos">
                  🏆
                </span>
              )}
              {story.author.totalLikes > 50 && (
                <span className="text-lg" title="Autor popular">
                  ⭐
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-3">{story.author.bio}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div>
                Se unió en{" "}
                {new Date(story.author.joinedAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                })}
              </div>
              <div>{story.author.totalLikes} likes totales</div>
              <Link
                to={`/profile/${story.author.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver perfil completo →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section Placeholder */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comentarios
        </h3>

        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <button
                onClick={() => setShowAuthModal(true)}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Inicia sesión
              </button>{" "}
              para dejar un comentario y unirte a la conversación.
            </p>
          </div>
        )}

        {isAuthenticated && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <textarea
              placeholder="Comparte tu opinión sobre esta historia..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button className="btn-primary text-sm px-4 py-2">
                Comentar
              </button>
            </div>
          </div>
        )}

        {/* Placeholder para comentarios futuros */}
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Los comentarios estarán disponibles próximamente</p>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Te inspiró esta historia?
        </h3>
        <p className="text-gray-600 mb-6">
          ¡Tú también puedes participar en el concurso de{" "}
          {story.contest?.month || "este mes"}!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/write/${story.contest?.id || ""}`}
            className="btn-primary inline-flex items-center px-6 py-3"
          >
            Escribir mi historia
          </Link>
          <Link
            to="/contest/current"
            className="btn-secondary inline-flex items-center px-6 py-3"
          >
            Ver más participaciones
          </Link>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Recargar para obtener el estado de like del usuario
            loadStory();
          }}
        />
      )}
    </div>
  );
};

export default StoryPage;
