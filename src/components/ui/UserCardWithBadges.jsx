// components/ui/UserCardWithBadges.jsx - Card de usuario con avatar, nombre y badges con borde premium para supporters
import { useState } from "react";
import { createPortal } from "react-dom";
import { useBadgesCache } from "../../hooks/useBadgesCache";
import UserAvatar from "./UserAvatar";
import Badge from "./Badge";
import ProfileButton from "./ProfileButton";
import "./UserCardWithBadges.css";

const UserCardWithBadges = ({
  user,
  userId,
  userName,
  userEmail,
  avatarSize = "md",
  badgeSize = "xs",
  maxBadges = 2,
  showAllBadges = false,
  className = "",
  disableProfileLink = false, // Nueva prop para deshabilitar ProfileButton cuando está dentro de otro Link
}) => {
  const { userBadges, loading } = useBadgesCache(userId);

  // Estado para tooltip del corazón Ko-fi
  const [showKofiTooltip, setShowKofiTooltip] = useState(false);
  const [kofiTooltipPos, setKofiTooltipPos] = useState({ x: 0, y: 0 });

  // Determinar el nombre a mostrar
  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Verificar si el usuario es Ko-fi supporter
  const isKofiSupporter = userBadges.some(
    (badge) => badge.id === "kofi_supporter"
  );

  // Filtrar el badge de Ko-fi supporter (se muestra en la esquina del contenedor)
  // Ordenar badges por importancia (Logros de competencia primero, luego el resto)
  // Si tienen la misma prioridad, mostrar el más reciente primero
  const sortedBadges = [...userBadges]
    .filter((badge) => badge.id !== "kofi_supporter") // Excluir Ko-fi supporter de la lista normal
    .sort((a, b) => {
      const priorityOrder = {
        contest_winner_veteran: 5, // Múltiples victorias - prioridad máxima
        contest_winner: 4, // Al menos una victoria
        contest_finalist: 3, // Top 3 en un reto
        writer_15: 2,
        writer_5: 1,
        first_story: 0,
      };

      const priorityDiff =
        (priorityOrder[b.id] || -1) - (priorityOrder[a.id] || -1);

      // Si tienen la misma prioridad, ordenar por fecha más reciente
      if (priorityDiff === 0) {
        const dateA = new Date(a.earned_at || a.created_at || 0);
        const dateB = new Date(b.earned_at || b.created_at || 0);
        return dateB - dateA; // Más reciente primero
      }

      return priorityDiff;
    });

  const badgesToShow = showAllBadges ? sortedBadges : sortedBadges;

  return (
    <div
      className={`${className} ${isKofiSupporter ? "kofi-supporter-card" : ""}`}
    >
      {isKofiSupporter && (
        <>
          {/* Shimmer animado */}
          <div className="kofi-shimmer"></div>
          {/* Destellos en esquinas */}
          <div className="kofi-sparkle kofi-sparkle-tl"></div>
          <div className="kofi-sparkle kofi-sparkle-tr"></div>
          <div className="kofi-sparkle kofi-sparkle-bl"></div>
          <div className="kofi-sparkle kofi-sparkle-br"></div>
          {/* Corazón pequeño en esquina superior derecha */}
          <div
            className="absolute top-0 right-0 z-20 cursor-help"
            style={{
              transform: "translate(35%, -35%)",
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setKofiTooltipPos({
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
              });
              setShowKofiTooltip(true);
            }}
            onMouseLeave={() => setShowKofiTooltip(false)}
          >
            <div
              className="w-6 h-6 p-1 bg-linear-to-br from-pink-400 via-rose-500 to-red-500 border-2 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden hover:scale-110 transition-transform duration-200"
              style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-tr from-white/30 to-transparent rounded-full"></div>

              {/* SVG del corazón - mismo del badge */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 text-white relative z-10"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  opacity="0.3"
                />
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </>
      )}

      <div
        className={`flex items-center gap-2 px-2 py-1.5 ${
          isKofiSupporter ? "kofi-supporter-card-inner" : ""
        }`}
      >
        {/* Avatar */}
        <div className="relative z-10">
          <UserAvatar
            user={{
              name: displayName,
              email: userEmail || user?.email || `${displayName}@user.com`,
            }}
            size={avatarSize}
          />
        </div>

        {/* Nombre y badges */}
        <div className="flex items-center gap-2 min-w-0 flex-1 relative z-10">
          <span className="font-medium text-gray-900 dark:text-dark-300 truncate">
            {displayName}
          </span>

          {/* Badges */}
          {!loading && badgesToShow.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {badgesToShow.slice(0, maxBadges).map((badge, index) => (
                <Badge
                  key={`${badge.id}-${badge.earned_at || index}`}
                  badge={badge}
                  size={badgeSize}
                  showDescription={true}
                />
              ))}
            </div>
          )}

          {/* Profile Button - inline, solo icono */}
          {!disableProfileLink && (
            <ProfileButton
              userId={userId}
              variant="primary"
              size="xs"
              showText={false}
            />
          )}
        </div>
      </div>

      {/* Tooltip del corazón Ko-fi - renderizado como portal */}
      {showKofiTooltip &&
        createPortal(
          <div
            className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-9999 pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs"
            style={{
              left: `${kofiTooltipPos.x}px`,
              top: `${kofiTooltipPos.y}px`,
            }}
          >
            <div className="font-semibold">Ko-fi Supporter</div>
            <div className="text-xs text-pink-300 mt-1">
              ¡Gracias por apoyar Letranido! ❤️
            </div>

            {/* Flecha del tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>,
          document.body
        )}
    </div>
  );
};

// Variante vertical para usar en tarjetas o perfiles
export const UserCardWithBadgesVertical = ({
  user,
  userId,
  userName,
  userEmail,
  avatarSize = "lg",
  badgeSize = "sm",
  maxBadges = 3,
  showAllBadges = false,
  className = "",
}) => {
  const { userBadges, loading } = useBadgesCache(userId);

  // Estado para tooltip del corazón Ko-fi
  const [showKofiTooltip, setShowKofiTooltip] = useState(false);
  const [kofiTooltipPos, setKofiTooltipPos] = useState({ x: 0, y: 0 });

  const displayName = userName || user?.name || user?.display_name || "Usuario";

  const isKofiSupporter = userBadges.some(
    (badge) => badge.id === "kofi_supporter"
  );

  // Filtrar el badge de Ko-fi supporter (se muestra en la esquina del contenedor)
  // Ordenar badges por importancia (Logros de competencia primero, luego el resto)
  // Si tienen la misma prioridad, mostrar el más reciente primero
  const sortedBadges = [...userBadges]
    .filter((badge) => badge.id !== "kofi_supporter") // Excluir Ko-fi supporter de la lista normal
    .sort((a, b) => {
      const priorityOrder = {
        contest_winner_veteran: 5, // Múltiples victorias - prioridad máxima
        contest_winner: 4, // Al menos una victoria
        contest_finalist: 3, // Top 3 en un reto
        writer_15: 2,
        writer_5: 1,
        first_story: 0,
      };

      const priorityDiff =
        (priorityOrder[b.id] || -1) - (priorityOrder[a.id] || -1);

      // Si tienen la misma prioridad, ordenar por fecha más reciente
      if (priorityDiff === 0) {
        const dateA = new Date(a.earned_at || a.created_at || 0);
        const dateB = new Date(b.earned_at || b.created_at || 0);
        return dateB - dateA; // Más reciente primero
      }

      return priorityDiff;
    });

  const badgesToShow = showAllBadges ? sortedBadges : sortedBadges;

  return (
    <div
      className={`${className} ${isKofiSupporter ? "kofi-supporter-card" : ""}`}
    >
      {isKofiSupporter && (
        <>
          {/* Shimmer animado */}
          <div className="kofi-shimmer"></div>
          {/* Destellos en esquinas */}
          <div className="kofi-sparkle kofi-sparkle-tl"></div>
          <div className="kofi-sparkle kofi-sparkle-tr"></div>
          <div className="kofi-sparkle kofi-sparkle-bl"></div>
          <div className="kofi-sparkle kofi-sparkle-br"></div>
          {/* Corazón pequeño en esquina superior derecha */}
          <div
            className="absolute top-0 right-0 z-20 cursor-help"
            style={{
              transform: "translate(35%, -35%)",
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setKofiTooltipPos({
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
              });
              setShowKofiTooltip(true);
            }}
            onMouseLeave={() => setShowKofiTooltip(false)}
          >
            <div
              className="w-6 h-6 p-1 bg-linear-to-br from-pink-400 via-rose-500 to-red-500 border-2 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden hover:scale-110 transition-transform duration-200"
              style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-tr from-white/30 to-transparent rounded-full"></div>

              {/* SVG del corazón - mismo del badge */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 text-white relative z-10"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  opacity="0.3"
                />
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </>
      )}

      <div
        className={`flex flex-col items-center gap-2 px-4 py-3 ${
          isKofiSupporter ? "kofi-supporter-card-inner" : ""
        }`}
      >
        {/* Avatar */}
        <div className="relative z-10">
          <UserAvatar
            user={{
              name: displayName,
              email: userEmail || user?.email || `${displayName}@user.com`,
            }}
            size={avatarSize}
          />
        </div>

        {/* Nombre con Profile Button */}
        <div className="flex items-center gap-2 relative z-10">
          <span className="font-medium text-gray-900 dark:text-dark-300 text-center">
            {displayName}
          </span>
          <ProfileButton
            userId={userId}
            variant="primary"
            size="xs"
            showText={false}
          />
        </div>

        {/* Badges */}
        {!loading && badgesToShow.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1 relative z-10">
            {badgesToShow.slice(0, maxBadges).map((badge, index) => (
              <Badge
                key={`${badge.id}-${badge.earned_at || index}`}
                badge={badge}
                size={badgeSize}
                showDescription={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tooltip del corazón Ko-fi - renderizado como portal */}
      {showKofiTooltip &&
        createPortal(
          <div
            className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-9999 pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs"
            style={{
              left: `${kofiTooltipPos.x}px`,
              top: `${kofiTooltipPos.y}px`,
            }}
          >
            <div className="font-semibold">Ko-fi Supporter</div>
            <div className="text-xs text-pink-300 mt-1">
              ¡Gracias por apoyar Letranido! ❤️
            </div>

            {/* Flecha del tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default UserCardWithBadges;
