// components/ui/UserBadgesSection.jsx - Sección de badges para el perfil de usuario
import React, { useState } from 'react';
import { Trophy, Award, Target, ChevronRight, ChevronDown } from 'lucide-react';
import { useBadges } from '../../hooks/useBadges'; // Mantener original para perfil completo
import Badge, { BadgeGrid, BadgeProgress } from './Badge';

const UserBadgesSection = ({ userId, userName = "Usuario" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const {
    userBadges,
    loading,
    error,
    getBadgeStats,
    getNextBadge,
    getUserStats
  } = useBadges(userId);

  const [nextStoryBadge, setNextStoryBadge] = useState(null);
  const [userStats, setUserStats] = useState(null);

  // Cargar próximo badge y estadísticas
  React.useEffect(() => {
    const loadNextBadge = async () => {
      const next = await getNextBadge('story_count');
      setNextStoryBadge(next);
      
      const stats = await getUserStats();
      setUserStats(stats);
    };

    if (userId) {
      loadNextBadge();
    }
  }, [userId, getNextBadge, getUserStats]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="flex gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-16 h-16 bg-gray-300 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <Trophy className="w-5 h-5" />
          <span className="text-sm">Error cargando badges: {error}</span>
        </div>
      </div>
    );
  }

  const badgeStats = getBadgeStats();
  const hasAnyBadges = userBadges.length > 0;

  // Filtrar badges según categoría seleccionada
  const filteredBadges = selectedCategory === 'all' 
    ? userBadges 
    : userBadges.filter(badge => {
        const criteria = badge.criteria || {};
        return criteria.type === selectedCategory;
      });

  const categories = [
    { id: 'all', name: 'Todos', icon: Trophy },
    { id: 'story_count', name: 'Escritura', icon: Award },
    { id: 'contest_winner', name: 'Concursos', icon: Target }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Badges de {userName}
              </h3>
              {hasAnyBadges ? (
                <p className="text-sm text-gray-600">
                  {badgeStats.total} badges conseguidos
                  {badgeStats.gold > 0 && ` • ${badgeStats.gold} de oro`}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  ¡Escribe tu primera historia para conseguir tu primer badge!
                </p>
              )}
            </div>
          </div>
          
          {hasAnyBadges && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              {isExpanded ? 'Ver menos' : 'Ver todos'}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!hasAnyBadges ? (
          /* Estado vacío */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">
              Aún no tienes badges
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Los badges se otorgan automáticamente cuando cumples ciertos logros.
            </p>
            
            {/* Mostrar progreso hacia primer badge */}
            {nextStoryBadge && userStats && (
              <BadgeProgress 
                currentCount={userStats.storyCount} 
                nextBadge={nextStoryBadge}
                className="max-w-sm mx-auto"
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Badges conseguidos */}
            <div>
              {!isExpanded ? (
                /* Vista compacta - solo primeros 4 badges */
                <BadgeGrid badges={userBadges} maxVisible={4} size="md" />
              ) : (
                /* Vista expandida */
                <div>
                  {/* Filtros por categoría */}
                  <div className="flex gap-2 mb-4">
                    {categories.map(category => {
                      const Icon = category.icon;
                      const categoryBadges = category.id === 'all' 
                        ? userBadges 
                        : userBadges.filter(badge => {
                            const criteria = badge.criteria || {};
                            return criteria.type === category.id;
                          });
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${selectedCategory === category.id 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          {category.name}
                          {categoryBadges.length > 0 && (
                            <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                              {categoryBadges.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Grid de badges filtrados */}
                  {filteredBadges.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                      {filteredBadges.map((badge, index) => (
                        <div key={badge.id || index} className="flex flex-col items-center">
                          <Badge badge={badge} size="md" />
                          <span className="text-xs text-gray-600 mt-2 text-center">
                            {badge.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No tienes badges en esta categoría aún
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progreso hacia siguiente badge */}
            {nextStoryBadge && userStats && (
              <div className="border-t border-gray-100 pt-6">
                <BadgeProgress 
                  currentCount={userStats.storyCount} 
                  nextBadge={nextStoryBadge}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBadgesSection;