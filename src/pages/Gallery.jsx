import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Eye,
  Calendar,
  Trophy,
  Heart,
  Loader,
  AlertCircle,
  User,
  Clock,
  Vote,
} from "lucide-react";
import EnhancedVoteButton from "../components/voting/EnhancedVoteButton";
import AuthModal from "../components/forms/AuthModal";
import { useStories } from "../hooks/useStories";
import { useAuthStore } from "../store/authStore";
import { useContests } from "../hooks/compatibilityHooks";

const Gallery = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showMessage, setShowMessage] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMounted = useRef(true);

  // Hooks
  const { getStoriesForGallery, toggleLike, canVoteInStory } = useStories();
  const { isAuthenticated } = useAuthStore();
  const { currentContest, getContestPhase } = useContests();

  const currentPhase = currentContest ? getContestPhase(currentContest) : null;

  // Show success message if coming from submission
  useEffect(() => {
    if (location.state?.message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Función memoizada para cargar historias
  const loadStories = useCallback(async () => {
    if (isMounted.current) setLoading(true);
    if (isMounted.current) setError(null);

    try {
      const filters = {
        category: selectedCategory,
        sortBy: sortBy,
        search: searchTerm.trim() || undefined,
      };

      console.log("🔍 Cargando historias con filtros:", filters);

      const result = await getStoriesForGallery(filters);

      if (isMounted.current) {
        if (result.success) {
          setStories(result.stories || []);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError("Error inesperado al cargar las historias");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [selectedCategory, sortBy, getStoriesForGallery, searchTerm]);

  // Cargar historias cuando cambien los filtros
  useEffect(() => {
    loadStories();
  }, [loadStories]); // Solo loadStories como dependencia

  // Filtrar historias por búsqueda (local)
  const filteredStories = stories.filter((story) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      story.title.toLowerCase().includes(searchLower) ||
      story.author.toLowerCase().includes(searchLower) ||
      story.excerpt.toLowerCase().includes(searchLower)
    );
  });

  const categories = [
    { value: "all", label: "Todas las categorías" },
    { value: "Ficción", label: "Ficción" },
    { value: "Drama", label: "Drama" },
    { value: "Poesía", label: "Poesía" },
    { value: "Ensayo", label: "Ensayo" },
    { value: "Humor", label: "Humor" },
    { value: "Terror", label: "Terror" },
    { value: "Romance", label: "Romance" },
    { value: "Ciencia Ficción", label: "Ciencia Ficción" },
    { value: "Fantasía", label: "Fantasía" },
  ];

  const sortOptions = [
    { value: "recent", label: "Más recientes" },
    { value: "popular", label: "Más populares" },
    { value: "liked", label: "Más gustados" },
    { value: "viewed", label: "Más vistos" },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Hoy";
    if (diffInDays === 1) return "Ayer";
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return date.toLocaleDateString("es-ES");
  };

  const handleLikeToggle = async (storyId) => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para dar like a las historias");
      return;
    }

    // Verificar si se puede votar en esta historia
    const votingCheck = await canVoteInStory(storyId);
    if (!votingCheck.canVote) {
      alert(votingCheck.reason);
      return;
    }

    try {
      const result = await toggleLike(storyId);
      if (result.success) {
        // Actualizar el estado local
        setStories((prevStories) =>
          prevStories.map((story) =>
            story.id === storyId
              ? {
                  ...story,
                  likes_count: result.liked
                    ? story.likes_count + 1
                    : story.likes_count - 1,
                  isLiked: result.liked,
                }
              : story
          )
        );
      } else {
        alert(result.error || "Error al procesar el like");
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Error inesperado al procesar el like");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // La búsqueda se realiza automáticamente por el filtro local
  };

  const getBadgeColor = (category) => {
    switch (category) {
      case "Ficción":
        return "bg-blue-100 text-blue-700";
      case "Drama":
        return "bg-purple-100 text-purple-700";
      case "Poesía":
        return "bg-pink-100 text-pink-700";
      case "Terror":
        return "bg-red-100 text-red-700";
      case "Romance":
        return "bg-rose-100 text-rose-700";
      case "Ciencia Ficción":
        return "bg-cyan-100 text-cyan-700";
      case "Fantasía":
        return "bg-emerald-100 text-emerald-700";
      case "Humor":
        return "bg-yellow-100 text-yellow-700";
      case "Ensayo":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPhaseInfo = () => {
    if (!currentPhase) return null;

    switch (currentPhase) {
      case "submission":
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "Fase de envío - Las historias se mostrarán cuando inicie la votación",
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-800",
        };
      case "voting":
        return {
          icon: <Vote className="h-4 w-4" />,
          text: "Fase de votación - ¡Vota por tus historias favoritas!",
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800",
        };
      case "results":
        return {
          icon: <Trophy className="h-4 w-4" />,
          text: "Resultados finales - Concurso terminado",
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800",
        };
      default:
        return null;
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {showMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{location.state.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Galería de historias
        </h1>
        <p className="text-gray-600 mb-4">
          Descubre las mejores historias de nuestra comunidad de escritores
        </p>

        {/* Phase Info */}
        {phaseInfo && (
          <div className={`${phaseInfo.bgColor} border rounded-lg p-4`}>
            <div className={`flex items-center gap-2 ${phaseInfo.textColor}`}>
              {phaseInfo.icon}
              <span className="font-medium">{phaseInfo.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar historias, autores..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Cargando historias...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar las historias
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadStories} className="btn-primary">
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredStories.length} historia
            {filteredStories.length !== 1 ? "s" : ""} encontrada
            {filteredStories.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Stories Grid */}
      {!loading && !error && (
        <div className="grid gap-6">
          {filteredStories.map((story) => (
            <article
              key={story.id}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(
                      story.contestCategory
                    )}`}
                  >
                    {story.contestCategory}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {story.contestMonth}
                  </span>
                  {story.is_mature && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                      18+
                    </span>
                  )}
                  {story.is_winner && (
                    <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                      <Trophy className="h-3 w-3 mr-1" />
                      Ganador
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">{story.readTime}</div>
              </div>

              <Link to={`/story/${story.id}`} className="block">
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {story.title}
                </h2>
              </Link>

              <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                {story.excerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <Link
                        to={`/profile/${story.authorId}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {story.author}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {story.authorWins > 0 &&
                          `${story.authorWins} victorias`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(story.published_at || story.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {story.views_count}
                  </div>
                  <EnhancedVoteButton
                    isLiked={story.isLiked}
                    likesCount={story.likes_count}
                    canVote={true} // La gallery siempre permite votar si está autenticado
                    isAuthenticated={isAuthenticated}
                    onVote={() => handleLikeToggle(story.id)}
                    onAuthRequired={() => setShowAuthModal(true)}
                    size="small"
                  />
                  <Link
                    to={`/story/${story.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Leer completa →
                  </Link>
                </div>
              </div>

              {/* Prompt reference */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Prompt: <span className="italic">"{story.contestTitle}"</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredStories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron historias
          </h3>
          <p className="text-gray-600">
            {searchTerm.trim()
              ? "Intenta con otros términos de búsqueda o filtros diferentes"
              : "Aún no hay historias en esta categoría"}
          </p>
        </div>
      )}

      {/* CTA */}
      {!loading && !error && filteredStories.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Te inspiraste con estas historias?
          </h3>
          <p className="text-gray-600 mb-6">
            ¡Únete a la comunidad y comparte tu propia historia!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/write"
              className="btn-primary inline-flex items-center px-6 py-3"
            >
              Escribir mi historia
            </Link>
            <Link
              to="/contest/current"
              className="btn-secondary inline-flex items-center px-6 py-3"
            >
              Ver concurso actual
            </Link>
          </div>
        </div>
      )}
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Recargar para obtener el estado de likes del usuario
            loadStories();
          }}
        />
      )}
    </div>
  );
};

export default Gallery;
