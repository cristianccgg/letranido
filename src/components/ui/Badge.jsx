// components/ui/Badge.jsx - Sistema de badges con diseños CSS/SVG profesionales
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FEATURES } from "../../lib/config";

// Importar imágenes de badges custom (solo se usan si FEATURES.USE_CUSTOM_BADGE_IMAGES está activo)
import primeraPlumaBadge from "../../assets/badges/primera_pluma.png";

// Mapeo de badge IDs a imágenes custom
const customBadgeImages = {
  first_story: primeraPlumaBadge,
  // Agregar más badges aquí conforme los vayas creando:
  // writer_5: escritorBadge,
  // writer_15: escritorProlificoBadge,
  // etc.
};

const Badge = ({
  badge,
  size = "md",
  showDescription = true,
  animate = false,
  className = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const badgeRef = useRef(null);

  const handleMouseEnter = () => {
    if (badgeRef.current && showDescription) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };
  // Definición de iconos SVG para cada tipo de badge
  const badgeIcons = {
    feather: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M7.5 8.5L12 3l4.5 5.5v4.5L12 21l-4.5-8V8.5z" opacity="0.2" />
        <path d="M7.5 8.5L12 3l4.5 5.5M12 3v18M7.5 8.5h9M9 11h6M10.5 13.5h3" />
      </svg>
    ),
    "book-open": (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path
          d="M12 2C8 2 8 5 8 5s0-3-4-3v16c4 0 4 3 4 3s0-3 4-3V2z"
          opacity="0.2"
        />
        <path
          d="M2 5c4 0 4-3 8-3s8 3 8 3v16c-4 0-4-3-8-3s-4 3-8 3V5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 2v16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    scroll: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <rect x="5" y="4" width="14" height="16" rx="2" opacity="0.2" />
        <path
          d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M7 8h10M7 12h10M7 16h6"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M5 16l3-8 4 6 4-6 3 8H5z" opacity="0.3" />
        <path
          d="M5 16l3-8 4 6 4-6 3 8H5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="6" r="2" fill="currentColor" />
        <circle cx="5" cy="8" r="1.5" fill="currentColor" />
        <circle cx="19" cy="8" r="1.5" fill="currentColor" />
        <path d="M3 18h18" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    medal: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <circle cx="12" cy="15" r="6" opacity="0.2" />
        <circle
          cx="12"
          cy="15"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 3l2 8M16 3l-2 8M12 9v12"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="15" r="2" fill="currentColor" />
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path
          d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m0 4v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7m0-4h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect x="8" y="5" width="8" height="12" rx="1" opacity="0.2" />
        <path d="M10 20h4M12 17v3" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="9" r="2" fill="currentColor" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
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
    ),
    coffee: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path
          d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"
          opacity="0.2"
        />
        <path
          d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 2v2M10 2v2M14 2v2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    // Nuevos iconos para badges de enero 2026
    "pen-tool": (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 19l7-7 3 3-7 7-3-3z" opacity="0.2" />
        <path
          d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="11" r="2" fill="currentColor" />
      </svg>
    ),
    flag: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" opacity="0.2" />
        <path
          d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4 22V15" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    compass: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <circle cx="12" cy="12" r="10" opacity="0.2" />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <polygon
          points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    ),
    "check-circle": (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <circle cx="12" cy="12" r="10" opacity="0.2" />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M9 12l2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  // Colores predefinidos según el tier y tipo
  const badgeColors = {
    1: {
      // Bronze/Green - Básico
      bg: "from-emerald-400 to-emerald-600",
      border: "border-emerald-300",
      glow: "shadow-emerald-500/50",
      text: "text-emerald-800",
    },
    2: {
      // Silver/Blue - Intermedio
      bg: "from-blue-400 to-blue-600",
      border: "border-blue-300",
      glow: "shadow-blue-500/50",
      text: "text-blue-800",
    },
    3: {
      // Gold/Purple - Avanzado
      bg: "from-purple-500 to-purple-700",
      border: "border-purple-300",
      glow: "shadow-purple-500/50",
      text: "text-purple-800",
    },
  };

  // Colores especiales para badges específicos
  const specialColors = {
    contest_winner: {
      bg: "from-yellow-400 to-amber-500",
      border: "border-yellow-300",
      glow: "shadow-yellow-500/60",
      text: "text-yellow-900",
    },
    contest_finalist: {
      bg: "from-blue-300 to-blue-500",
      border: "border-blue-200",
      glow: "shadow-blue-400/50",
      text: "text-blue-800",
    },
    contest_winner_veteran: {
      bg: "from-red-500 to-red-700",
      border: "border-red-300",
      glow: "shadow-red-500/60",
      text: "text-red-800",
    },
    kofi_supporter: {
      bg: "from-pink-400 via-rose-500 to-red-500",
      border: "border-pink-300",
      glow: "shadow-pink-500/70",
      text: "text-pink-900",
    },
    // Nuevos badges - Enero 2026
    writer_25: {
      bg: "from-violet-500 to-purple-700",
      border: "border-violet-300",
      glow: "shadow-violet-500/60",
      text: "text-violet-900",
    },
    participant_10: {
      bg: "from-indigo-500 to-indigo-700",
      border: "border-indigo-300",
      glow: "shadow-indigo-500/60",
      text: "text-indigo-900",
    },
    explorer_30: {
      bg: "from-amber-400 to-orange-500",
      border: "border-amber-300",
      glow: "shadow-amber-500/60",
      text: "text-amber-900",
    },
    voter_10: {
      bg: "from-pink-500 to-rose-600",
      border: "border-pink-300",
      glow: "shadow-pink-500/60",
      text: "text-pink-900",
    },
  };

  // Tamaños predefinidos
  const sizes = {
    xs: {
      container: "w-8 h-8",
      icon: "w-4 h-4",
      text: "text-xs",
      padding: "p-1",
    },
    sm: {
      container: "w-12 h-12",
      icon: "w-6 h-6",
      text: "text-sm",
      padding: "p-2",
    },
    md: {
      container: "w-16 h-16",
      icon: "w-8 h-8",
      text: "text-base",
      padding: "p-3",
    },
    lg: {
      container: "w-20 h-20",
      icon: "w-10 h-10",
      text: "text-lg",
      padding: "p-4",
    },
  };

  if (!badge) return null;

  const sizeClasses = sizes[size] || sizes.md;
  const colors =
    specialColors[badge.id] || badgeColors[badge.tier] || badgeColors[1];
  const icon = badgeIcons[badge.icon] || badgeIcons.feather;

  // Verificar si hay imagen custom para este badge
  const customImage = FEATURES.USE_CUSTOM_BADGE_IMAGES ? customBadgeImages[badge.id] : null;

  return (
    <>
      <div
        ref={badgeRef}
        className={`relative group hover:z-50 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Badge principal */}
        <div
          className={`
            ${sizeClasses.container}
            ${sizeClasses.padding}
            bg-linear-to-br ${colors.bg}
            border-2 ${colors.border}
            rounded-full
            shadow-lg ${colors.glow}
            flex items-center justify-center
            transform transition-all duration-300
            ${animate ? "hover:scale-110 hover:rotate-6" : "hover:scale-105"}
            relative overflow-hidden
          `}
        >
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent rounded-full"></div>

          {/* Icono del badge - imagen custom o SVG */}
          {customImage ? (
            <img
              src={customImage}
              alt={badge.name}
              className="w-full h-full object-contain relative z-10 scale-150"
            />
          ) : (
            <div className={`${sizeClasses.icon} text-white relative z-10`}>
              {icon}
            </div>
          )}

          {/* Efecto de pulso para nuevos badges */}
          {animate && (
            <div className="absolute inset-0 rounded-full animate-ping bg-white/30"></div>
          )}
        </div>
      </div>

      {/* Tooltip renderizado como portal */}
      {showTooltip &&
        showDescription &&
        createPortal(
          <div
            className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-9999 pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            <div className="font-semibold">{badge.name}</div>

            {/* Información específica del reto si está disponible */}
            {badge.metadata?.contest_title && (
              <div className="text-xs text-blue-300 mt-1 font-medium">
                📖 {badge.metadata.contest_title}
              </div>
            )}

            {badge.metadata?.contest_month && (
              <div className="text-xs text-gray-300">
                📅 {badge.metadata.contest_month}
              </div>
            )}

            {badge.metadata?.position && (
              <div className="text-xs text-yellow-300 font-medium">
                🏆{" "}
                {badge.metadata.position === 1
                  ? "1er lugar"
                  : badge.metadata.position === 2
                    ? "2do lugar"
                    : badge.metadata.position === 3
                      ? "3er lugar"
                      : `${badge.metadata.position}º lugar`}
              </div>
            )}

            {/* Descripción genérica si no hay información del reto */}
            {badge.description && !badge.metadata?.contest_title && (
              <div className="text-xs text-gray-300 mt-1">
                {badge.description}
              </div>
            )}

            {/* Flecha del tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>,
          document.body
        )}
    </>
  );
};

// Componente para mostrar múltiples badges
const BadgeGrid = ({ badges, maxVisible = 4, size = "md", className = "" }) => {
  if (!badges || badges.length === 0) return null;

  // Tamaños para el indicador "+N"
  const gridSizes = {
    xs: { container: "w-8 h-8", text: "text-xs" },
    sm: { container: "w-12 h-12", text: "text-sm" },
    md: { container: "w-16 h-16", text: "text-base" },
    lg: { container: "w-20 h-20", text: "text-lg" },
  };

  const sizeClasses = gridSizes[size] || gridSizes.md;
  const visibleBadges = badges.slice(0, maxVisible);
  const hiddenCount = badges.length - maxVisible;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {visibleBadges.map((badge, index) => (
        <Badge
          key={badge.id || index}
          badge={badge}
          size={size}
          animate={badge.isNew}
        />
      ))}

      {hiddenCount > 0 && (
        <div
          className={`
          ${sizeClasses.container}
          bg-gray-200 border-2 border-gray-300 rounded-full
          flex items-center justify-center text-gray-600 font-semibold
          ${sizeClasses.text}
        `}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};

// Componente de progreso hacia el siguiente badge
const BadgeProgress = ({ currentCount, nextBadge, className = "" }) => {
  if (!nextBadge) return null;

  const threshold = nextBadge.criteria?.threshold || 0;
  const progress = Math.min((currentCount / threshold) * 100, 100);

  return (
    <div
      className={`bg-white rounded-lg p-4 border border-gray-200 dark:bg-dark-700 dark:border-dark-500 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-dark-300">
          Próximo Badge
        </h4>
        <span className="text-sm text-gray-600 dark:text-dark-400">
          {currentCount}/{threshold}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Badge badge={nextBadge} size="sm" showDescription={false} />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-dark-300 mb-1">
            {nextBadge.name}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {threshold - currentCount > 0 && (
            <div className="text-xs text-gray-500 dark:text-dark-400 mt-1">
              Te faltan {threshold - currentCount} para desbloquearlo
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Badge;
export { BadgeGrid, BadgeProgress };
