import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Trophy, Settings, FileText, Edit3, Trash2, Eye, Heart, Plus } from 'lucide-react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures';
import UserBadgesSection from '../ui/UserBadgesSection';
import AllBadgesSection from '../ui/AllBadgesSection';
import { FEATURES } from '../../lib/config';
import { STORY_CATEGORIES, getCategoryByValue, CATEGORY_COLORS } from '../../lib/portfolio-constants';

const ProfileTabs = ({ user, votingStats }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { userStories, userStoriesLoading, deleteUserStory, currentContest, getContestPhase } = useGlobalApp();
  const { isPremium } = usePremiumFeatures();
  
  // Estados para historias del portafolio
  const [portfolioStories, setPortfolioStories] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const tabs = [
    {
      id: 'resumen',
      name: 'Resumen',
      icon: User,
      count: null
    },
    {
      id: 'historias',
      name: 'Mis Historias',
      icon: BookOpen,
      count: userStories.length > 0 ? userStories.length : null
    },
    {
      id: 'logros',
      name: 'Logros',
      icon: Trophy,
      count: null
    }
  ];

  // Agregar pestaña de portafolio si está habilitado y es premium
  if (FEATURES.PORTFOLIO_STORIES && isPremium) {
    tabs.splice(2, 0, {
      id: 'portafolio',
      name: 'Portafolio',
      icon: FileText,
      count: portfolioStories.length > 0 ? portfolioStories.length : null,
      premium: true
    });
  }

  // Agregar pestaña de configuración si premium está habilitado
  if (FEATURES.PREMIUM_PLANS) {
    tabs.push({
      id: 'configuracion',
      name: 'Configuración',
      icon: Settings,
      count: null
    });
  }

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // Función para eliminar historia con confirmación
  const handleDeleteStory = async (storyId, storyTitle) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar "${storyTitle}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmed) {
      const result = await deleteUserStory(storyId);
      if (result.success) {
        alert('✅ Historia eliminada exitosamente');
      } else {
        alert('❌ Error al eliminar: ' + result.error);
      }
    }
  };

  const ResumenTab = () => {
    // Calcular estadísticas en tiempo real desde userStories
    const { totalLikes, totalViews, recentStory } = useMemo(() => {
      const totalLikes = userStories.reduce(
        (total, story) => total + (story.likes_count || 0),
        0
      );
      const totalViews = userStories.reduce(
        (total, story) => total + (story.views_count || 0),
        0
      );
      const recentStory = userStories.length > 0 ? userStories[0] : null;
      
      return { totalLikes, totalViews, recentStory };
    }, [userStories]);

    return (
      <div className="space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userStories.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Historias</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalLikes}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Likes Recibidos</div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalViews}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lecturas</div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {votingStats?.userVotesCount || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Votos Dados</div>
          </div>
        </div>

        {/* Badges y Logros */}
        <UserBadgesSection
          userId={user?.id}
          userName={user?.name || user?.display_name || "Usuario"}
        />
        
        {/* Actividad Reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h3>
          {recentStory ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {recentStory.title}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  recentStory.contest?.status === 'submission' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : recentStory.contest?.status === 'voting'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {recentStory.contest?.status}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                Concurso: {recentStory.contest?.title}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{recentStory.word_count || 0} palabras</span>
                <span>{recentStory.likes_count || 0} ❤️ • {recentStory.views_count || 0} 👁️</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                ¡Escribe tu primera historia para ver tu actividad aquí!
              </p>
              <Link
                to={currentContest?.id ? `/contest/${currentContest.id}` : "/contest/current"}
                className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Concurso Actual
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  const HistoriasTab = () => {
    // Función helper para determinar si se puede editar/eliminar
    const canEditStory = (story) => {
      if (!story.contest) return false;
      
      // Usar getContestPhase para determinar la fase actual del concurso
      const phase = getContestPhase(story.contest);
      return phase === 'submission';
    };


    return (
      <div className="space-y-4">
        {userStoriesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando tus historias...</p>
          </div>
        ) : userStories.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aún no tienes historias
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ¡Participa en un concurso para escribir tu primera historia!
            </p>
            <Link
              to={currentContest?.id ? `/contest/${currentContest.id}` : "/contest/current"}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Ver Concurso Actual
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mis Historias ({userStories.length})
              </h3>
            </div>
            
            <div className="grid gap-4">
              {userStories.map((story) => (
                <div key={story.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {story.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                        Concurso: {story.contest?.title}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        story.contest?.status === 'submission' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : story.contest?.status === 'voting'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {story.contest?.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                      <span>{story.word_count || 0} palabras</span>
                      <span>•</span>
                      <span>{story.likes_count || 0} ❤️</span>
                      <span>•</span>
                      <span>{story.views_count || 0} 👁️</span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      {/* Ver historia */}
                      <Link
                        to={`/story/${story.id}`}
                        className="inline-flex items-center px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex-shrink-0"
                        title="Ver historia"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Ver</span>
                      </Link>
                      
                      {/* Editar historia (solo si está en submission) */}
                      {canEditStory(story) && (
                        <Link
                          to={`/write/${story.contest_id}?edit=${story.id}`}
                          className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm flex-shrink-0"
                          title="Editar historia"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                        </Link>
                      )}
                      
                      {/* Eliminar historia (solo si está en submission) */}
                      {canEditStory(story) && (
                        <button
                          onClick={() => handleDeleteStory(story.id, story.title)}
                          className="inline-flex items-center px-2 sm:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm flex-shrink-0"
                          title="Eliminar historia"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const LogrosTab = () => {
    const { totalLikes, totalViews } = useMemo(() => {
      const totalLikes = userStories.reduce(
        (total, story) => total + (story.likes_count || 0),
        0
      );
      const totalViews = userStories.reduce(
        (total, story) => total + (story.views_count || 0),
        0
      );
      return { totalLikes, totalViews };
    }, [userStories]);

    return (
      <div className="space-y-6">
        {/* Todos los Badges Disponibles */}
        <AllBadgesSection
          userId={user?.id}
          userName={user?.name || user?.display_name || "Usuario"}
        />
        
        {/* Estadísticas Básicas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tu Actividad
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userStories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Historias</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalLikes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totalViews}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lecturas</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {votingStats?.userVotesCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Votos</div>
            </div>
          </div>
        </div>
        
        {/* TODO: Próximos Objetivos - Comentado temporalmente para evitar inconsistencias
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximos Objetivos
          </h3>
          <div className="space-y-4">
            {userStories.length < 5 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">Escritor Novato</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {userStories.length}/5 historias
                </span>
              </div>
            )}
            
            {totalLikes < 50 && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">Popular</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {totalLikes}/50 likes
                </span>
              </div>
            )}
            
            {(votingStats?.userVotesCount || 0) < 25 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">Crítico Activo</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {votingStats?.userVotesCount || 0}/25 votos
                </span>
              </div>
            )}
          </div>
        </div>
        */}
      </div>
    );
  };

  const PortafolioTab = () => {
    // Filtrar historias del portafolio (contest_id === null)
    const portfolioStoriesData = useMemo(() => {
      return userStories.filter(story => !story.contest_id);
    }, [userStories]);

    // Estadísticas del portafolio
    const portfolioStats = useMemo(() => {
      const totalLikes = portfolioStoriesData.reduce((total, story) => total + (story.likes_count || 0), 0);
      const totalViews = portfolioStoriesData.reduce((total, story) => total + (story.views_count || 0), 0);
      const avgEngagement = totalViews > 0 ? ((totalLikes / totalViews) * 100) : 0;
      
      return { totalLikes, totalViews, avgEngagement };
    }, [portfolioStoriesData]);

    return (
      <div className="space-y-6">
        {/* Header con CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Portafolio Personal
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Premium
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Historias libres sin restricciones de concursos
            </p>
          </div>
          <Link
            to="/write/portfolio"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Historia
          </Link>
        </div>

        {/* Estadísticas del portafolio */}
        {portfolioStoriesData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {portfolioStoriesData.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Historias Libres</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {portfolioStats.totalLikes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {portfolioStats.totalViews}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lecturas</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {portfolioStats.avgEngagement.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Engagement</div>
            </div>
          </div>
        )}

        {/* Lista de historias del portafolio */}
        <div className="space-y-4">
          {userStoriesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando portafolio...</p>
            </div>
          ) : portfolioStoriesData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tu portafolio está vacío
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Crea historias libres sin restricciones de concursos. Explora cualquier tema, género o estilo que te inspire.
              </p>
              <Link
                to="/write/portfolio"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Escribir Primera Historia Libre
              </Link>
            </div>
          ) : (
            portfolioStoriesData.map((story) => {
              const category = getCategoryByValue(story.category);
              const categoryColor = CATEGORY_COLORS[category.color];
              
              return (
                <div
                  key={story.id}
                  className="bg-gradient-to-r from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {story.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                              {category.emoji} {category.label}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                            {story.excerpt}
                          </p>
                        </div>
                      </div>

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
                          <span>{story.word_count || 0} palabras</span>
                          <span>
                            {new Date(story.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/story/${story.id}`}
                            className="inline-flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Link>
                          <Link
                            to={`/edit/${story.id}`}
                            className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteStory(story.id, story.title)}
                            className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const ConfiguracionTab = () => (
    <div className="text-center py-8">
      <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Configuración de Cuenta
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Próximamente: configuraciones avanzadas de cuenta y preferencias
      </p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <ResumenTab />;
      case 'historias':
        return <HistoriasTab />;
      case 'portafolio':
        return <PortafolioTab />;
      case 'logros':
        return <LogrosTab />;
      case 'configuracion':
        return <ConfiguracionTab />;
      default:
        return <ResumenTab />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Tabs Header */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                {tab.count !== null && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${isActive 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProfileTabs;