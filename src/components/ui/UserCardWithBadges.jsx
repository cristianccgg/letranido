// components/ui/UserCardWithBadges.jsx - Card de usuario con avatar, nombre y badges con borde premium para supporters
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
}) => {
  const { userBadges, loading } = useBadgesCache(userId);

  // Determinar el nombre a mostrar
  const displayName = userName || user?.name || user?.display_name || "Usuario";

  // Verificar si el usuario es Ko-fi supporter
  const isKofiSupporter = userBadges.some(
    (badge) => badge.id === "kofi_supporter"
  );

  // Ordenar badges por importancia (Ko-fi y ganadores primero, luego el resto)
  // Si tienen la misma prioridad, mostrar el más reciente primero
  const sortedBadges = [...userBadges].sort((a, b) => {
    const priorityOrder = {
      kofi_supporter: 6,
      contest_winner_veteran: 5,
      contest_winner: 4,
      contest_finalist: 3,
      writer_15: 2,
      writer_5: 1,
      first_story: 0,
    };

    const priorityDiff = (priorityOrder[b.id] || -1) - (priorityOrder[a.id] || -1);

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
      className={`${className} ${
        isKofiSupporter ? "kofi-supporter-card" : ""
      }`}
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
          <div className="flex items-center gap-1 flex-shrink-0">
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
        <ProfileButton
          userId={userId}
          variant="primary"
          size="xs"
          showText={false}
        />
        </div>
      </div>
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

  const displayName = userName || user?.name || user?.display_name || "Usuario";

  const isKofiSupporter = userBadges.some(
    (badge) => badge.id === "kofi_supporter"
  );

  // Ordenar badges por importancia (Ko-fi y ganadores primero, luego el resto)
  // Si tienen la misma prioridad, mostrar el más reciente primero
  const sortedBadges = [...userBadges].sort((a, b) => {
    const priorityOrder = {
      kofi_supporter: 6,
      contest_winner_veteran: 5,
      contest_winner: 4,
      contest_finalist: 3,
      writer_15: 2,
      writer_5: 1,
      first_story: 0,
    };

    const priorityDiff = (priorityOrder[b.id] || -1) - (priorityOrder[a.id] || -1);

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
      className={`${className} ${
        isKofiSupporter ? "kofi-supporter-card" : ""
      }`}
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
    </div>
  );
};

export default UserCardWithBadges;
