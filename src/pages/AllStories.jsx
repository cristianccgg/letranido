import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Search,
  Filter,
  Heart,
  Eye,
  Clock,
  User,
  Trophy,
  Loader,
  AlertCircle,
  ArrowRight,
  Grid3X3,
  List,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { UserWithWinnerBadges } from "../components/ui/UserNameWithBadges";
import UserAvatar from "../components/ui/UserAvatar";
import SEOHead from "../components/SEO/SEOHead";
import { supabase } from "../lib/supabase";
import { getCategoryName } from "../lib/storyCategories";

const AllStories = () => {
  const { contests } = useGlobalApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filtros desde URL
  const searchTerm = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const sortBy = searchParams.get("sort") || "best";
  const viewMode = searchParams.get("view") || "grid";

  // Estados locales para filtros
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Configuración
  const STORIES_PER_PAGE = 12;

  // Obtener categorías únicas de las historias cargadas
  const availableCategories = useMemo(() => {
    const categories = [...new Set(stories.map(s => s.story_category || s.contest_category))].filter(Boolean);
    return categories.sort();
  }, [stories]);

  // Usar historias de concursos finalizados desde el contexto global
  const finishedContests = useMemo(() => 
    contests.filter(c => c.status === "results"), 
    [contests]
  );

  // Función para cargar todas las historias de concursos finalizados
  const loadAllFinishedStories = async () => {
    try {
      setLoading(true);
      setError("");
      
      const allStories = [];
      
      // Para cada concurso finalizado, obtener sus historias usando la misma lógica que CurrentContest
      for (const contest of finishedContests) {
        try {
          // Usar la misma query simple que loadGalleryStories
          const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("contest_id", contest.id)
            .order("likes_count", { ascending: false })
            .order("created_at", { ascending: true });

          if (error) throw error;

          if (data && data.length > 0) {
            // Agregar información del concurso a cada historia
            const storiesWithContest = data.map(story => ({
              ...story,
              contest_title: contest.title,
              contest_month: contest.month,
              contest_category: contest.category,
              contest_status: contest.status,
              // El campo author ya debería estar en la historia, si no, usar placeholder
              author: story.author || 'Autor desconocido',
              // Si no hay story_category, usar por defecto basado en el concurso o 'Ficción'
              story_category: story.story_category || 'ficcion',
            }));
            
            allStories.push(...storiesWithContest);
          }
        } catch (contestError) {
          console.error(`Error loading stories for contest ${contest.id}:`, contestError);
        }
      }

      // Debug inicial: mostrar las primeras 3 historias antes de cargar usuarios
      if (allStories.length > 0) {
        console.log("📚 AllStories - Historias antes de cargar usuarios:", 
          allStories.slice(0, 3).map(s => ({
            title: s.title,
            author: s.author,
            user_id: s.user_id,
            excerpt_preview: s.excerpt?.substring(0, 50),
            contest_title: s.contest_title
          }))
        );
      }

      // Obtener nombres de usuarios para todas las historias
      if (allStories.length > 0) {
        const userIds = [...new Set(allStories.map(story => story.user_id))].filter(Boolean);
        
        if (userIds.length > 0) {
          try {
            const { data: userProfiles, error: userError } = await supabase
              .from("user_profiles")
              .select("id, display_name")
              .in("id", userIds);

            console.log("🔍 Query de usuarios - IDs buscados:", userIds);
            console.log("🔍 Respuesta de user_profiles:", { userProfiles, userError });

            if (userProfiles && userProfiles.length > 0) {
              // Crear mapa de usuarios para lookup rápido
              const userMap = {};
              userProfiles.forEach(profile => {
                userMap[profile.id] = profile.display_name || 'Usuario';
              });

              console.log("👥 Mapa de usuarios creado:", userMap);

              // Actualizar historias con nombres de usuario
              allStories.forEach(story => {
                if (story.user_id && userMap[story.user_id]) {
                  story.author = userMap[story.user_id];
                }
              });

              console.log("👥 Nombres de usuarios cargados:", userProfiles.length);
              
              // Debug final: mostrar historias con nombres actualizados
              console.log("📚 AllStories - Historias después de cargar usuarios:", 
                allStories.slice(0, 3).map(s => ({
                  title: s.title,
                  author: s.author,
                  user_id: s.user_id,
                  contest_title: s.contest_title
                }))
              );
            }
          } catch (userError) {
            console.error("Error cargando perfiles de usuario:", userError);
          }
        } else {
          console.log("ℹ️ No hay user_ids para buscar perfiles");
        }
      }

      setStories(allStories);
      setHasMore(false); // No pagination needed for now
      
    } catch (err) {
      console.error("Error cargando historias:", err);
      setError("Error al cargar las historias. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar historias iniciales
  useEffect(() => {
    if (finishedContests.length > 0) {
      loadAllFinishedStories();
    }
  }, [finishedContests.length]);

  // Función para manejar la búsqueda
  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  // Función para manejar filtros
  const handleFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  // Función para obtener tiempo de lectura
  const getReadingTime = (wordCount) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  // Filtrado y ordenamiento local de las historias cargadas
  const filteredAndSortedStories = useMemo(() => {
    if (!stories.length) return [];

    let filtered = [...stories];

    // Aplicar filtros
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(search) ||
        story.author.toLowerCase().includes(search) ||
        (story.excerpt && story.excerpt.toLowerCase().includes(search))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(story => 
        (story.story_category || story.contest_category) === categoryFilter
      );
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case "best":
        // Ganadoras primero, luego por popularidad, luego por fecha
        return filtered.sort((a, b) => {
          // Primero por is_winner
          if (b.is_winner !== a.is_winner) {
            return b.is_winner - a.is_winner;
          }
          // Luego por winner_position (menor número = mejor posición)
          if (a.winner_position && b.winner_position) {
            if (a.winner_position !== b.winner_position) {
              return a.winner_position - b.winner_position;
            }
          }
          // Luego por likes
          if ((b.likes_count || 0) !== (a.likes_count || 0)) {
            return (b.likes_count || 0) - (a.likes_count || 0);
          }
          // Finalmente por fecha
          return new Date(b.created_at) - new Date(a.created_at);
        });

      case "popular":
        return filtered.sort((a, b) => {
          if ((b.likes_count || 0) !== (a.likes_count || 0)) {
            return (b.likes_count || 0) - (a.likes_count || 0);
          }
          return new Date(a.created_at) - new Date(b.created_at);
        });

      case "views":
        return filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));

      case "recent":
      default:
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [stories, searchTerm, categoryFilter, sortBy]);

  return (
    <>
      <SEOHead
        title="Todas las Historias - Letranido"
        description="Descubre todas las historias de los concursos de escritura de Letranido. Lee obras creativas de nuestra comunidad de escritores, organizadas por popularidad, fecha y categoría."
        keywords="historias escritura, cuentos, relatos, literatura, escritores, concursos literatura"
        url="/historias"
        canonicalUrl="https://letranido.com/historias"
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-100">
              Historias para Leer
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-dark-300 text-lg mb-6">
            Explora todas las historias de nuestros concursos de escritura. 
            Descubre nuevos talentos y sumérgete en mundos creativos.
          </p>

          {/* Link al concurso actual */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 text-lg mb-2">
                  ¿Quieres participar escribiendo?
                </h3>
                <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                  Únete al concurso actual y comparte tu creatividad
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to="/contest/current"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Ver concurso actual
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 p-6 mb-8">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-500" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(localSearch)}
                    placeholder="Buscar por título, contenido o autor..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <button
                onClick={() => handleSearch(localSearch)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                Buscar
              </button>
            </div>

            {/* Filtros y vista */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                {/* Categoría */}
                <select
                  value={categoryFilter}
                  onChange={(e) => handleFilter('category', e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center'
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryName(category)}
                    </option>
                  ))}
                </select>

                {/* Ordenamiento */}
                <select
                  value={sortBy}
                  onChange={(e) => handleFilter('sort', e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center'
                  }}
                >
                  <option value="best">Más votadas</option>
                  <option value="popular">Más populares</option>
                  <option value="views">Más vistas</option>
                  <option value="recent">Más recientes</option>
                </select>
              </div>

              {/* Toggle de vista */}
              <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                <button
                  onClick={() => handleFilter('view', 'grid')}
                  className={`p-2 rounded transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-dark-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200'
                  }`}
                  title="Vista de tarjetas"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFilter('view', 'list')}
                  className={`p-2 rounded transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-dark-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200'
                  }`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtros activos */}
            {(searchTerm || categoryFilter) && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-dark-600">
                <span className="text-sm text-gray-600 dark:text-dark-400">Filtros activos:</span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                    "{searchTerm}"
                  </span>
                )}
                {categoryFilter && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    {categoryFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchParams({});
                    setLocalSearch('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-dark-400 dark:hover:text-dark-200 underline ml-2"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-dark-300">
            {loading ? "Cargando..." : 
             `${filteredAndSortedStories.length} historia${filteredAndSortedStories.length !== 1 ? "s" : ""} ${searchTerm || categoryFilter ? "encontrada" : "disponible"}${filteredAndSortedStories.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>

        {/* Lista de historias */}
        {loading && page === 0 ? (
          <div className="text-center py-12">
            <Loader className="h-12 w-12 animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-gray-600 dark:text-dark-300">Cargando historias...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => loadAllFinishedStories()}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        ) : filteredAndSortedStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">
              {searchTerm || categoryFilter ? "No se encontraron historias" : "No hay historias disponibles"}
            </h3>
            <p className="text-gray-600 dark:text-dark-300 mb-6">
              {searchTerm || categoryFilter 
                ? "Intenta con otros términos de búsqueda o filtros diferentes"
                : "Aún no hay historias de concursos finalizados"
              }
            </p>
            {searchTerm || categoryFilter ? (
              <button
                onClick={() => {
                  setSearchParams({});
                  setLocalSearch('');
                }}
                className="btn-primary"
              >
                Ver todas las historias
              </button>
            ) : (
              <Link to="/contest/current" className="btn-primary">
                Ver concurso actual
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Vista de tarjetas (Grid) */}
            {viewMode === 'grid' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedStories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-white dark:bg-dark-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-dark-600 hover:border-indigo-300 dark:hover:border-indigo-500 overflow-hidden group"
                  >
                    {/* Header con categoría */}
                    <div className="p-4 border-b border-gray-100 dark:border-dark-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-dark-100 text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {story.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <UserAvatar
                              user={{
                                name: story.author,
                                email: `${story.author}@mock.com`,
                              }}
                              size="xs"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-dark-200">
                              por {story.author}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 ml-2">
                          {/* Indicador de ganador - movido aquí */}
                          {(story.winner_position && story.winner_position <= 3) || story.is_winner ? (
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-lg ${
                              story.winner_position === 1 || (story.is_winner && !story.winner_position)
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg' 
                                : story.winner_position === 2
                                ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                                : 'bg-gradient-to-r from-amber-600 to-amber-800'
                            }`}
                            title={story.winner_position === 1 ? 'Primer lugar' : 
                                   story.winner_position === 2 ? 'Segundo lugar' : 
                                   story.winner_position === 3 ? 'Tercer lugar' : 'Ganador'}>
                              {(story.winner_position === 1 || (story.is_winner && !story.winner_position)) && '👑'}
                              {story.winner_position === 2 && '🥈'}
                              {story.winner_position === 3 && '🥉'}
                            </div>
                          ) : null}
                          
                          <span className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                            {getCategoryName(story.story_category || story.contest_category)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-dark-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {story.contest_month}
                        </span>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-4">
                      {/* Excerpt - usar la misma lógica que CurrentContest */}
                      <div
                        className="text-gray-600 dark:text-dark-400 text-sm line-clamp-3 mb-4"
                        dangerouslySetInnerHTML={{
                          __html: story.excerpt || "Sin vista previa disponible.",
                        }}
                      />

                      {/* Metadatos */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-400 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            {story.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-blue-500" />
                            {story.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getReadingTime(story.word_count)}
                          </span>
                        </div>
                      </div>

                      {/* Botón de lectura */}
                      <Link
                        to={`/story/${story.id}?from=historias`}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Leer historia
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista de lista compacta */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
                <div className="divide-y divide-gray-200 dark:divide-dark-600">
                  {filteredAndSortedStories.map((story) => (
                    <div
                      key={story.id}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        {/* Título y autor */}
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-dark-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {story.title}
                            </h3>
                            
                            {/* Indicador de ganador - muy compacto */}
                            {(story.winner_position && story.winner_position <= 3) || story.is_winner ? (
                              <span className="text-sm" title={story.winner_position === 1 ? 'Primer lugar' : 
                                     story.winner_position === 2 ? 'Segundo lugar' : 
                                     story.winner_position === 3 ? 'Tercer lugar' : 'Ganador'}>
                                {(story.winner_position === 1 || (story.is_winner && !story.winner_position)) && '👑'}
                                {story.winner_position === 2 && '🥈'}
                                {story.winner_position === 3 && '🥉'}
                              </span>
                            ) : null}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600 dark:text-dark-300">
                              por {story.author}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-dark-400">
                              • {story.contest_month}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 text-xs rounded">
                              {getCategoryName(story.story_category || story.contest_category)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Estadísticas y botón */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 dark:text-dark-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              {story.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-blue-500" />
                              {story.views_count || 0}
                            </span>
                          </div>
                          
                          <Link
                            to={`/story/${story.id}?from=historias`}
                            className="inline-flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                          >
                            Leer
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}

        {/* CTA final */}
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-8 text-center">
          <BookOpen className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ¿Te inspiraste leyendo estas historias?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Únete a nuestra comunidad y comparte tu propia creatividad
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contest/current"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Trophy className="h-5 w-5 mr-3" />
              Participar en concurso
              <ArrowRight className="h-5 w-5 ml-3" />
            </Link>
            <Link
              to="/contest-history"
              className="inline-flex items-center px-6 py-3 bg-white dark:bg-dark-800 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
            >
              Ver historial por concursos
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AllStories;