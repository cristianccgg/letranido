import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Eye,
  Calendar,
  Trophy,
  Heart,
} from "lucide-react";

const Gallery = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showMessage, setShowMessage] = useState(false);

  // Show success message if coming from submission
  useEffect(() => {
    if (location.state?.message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Mock data - esto vendrá de la API
  const texts = [
    {
      id: 1,
      title: "El Susurro de las Páginas",
      excerpt:
        "Entre las sombras de los estantes vacíos, el último libro parecía brillar con luz propia. Sus páginas amarillentas guardaban secretos que solo yo conocía, historias que habían susurrado a generaciones de lectores...",
      author: "Elena M.",
      authorId: "elena_m",
      category: "Ficción",
      likes: 45,
      views: 234,
      publishedAt: "2025-07-03T10:30:00Z",
      prompt: "El último libro de la biblioteca",
      isWinner: true,
      readTime: "3 min",
    },
    {
      id: 2,
      title: "Memorias de Papel",
      excerpt:
        "No era solo un libro, era una ventana al alma de todos los que habían pasado por esta biblioteca. Cada página contenía las lágrimas, risas y suspiros de miles de lectores que encontraron refugio entre estos muros...",
      author: "Carlos R.",
      authorId: "carlos_r",
      category: "Drama",
      likes: 38,
      views: 189,
      publishedAt: "2025-07-02T15:45:00Z",
      prompt: "El último libro de la biblioteca",
      isWinner: false,
      readTime: "4 min",
    },
    {
      id: 3,
      title: "La Guardiana de Historias",
      excerpt:
        "Había dedicado cincuenta años de su vida a cuidar estos libros, y ahora solo uno quedaba. Pero sabía que era el más importante de todos: el libro de los visitantes, lleno de nombres y sueños...",
      author: "Ana L.",
      authorId: "ana_l",
      category: "Ficción",
      likes: 52,
      views: 312,
      publishedAt: "2025-07-01T09:15:00Z",
      prompt: "El último libro de la biblioteca",
      isWinner: false,
      readTime: "5 min",
    },
    {
      id: 4,
      title: "El Eco del Silencio",
      excerpt:
        "En el silencio absoluto de la biblioteca vacía, solo quedaba el eco de todas las historias que habían resonado en este lugar. Y ese último libro era el recipiente de todos esos ecos...",
      author: "Miguel F.",
      authorId: "miguel_f",
      category: "Poesía",
      likes: 29,
      views: 156,
      publishedAt: "2025-06-30T20:00:00Z",
      prompt: "El último libro de la biblioteca",
      isWinner: false,
      readTime: "2 min",
    },
  ];

  const categories = [
    { value: "all", label: "Todas las categorías" },
    { value: "ficcion", label: "Ficción" },
    { value: "drama", label: "Drama" },
    { value: "poesia", label: "Poesía" },
    { value: "ensayo", label: "Ensayo" },
    { value: "humor", label: "Humor" },
  ];

  const sortOptions = [
    { value: "recent", label: "Más recientes" },
    { value: "popular", label: "Más populares" },
    { value: "liked", label: "Más gustados" },
    { value: "viewed", label: "Más vistos" },
  ];

  const filteredTexts = texts
    .filter((text) => {
      const matchesSearch =
        text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        text.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        text.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        text.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.likes + b.views - (a.likes + a.views);
        case "liked":
          return b.likes - a.likes;
        case "viewed":
          return b.views - a.views;
        case "recent":
        default:
          return new Date(b.publishedAt) - new Date(a.publishedAt);
      }
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Hoy";
    if (diffInDays === 1) return "Ayer";
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return date.toLocaleDateString("es-ES");
  };

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
        <p className="text-gray-600">
          Descubre las mejores historias de nuestra comunidad de escritores
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
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
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredTexts.length} historia{filteredTexts.length !== 1 ? "s" : ""}{" "}
          encontrada{filteredTexts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stories Grid */}
      <div className="grid gap-6">
        {filteredTexts.map((text) => (
          <article
            key={text.id}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    text.category === "Ficción"
                      ? "bg-blue-100 text-blue-700"
                      : text.category === "Drama"
                      ? "bg-purple-100 text-purple-700"
                      : text.category === "Poesía"
                      ? "bg-pink-100 text-pink-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {text.category}
                </span>
                {text.isWinner && (
                  <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                    <Trophy className="h-3 w-3 mr-1" />
                    Ganador
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">{text.readTime}</div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
              {text.title}
            </h2>

            <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
              {text.excerpt}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  por{" "}
                  <span className="font-medium text-gray-900">
                    {text.author}
                  </span>
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(text.publishedAt)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center text-gray-500 text-sm">
                  <Eye className="h-4 w-4 mr-1" />
                  {text.views}
                </div>
                <button className="flex items-center text-gray-500 hover:text-red-500 text-sm transition-colors">
                  <Heart className="h-4 w-4 mr-1" />
                  {text.likes}
                </button>
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  Leer completa →
                </button>
              </div>
            </div>

            {/* Prompt reference */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Prompt: <span className="italic">"{text.prompt}"</span>
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Empty State */}
      {filteredTexts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron historias
          </h3>
          <p className="text-gray-600">
            Intenta con otros términos de búsqueda o filtros diferentes
          </p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
