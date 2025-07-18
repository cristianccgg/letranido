// components/ui/Badge.jsx - Sistema de badges con diseños CSS/SVG profesionales
import React from 'react';

const Badge = ({ 
  badge, 
  size = 'md', 
  showDescription = true,
  animate = false,
  className = ''
}) => {
  // Definición de iconos SVG para cada tipo de badge
  const badgeIcons = {
    feather: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M7.5 8.5L12 3l4.5 5.5v4.5L12 21l-4.5-8V8.5z" opacity="0.2"/>
        <path d="M7.5 8.5L12 3l4.5 5.5M12 3v18M7.5 8.5h9M9 11h6M10.5 13.5h3"/>
      </svg>
    ),
    'book-open': (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C8 2 8 5 8 5s0-3-4-3v16c4 0 4 3 4 3s0-3 4-3V2z" opacity="0.2"/>
        <path d="M2 5c4 0 4-3 8-3s8 3 8 3v16c-4 0-4-3-8-3s-4 3-8 3V5z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2v16" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    scroll: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <rect x="5" y="4" width="14" height="16" rx="2" opacity="0.2"/>
        <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M5 16l3-8 4 6 4-6 3 8H5z" opacity="0.3"/>
        <path d="M5 16l3-8 4 6 4-6 3 8H5z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="6" r="2" fill="currentColor"/>
        <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="19" cy="8" r="1.5" fill="currentColor"/>
        <path d="M3 18h18" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    medal: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <circle cx="12" cy="15" r="6" opacity="0.2"/>
        <circle cx="12" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 3l2 8M16 3l-2 8M12 9v12" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="15" r="2" fill="currentColor"/>
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m0 4v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7m0-4h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="5" width="8" height="12" rx="1" opacity="0.2"/>
        <path d="M10 20h4M12 17v3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="9" r="2" fill="currentColor"/>
      </svg>
    )
  };

  // Colores predefinidos según el tier y tipo
  const badgeColors = {
    1: { // Bronze/Green - Básico
      bg: 'from-emerald-400 to-emerald-600',
      border: 'border-emerald-300',
      glow: 'shadow-emerald-500/50',
      text: 'text-emerald-800'
    },
    2: { // Silver/Blue - Intermedio
      bg: 'from-blue-400 to-blue-600', 
      border: 'border-blue-300',
      glow: 'shadow-blue-500/50',
      text: 'text-blue-800'
    },
    3: { // Gold/Purple - Avanzado
      bg: 'from-purple-500 to-purple-700',
      border: 'border-purple-300', 
      glow: 'shadow-purple-500/50',
      text: 'text-purple-800'
    }
  };

  // Colores especiales para badges específicos
  const specialColors = {
    contest_winner: {
      bg: 'from-yellow-400 to-amber-500',
      border: 'border-yellow-300',
      glow: 'shadow-yellow-500/60',
      text: 'text-yellow-900'
    },
    contest_finalist: {
      bg: 'from-slate-400 to-slate-600',
      border: 'border-slate-300',
      glow: 'shadow-slate-500/50',
      text: 'text-slate-800'
    },
    contest_winner_veteran: {
      bg: 'from-red-500 to-red-700',
      border: 'border-red-300',
      glow: 'shadow-red-500/60',
      text: 'text-red-800'
    }
  };

  // Tamaños predefinidos
  const sizes = {
    xs: { 
      container: 'w-8 h-8', 
      icon: 'w-4 h-4',
      text: 'text-xs',
      padding: 'p-1'
    },
    sm: { 
      container: 'w-12 h-12', 
      icon: 'w-6 h-6',
      text: 'text-sm',
      padding: 'p-2'
    },
    md: { 
      container: 'w-16 h-16', 
      icon: 'w-8 h-8',
      text: 'text-base',
      padding: 'p-3'
    },
    lg: { 
      container: 'w-20 h-20', 
      icon: 'w-10 h-10',
      text: 'text-lg',
      padding: 'p-4'
    }
  };

  if (!badge) return null;

  const sizeClasses = sizes[size] || sizes.md;
  const colors = specialColors[badge.id] || badgeColors[badge.tier] || badgeColors[1];
  const icon = badgeIcons[badge.icon] || badgeIcons.feather;

  return (
    <div className={`relative group ${className}`}>
      {/* Badge principal */}
      <div className={`
        ${sizeClasses.container} 
        ${sizeClasses.padding}
        bg-gradient-to-br ${colors.bg}
        border-2 ${colors.border}
        rounded-full
        shadow-lg ${colors.glow}
        flex items-center justify-center
        transform transition-all duration-300
        ${animate ? 'hover:scale-110 hover:rotate-6' : 'hover:scale-105'}
        relative overflow-hidden
      `}>
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full"></div>
        
        {/* Icono del badge */}
        <div className={`${sizeClasses.icon} text-white relative z-10`}>
          {icon}
        </div>

        {/* Efecto de pulso para nuevos badges */}
        {animate && (
          <div className="absolute inset-0 rounded-full animate-ping bg-white/30"></div>
        )}
      </div>

      {/* Tooltip con nombre y descripción */}
      {showDescription && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
          <div className="font-semibold">{badge.name}</div>
          {badge.description && (
            <div className="text-xs text-gray-300 mt-1">{badge.description}</div>
          )}
          {/* Flecha del tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar múltiples badges
const BadgeGrid = ({ badges, maxVisible = 4, size = 'md', className = '' }) => {
  if (!badges || badges.length === 0) return null;

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
        <div className={`
          ${sizes[size]?.container || 'w-16 h-16'} 
          bg-gray-200 border-2 border-gray-300 rounded-full 
          flex items-center justify-center text-gray-600 font-semibold
          ${sizes[size]?.text || 'text-base'}
        `}>
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};

// Componente de progreso hacia el siguiente badge
const BadgeProgress = ({ currentCount, nextBadge, className = '' }) => {
  if (!nextBadge) return null;

  const threshold = nextBadge.criteria?.threshold || 0;
  const progress = Math.min((currentCount / threshold) * 100, 100);

  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">Próximo Badge</h4>
        <span className="text-sm text-gray-600">{currentCount}/{threshold}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge badge={nextBadge} size="sm" showDescription={false} />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 mb-1">{nextBadge.name}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {threshold - currentCount > 0 && (
            <div className="text-xs text-gray-500 mt-1">
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