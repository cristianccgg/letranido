import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Eye, Heart, BookOpen, Clock, User, Plus, Crown } from 'lucide-react';
import { useGlobalApp } from '../contexts/GlobalAppContext';
import { usePremiumFeatures } from '../hooks/usePremiumFeatures';
import { useGoogleAnalytics, AnalyticsEvents } from '../hooks/useGoogleAnalytics';
import { FEATURES } from '../lib/config';
import { STORY_CATEGORIES, getCategoryByValue, CATEGORY_COLORS, FEED_CONFIG } from '../lib/portfolio-constants';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import SEOHead from '../components/SEO/SEOHead';
import UserAvatar from '../components/ui/UserAvatar';
import UserCardWithBadges from '../components/ui/UserCardWithBadges';
import ProfileButton from '../components/ui/ProfileButton';

const FreeStories = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useGlobalApp();
  const { isPremium } = usePremiumFeatures();
  const { trackEvent } = useGoogleAnalytics();

  // Estados
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filtros desde URL
  const searchTerm = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || FEED_CONFIG.DEFAULT_SORT;

  // Estados locales para filtros
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);

  // Verificar que el feature esté habilitado
  const isFeatureEnabled = FEATURES.PORTFOLIO_STORIES;

  // Función para cargar historias
  const loadStories = async (reset = false) => {
    if (!isFeatureEnabled) return;

    try {
      setLoading(true);
      const offset = reset ? 0 : page * FEED_CONFIG.STORIES_PER_PAGE;

      // Usar la función SQL get_free_stories
      const { data, error } = await supabase.rpc('get_free_stories', {
        limit_count: FEED_CONFIG.STORIES_PER_PAGE,
        offset_count: offset,
        category_filter: categoryFilter || null
      });

      if (error) throw error;

      // Los datos ya vienen procesados de la función SQL
      const processedStories = data || [];

      if (reset) {
        setStories(processedStories);
        setPage(1);
      } else {
        setStories(prev => [...prev, ...processedStories]);
        setPage(prev => prev + 1);
      }

      setHasMore(processedStories.length === FEED_CONFIG.STORIES_PER_PAGE);

    } catch (error) {
      logger.error('❌ Error cargando historias libres:', error);
      setError('Error al cargar las historias libres');
    } finally {
      setLoading(false);
    }
  };

  // Cargar historias iniciales
  useEffect(() => {
    if (isFeatureEnabled) {
      loadStories(true);
    }
  }, [searchTerm, categoryFilter, sortBy, isFeatureEnabled]);

  // Función para manejar la búsqueda
  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
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

  // Función para manejar clic en historia
  const handleStoryClick = (storyId) => {
    trackEvent(AnalyticsEvents.STORY_VIEWED, {
      story_id: storyId,
      source: 'free_stories_feed'
    });
    navigate(`/story/${storyId}`);
  };

  // Función para obtener tiempo de lectura
  const getReadingTime = (wordCount) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  // Si el feature no está habilitado, mostrar 404 o redirección
  if (!isFeatureEnabled) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          La página que buscas no está disponible.
        </p>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <SEOHead
        title="Historias Libres - Letranido"
        description="Descubre historias originales sin restricciones de retos. Creatividad libre de la comunidad de escritores de Letranido."
        keywords="historias libres, escritura libre, creatividad, portafolio, literatura"
        url="/stories"
      />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Historias Libres
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Creatividad sin límites. Explora historias originales creadas por nuestra comunidad 
          fuera de los retos tradicionales.
        </p>

        {/* CTA para crear historia */}
        {isPremium ? (
          <Link
            to="/write/portfolio"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Escribir Historia Libre
          </Link>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
              <Crown className="h-5 w-5" />
              <span className="font-medium">
                Las historias libres son una función Premium
              </span>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              Únete a Premium para crear historias sin restricciones de retos
            </p>
            <Link
              to="/planes"
              className="inline-flex items-center mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Ver Planes Premium
            </Link>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(localSearch)}
                placeholder="Buscar historias..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex gap-2">
            {/* Categoría */}
            <select
              value={categoryFilter}
              onChange={(e) => handleFilter('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las categorías</option>
              {STORY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>

            {/* Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => handleFilter('sort', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="recent">Más recientes</option>
              <option value="popular">Más populares</option>
              <option value="views">Más vistas</option>
            </select>

            {/* Buscar */}
            <button
              onClick={() => handleSearch(localSearch)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Filtros activos */}
        {(searchTerm || categoryFilter) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Filtros activos:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Búsqueda: "{searchTerm}"
              </span>
            )}
            {categoryFilter && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {getCategoryByValue(categoryFilter).emoji} {getCategoryByValue(categoryFilter).label}
              </span>
            )}
            <button
              onClick={() => {
                setSearchParams({});
                setLocalSearch('');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de historias */}
      <div className="space-y-4">
        {loading && page === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando historias libres...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => loadStories(true)}
              className="mt-4 btn-primary"
            >
              Reintentar
            </button>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm || categoryFilter ? 'No se encontraron historias' : 'Aún no hay historias libres'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || categoryFilter 
                ? 'Intenta con otros términos de búsqueda o filtros'
                : 'Sé el primero en crear una historia libre'
              }
            </p>
            {isPremium && !(searchTerm || categoryFilter) && (
              <Link to="/write/portfolio" className="btn-primary">
                Escribir Primera Historia Libre
              </Link>
            )}
          </div>
        ) : (
          <>
            {stories.map((story) => {
              const category = getCategoryByValue(story.category);
              const categoryColor = CATEGORY_COLORS[category.color];
              
              return (
                <div
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {story.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                              {category.emoji} {category.label}
                            </span>
                          </div>
                          
                          {/* Autor */}
                          <div className="flex items-center justify-between mb-2">
                            <UserCardWithBadges
                              userId={story.user_id}
                              userName={story.author}
                              avatarSize="xs"
                              badgeSize="xs"
                              maxBadges={1}
                              className="text-sm"
                            />
                            <ProfileButton userId={story.user_id} variant="subtle" size="xs" />
                          </div>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                        {story.excerpt}
                      </p>

                      {/* Metadatos */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            {story.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-blue-500" />
                            {story.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getReadingTime(story.word_count)}
                          </span>
                          <span>
                            {new Date(story.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStoryClick(story.id);
                          }}
                          className="inline-flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          Leer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Cargar más */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={() => loadStories(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Cargar más historias'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FreeStories;