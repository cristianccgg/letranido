// components/ui/AllBadgesSection.jsx - Muestra todos los badges disponibles
import React, { useState, useEffect } from "react";
import { Trophy, Award, Target, Lock, CheckCircle } from "lucide-react";
import { useBadges } from "../../hooks/useBadges";
import Badge from "./Badge";

const AllBadgesSection = ({ userId, userName = "Usuario" }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    userBadges,
    badgeDefinitions,
    loading,
    error,
    hasBadge,
    getUserStats,
  } = useBadges(userId);

  const [userStats, setUserStats] = useState(null);

  // Cargar estadísticas del usuario
  useEffect(() => {
    const loadStats = async () => {
      if (userId) {
        const stats = await getUserStats();
        setUserStats(stats);
      }
    };
    loadStats();
  }, [userId, getUserStats]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <Trophy className="w-5 h-5" />
          <span className="text-sm">Error cargando badges: {error}</span>
        </div>
      </div>
    );
  }

  // Categorizar badges
  const categorizedBadges = badgeDefinitions.reduce((acc, badge) => {
    const criteria = badge.criteria || {};
    const category = criteria.type || "other";

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {});

  // Ordenar badges por tier y threshold dentro de cada categoría
  Object.keys(categorizedBadges).forEach((category) => {
    categorizedBadges[category].sort((a, b) => {
      const tierDiff = (a.tier || 1) - (b.tier || 1);
      if (tierDiff !== 0) return tierDiff;

      const thresholdA = a.criteria?.threshold || 0;
      const thresholdB = b.criteria?.threshold || 0;
      return thresholdA - thresholdB;
    });
  });

  const categories = [
    { id: "all", name: "Todos", icon: Trophy, color: "purple" },
    { id: "story_count", name: "Escritura", icon: Award, color: "blue" },
    { id: "contest_winner", name: "Campeón", icon: Target, color: "yellow" },
    { id: "contest_wins", name: "Veterano", icon: Trophy, color: "red" },
  ];

  // Filtrar badges según categoría seleccionada
  const getFilteredBadges = () => {
    if (selectedCategory === "all") {
      return badgeDefinitions;
    }
    return categorizedBadges[selectedCategory] || [];
  };

  const filteredBadges = getFilteredBadges();

  // Función para determinar si el usuario cumple los criterios
  const meetsRequirements = (badge) => {
    if (!userStats) return false;

    const criteria = badge.criteria || {};

    switch (criteria.type) {
      case "story_count":
        return userStats.storyCount >= (criteria.threshold || 0);
      case "contest_wins":
        return userStats.contestWins >= (criteria.threshold || 0);
      case "contest_winner":
      case "contest_finalist":
        // Estos badges se otorgan manualmente, verificar si los tiene
        return hasBadge(badge.id);
      default:
        return false;
    }
  };

  // Función para obtener el progreso hacia un badge
  const getProgress = (badge) => {
    if (!userStats) return 0;

    const criteria = badge.criteria || {};
    const threshold = criteria.threshold || 1;

    switch (criteria.type) {
      case "story_count":
        return Math.min((userStats.storyCount / threshold) * 100, 100);
      case "contest_wins":
        return Math.min((userStats.contestWins / threshold) * 100, 100);
      default:
        return hasBadge(badge.id) ? 100 : 0;
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
              Todos los Badges Disponibles
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-400">
              Descubre todos los logros que puedes conseguir escribiendo
            </p>
          </div>
        </div>

        {/* Filtros por categoría */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryBadges =
              category.id === "all"
                ? badgeDefinitions
                : categorizedBadges[category.id] || [];

            const earnedCount = categoryBadges.filter((badge) =>
              hasBadge(badge.id)
            ).length;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  col-span-1 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    selectedCategory === category.id
                      ? `bg-${category.color}-100 text-${category.color}-700 dark:bg-${category.color}-900/30 dark:text-${category.color}-300 border border-${category.color}-200`
                      : "bg-primary-50 text-gray-600 hover:bg-gray-100 dark:bg-dark-700 dark:text-dark-400 dark:hover:bg-dark-600 border border-transparent"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>

                <span className="bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-dark-300 text-xs px-1.5 py-0.5 rounded-full">
                  {earnedCount}/{categoryBadges.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredBadges.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-dark-400">
              No hay badges en esta categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredBadges.map((badge) => {
              const earned = hasBadge(badge.id);
              const canEarn = meetsRequirements(badge);
              const progress = getProgress(badge);

              return (
                <div
                  key={badge.id}
                  className="flex flex-col items-center group"
                >
                  {/* Badge Visual */}
                  <div className="relative mb-3">
                    <div
                      className={`
                      transition-all duration-300 transform group-hover:scale-105
                      ${earned ? "" : "filter grayscale opacity-50"}
                    `}
                    >
                      <Badge
                        badge={badge}
                        size="md"
                        className={earned ? "" : "grayscale"}
                      />
                    </div>

                    {/* Status Icon */}
                    <div className="absolute -top-2 -right-2">
                      {earned ? (
                        <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                      ) : canEarn ? (
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            !
                          </span>
                        </div>
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400 bg-white rounded-full p-1" />
                      )}
                    </div>
                  </div>

                  {/* Badge Info */}
                  <div className="text-center">
                    <h4
                      className={`
                      font-medium text-sm mb-1 line-clamp-2
                      ${earned ? "text-gray-900 dark:text-dark-100" : "text-gray-500 dark:text-dark-400"}
                    `}
                    >
                      {badge.name}
                    </h4>

                    <p
                      className={`
                      text-xs mb-2 line-clamp-2
                      ${earned ? "text-gray-600 dark:text-dark-300" : "text-gray-400 dark:text-dark-500"}
                    `}
                    >
                      {badge.description}
                    </p>

                    {/* Progress Bar (solo para badges no conseguidos) */}
                    {!earned && progress > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5 mb-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Status Text */}
                    <div className="text-xs">
                      {earned ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓ Conseguido
                        </span>
                      ) : canEarn ? (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          ¡Disponible!
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-dark-500">
                          {badge.criteria?.type === "story_count" && userStats
                            ? `${userStats.storyCount}/${badge.criteria?.threshold || 0}`
                            : badge.criteria?.type === "contest_wins" &&
                                userStats
                              ? `${userStats.contestWins}/${badge.criteria?.threshold || 0}`
                              : "Bloqueado"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100 mb-3">
            Leyenda:
          </h4>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-dark-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Badge conseguido</span>
            </div>

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span>Aún no disponible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllBadgesSection;
