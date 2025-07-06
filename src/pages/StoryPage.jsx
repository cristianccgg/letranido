import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import AuthModal from "../components/forms/AuthModal";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock story data - esto vendrá de la API
  const story = {
    id: parseInt(id),
    title: "El Guardián de los Secretos",
    content: `En el silencio sepulcral de la biblioteca, solo quedaba yo y aquel libro que parecía brillar con luz propia. Sus páginas amarillentas susurraban historias que nadie más había escuchado.

Había sido el bibliotecario de esta institución durante treinta años, y en todo ese tiempo, jamás había visto nada igual. El libro apareció una mañana de octubre, simplemente estaba ahí, en el estante más alto de la sección de literatura clásica, como si siempre hubiera pertenecido a ese lugar.

Pero yo sabía que no era así. Conocía cada libro de esta biblioteca como si fueran mis propios hijos. Y este... este era diferente. No tenía título en la portada, ni número de catalogación. Solo una cubierta de cuero gastado que parecía respirar bajo mis dedos.

Los otros empleados nunca lo notaron. Los visitantes pasaban de largo sin siquiera mirarlo. Era como si fuera invisible para todos excepto para mí. Y ahora que la biblioteca cerraba sus puertas para siempre, me enfrentaba a la decisión más difícil de mi vida.

¿Qué haría con el último libro?

La respuesta llegó cuando finalmente me atreví a abrirlo. Las páginas no contenían palabras escritas con tinta, sino memorias. Memorias de cada persona que había cruzado estas puertas en busca de conocimiento, aventura o simplemente refugio. Vi a la niña de ocho años que descubrió su amor por la poesía entre estos estantes. Al anciano que venía cada martes a leer el periódico porque en su casa se sentía demasiado solo. A la madre soltera que estudiaba para sus exámenes mientras su hijo jugaba en silencio en la sección infantil.

Todas esas vidas, todos esos momentos, estaban contenidos en aquel libro mágico. Era más que papel y tinta; era el alma de la biblioteca misma.

Cuando llegó el momento de cerrar por última vez, tomé el libro entre mis manos y susurré: "No te preocupes, encontraré la manera de que estas historias continúen."

Y así fue como decidí no llevármelo a casa, sino dejarlo exactamente donde estaba. Porque comprendí que el libro no me pertenecía a mí, ni a la biblioteca, ni siquiera a la ciudad. Pertenecía a todas las almas que habían encontrado magia entre estos muros.

Quizás algún día, cuando construyan algo nuevo en este lugar, alguien más lo encontrará. Y entonces, las memorias continuarán escribiéndose.`,
    author: {
      id: "maria_elena",
      name: "María Elena",
      avatar: null,
      badges: ["🏆", "⭐"],
      wins: 3,
      bio: "Escritora apasionada por las historias que conectan con el alma humana.",
      joinedAt: "2023-12-15",
      totalStories: 12,
      totalLikes: 284,
    },
    contest: {
      id: 1,
      title: "El último libro de la biblioteca",
      month: "Julio 2025",
      category: "Ficción",
    },
    metadata: {
      likes: 24,
      views: 156,
      publishedAt: "2025-07-05T14:30:00Z",
      wordCount: 487,
      readTime: "4 min",
      isMature: false,
      isWinner: false, // Se determina al final del concurso
    },
    comments: [
      {
        id: 1,
        author: "Carlos M.",
        content:
          "¡Qué hermosa manera de cerrar la historia! Me emocioné mucho con el final.",
        publishedAt: "2025-07-05T16:45:00Z",
        likes: 3,
      },
      {
        id: 2,
        author: "Ana L.",
        content:
          "La descripción del libro mágico es increíble. Realmente puedo imaginármelo brillando.",
        publishedAt: "2025-07-05T18:20:00Z",
        likes: 5,
      },
    ],
  };

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLikesCount(story.metadata.likes);
      // Simular si el usuario ya dio like (basado en localStorage para el demo)
      const hasLiked = localStorage.getItem(`liked_story_${id}`);
      setIsLiked(hasLiked === "true");
    }, 500);

    return () => clearTimeout(timer);
  }, [id, story.metadata.likes]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

      // Guardar en localStorage para la demo
      localStorage.setItem(`liked_story_${id}`, newIsLiked.toString());

      // TODO: Enviar a la API
      console.log("Like toggled:", {
        storyId: id,
        liked: newIsLiked,
        userId: user?.id,
      });
    } catch (error) {
      // Revertir en caso de error
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      console.error("Error toggling like:", error);
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            {story.contest.category}
          </span>
          <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
            {story.contest.month}
          </span>
          {story.metadata.isMature && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
              Contenido Maduro
            </span>
          )}
          {story.metadata.isWinner && (
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
                  {story.author.badges.map((badge, i) => {
                    const badgeInfo = getBadgeInfo(badge);
                    return (
                      <span
                        key={i}
                        className={`text-sm ${badgeInfo.color}`}
                        title={badgeInfo.name}
                      >
                        {badge}
                      </span>
                    );
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {story.author.wins} victorias • {story.author.totalStories}{" "}
                  historias
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {story.metadata.readTime}
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {story.metadata.views} lecturas
            </div>
            <div>{formatDate(story.metadata.publishedAt)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600"
              }`}
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
              {story.metadata.wordCount} palabras
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>
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
        <p className="text-gray-600 italic">"{story.contest.title}"</p>
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
              {story.author.badges.map((badge, i) => (
                <span
                  key={i}
                  className="text-lg"
                  title={getBadgeInfo(badge).name}
                >
                  {badge}
                </span>
              ))}
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

      {/* Comments Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comentarios ({story.comments.length})
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

        <div className="space-y-4">
          {story.comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {comment.author}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(comment.publishedAt)}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{comment.content}</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="h-3 w-3" />
                  {comment.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Te inspiró esta historia?
        </h3>
        <p className="text-gray-600 mb-6">
          ¡Tú también puedes participar en el concurso de {story.contest.month}!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/write/${story.contest.id}`}
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
            // Después del login, permitir que haga like inmediatamente
          }}
        />
      )}
    </div>
  );
};

export default StoryPage;
