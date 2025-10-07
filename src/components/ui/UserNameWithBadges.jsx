// components/ui/UserNameWithBadges.jsx - Nombre de usuario con badges de reconocimiento
import React from "react";
import { useBadgesCache } from "../../hooks/useBadgesCache";
import Badge from "./Badge";

const UserNameWithBadges = ({
  user,
  userId,
  userName,
  showAllBadges = false,
  className = "",
  badgeSize = "xs",
  layout = "horizontal", // horizontal | vertical
}) => {
  const { userBadges, loading } = useBadgesCache(userId);

  // Determinar el nombre a mostrar
  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Verificar si el usuario es Ko-fi supporter
  const isKofiSupporter = userBadges.some(badge => badge.id === "kofi_supporter");

  // Filtrar badges importantes para mostrar (solo ganadores y logros altos)
  const importantBadges = showAllBadges
    ? userBadges
    : userBadges.filter((badge) => {
        // Mostrar solo badges de prestigio: ganadores, finalistas, veteranos y supporters
        return [
          "kofi_supporter",
          "contest_winner",
          "contest_finalist",
          "contest_winner_veteran",
          "writer_15",
        ].includes(badge.id);
      });

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className} ${
        isKofiSupporter
          ? "relative px-3 py-2 rounded-lg border-2 border-transparent bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 bg-clip-padding animate-border-glow"
          : ""
      }`}>
        {isKofiSupporter && (
          <div className="absolute inset-0 rounded-lg bg-white dark:bg-dark-800 m-[2px]"></div>
        )}
        {/* Nombre */}
        <span className="font-medium text-gray-900 text-center relative z-10">
          {displayName}
        </span>

        {/* Badges */}
        {!loading && importantBadges.length > 0 && (
          <div className="flex gap-1 relative z-10">
            {importantBadges.slice(0, 3).map((badge, index) => (
              <Badge
                key={`${badge.id}-${badge.earned_at || index}`}
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
    <div className={`flex items-center gap-2 ${className} ${
      isKofiSupporter
        ? "relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 p-[2px]"
        : ""
    }`}>
      {isKofiSupporter && (
        <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-dark-800"></div>
      )}
      {/* Nombre */}
      <span className="font-medium text-gray-900 truncate relative z-10">
        {displayName}
      </span>

      {/* Badges */}
      {!loading && importantBadges.length > 0 && (
        <div className="flex items-center gap-1 relative z-10">
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
const UserWithTopBadge = ({ user, userId, userName, className = "" }) => {
  const { userBadges, loading } = useBadgesCache(userId);

  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Verificar si el usuario es Ko-fi supporter
  const isKofiSupporter = userBadges.some(badge => badge.id === "kofi_supporter");

  // Orden de prestigio para badges (mayor a menor)
  const prestigeOrder = {
    kofi_supporter: 6, // Ko-fi Supporter (máxima prioridad)
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
    <div className={`flex items-center gap-2 ${className} ${
      isKofiSupporter
        ? "relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 p-[2px]"
        : ""
    }`}>
      {isKofiSupporter && (
        <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-dark-800"></div>
      )}
      <span className="font-medium text-gray-900 dark:text-dark-300 truncate relative z-10">
        {displayName}
      </span>

      {!loading && topBadge && (
        <div className="relative z-10">
          <Badge badge={topBadge} size="xs" showDescription={true} />
        </div>
      )}
    </div>
  );
};

// Componente para mostrar solo badges de ganador/finalista
const UserWithWinnerBadges = ({ user, userId, userName, className = "" }) => {
  const { userBadges, loading } = useBadgesCache(userId);

  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Verificar si el usuario es Ko-fi supporter
  const isKofiSupporter = userBadges.some(badge => badge.id === "kofi_supporter");

  // Solo badges de retos
  const winnerBadges = userBadges.filter((badge) =>
    ["contest_winner", "contest_finalist", "contest_winner_veteran"].includes(
      badge.id
    )
  );

  return (
    <div className={`flex items-center gap-2 ${className} ${
      isKofiSupporter
        ? "relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 p-[2px]"
        : ""
    }`}>
      {isKofiSupporter && (
        <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-dark-800"></div>
      )}
      <span className="font-medium text-gray-900 dark:text-gray-100 truncate relative z-10">
        {displayName}
      </span>

      {!loading && winnerBadges.length > 0 && (
        <div className="flex items-center gap-1 relative z-10">
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
