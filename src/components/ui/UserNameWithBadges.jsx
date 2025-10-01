// components/ui/UserNameWithBadges.jsx - Nombre de usuario con badges de reconocimiento
import React from "react";
import { useBadgesCache } from "../../hooks/useBadgesCache";
import Badge from "./Badge";
import AuthorLink from "./AuthorLink";

const UserNameWithBadges = ({
  user,
  userId,
  userName,
  showAllBadges = false,
  className = "",
  badgeSize = "xs",
  layout = "horizontal", // horizontal | vertical
  linkToProfile = true, // Nueva prop para habilitar enlaces al perfil
}) => {
  const { userBadges, loading } = useBadgesCache(userId);

  // Determinar el nombre a mostrar
  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Crear objeto de autor para AuthorLink
  const authorObject = user || { 
    id: userId, 
    display_name: displayName,
    name: displayName 
  };

  // Filtrar badges importantes para mostrar (solo ganadores y logros altos)
  const importantBadges = showAllBadges
    ? userBadges
    : userBadges.filter((badge) => {
        // Mostrar solo badges de prestigio: ganadores, finalistas, y veteranos
        return [
          "contest_winner",
          "contest_finalist",
          "contest_winner_veteran",
          "writer_15",
        ].includes(badge.id);
      });

  // Componente de nombre (con o sin enlace)
  const NameComponent = ({ className: nameClassName = "" }) => {
    if (linkToProfile && (userId || user?.id)) {
      return (
        <AuthorLink 
          author={authorObject} 
          variant="simple" 
          className={nameClassName}
        />
      );
    }
    return (
      <span className={`font-medium text-gray-900 ${nameClassName}`}>
        {displayName}
      </span>
    );
  };

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        {/* Nombre */}
        <NameComponent className="text-center" />

        {/* Badges */}
        {!loading && importantBadges.length > 0 && (
          <div className="flex gap-1">
            {importantBadges.slice(0, 3).map((badge, index) => (
              <Badge
                key={badge.id || index}
                badge={badge}
                size={badgeSize}
                showDescription={true}
              />
            ))}
            {importantBadges.length > 3 && (
              <span className="text-xs text-gray-500 ml-1">
                +{importantBadges.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Layout horizontal (por defecto)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Nombre */}
      <NameComponent className="truncate" />

      {/* Badges */}
      {!loading && importantBadges.length > 0 && (
        <div className="flex items-center gap-1">
          {importantBadges.slice(0, 2).map((badge, index) => (
            <Badge
              key={badge.id || index}
              badge={badge}
              size={badgeSize}
              showDescription={true}
            />
          ))}
          {importantBadges.length > 2 && (
            <span className="text-xs text-gray-500">
              +{importantBadges.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Componente especializado para mostrar solo el badge más prestigioso
const UserWithTopBadge = ({ user, userId, userName, className = "", linkToProfile = true }) => {
  const { userBadges, loading } = useBadgesCache(userId);

  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Crear objeto de autor para AuthorLink
  const authorObject = user || { 
    id: userId, 
    display_name: displayName,
    name: displayName 
  };

  // Orden de prestigio para badges (mayor a menor)
  const prestigeOrder = {
    contest_winner_veteran: 5, // Ganador múltiple
    contest_winner: 4, // Ganador
    contest_finalist: 3, // Finalista
    writer_15: 2, // Veterano escritor
    writer_5: 1, // Escritor constante
    first_story: 0, // Primera historia
  };

  // Encontrar el badge de mayor prestigio
  const topBadge = userBadges
    .filter((badge) => prestigeOrder.hasOwnProperty(badge.id))
    .sort((a, b) => (prestigeOrder[b.id] || 0) - (prestigeOrder[a.id] || 0))[0];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {linkToProfile && (userId || user?.id) ? (
        <AuthorLink 
          author={authorObject} 
          variant="simple" 
          className="truncate dark:text-dark-300"
        />
      ) : (
        <span className="font-medium text-gray-900 dark:text-dark-300 truncate">
          {displayName}
        </span>
      )}

      {!loading && topBadge && (
        <Badge badge={topBadge} size="xs" showDescription={true} />
      )}
    </div>
  );
};

// Componente para mostrar solo badges de ganador/finalista
const UserWithWinnerBadges = ({ user, userId, userName, className = "", linkToProfile = true }) => {
  const { userBadges, loading } = useBadgesCache(userId);

  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Crear objeto de autor para AuthorLink
  const authorObject = user || { 
    id: userId, 
    display_name: displayName,
    name: displayName 
  };

  // Solo badges de retos
  const winnerBadges = userBadges.filter((badge) =>
    ["contest_winner", "contest_finalist", "contest_winner_veteran"].includes(
      badge.id
    )
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {linkToProfile && (userId || user?.id) ? (
        <AuthorLink 
          author={authorObject} 
          variant="simple" 
          className="truncate dark:text-gray-100"
        />
      ) : (
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {displayName}
        </span>
      )}

      {!loading && winnerBadges.length > 0 && (
        <div className="flex items-center gap-1">
          {winnerBadges.map((badge, index) => (
            <Badge
              key={badge.id || index}
              badge={badge}
              size="xs"
              showDescription={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserNameWithBadges;
export { UserWithTopBadge, UserWithWinnerBadges };
