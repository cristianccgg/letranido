// components/ui/BadgeNotification.jsx - Notificación para nuevos badges
import React, { useState, useEffect } from 'react';
import Badge from './Badge';

const BadgeNotification = ({ badge, onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Pequeño delay para la animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto cerrar después de 5 segundos si está habilitado
    let autoCloseTimer;
    if (autoClose) {
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [autoClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!badge) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-out
      ${isVisible && !isExiting 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
      }
    `}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header con confetti effect */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {/* Efecto confetti con CSS */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full animate-bounce"></div>
            <div className="absolute top-2 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping"></div>
            <div className="absolute bottom-1 left-8 w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
            <div className="absolute top-1 left-1/2 w-1 h-1 bg-red-300 rounded-full animate-bounce"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">¡Nuevo Badge!</h3>
            <button 
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Badge con animación especial */}
            <div className="relative">
              <Badge 
                badge={badge} 
                size="lg" 
                showDescription={false}
                animate={true}
              />
              
              {/* Efecto de brillo giratorio */}
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400 opacity-75 animate-spin"></div>
            </div>

            {/* Texto */}
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg mb-1">
                {badge.name}
              </h4>
              <p className="text-gray-600 text-sm">
                {badge.description}
              </p>
            </div>
          </div>

          {/* Mensaje motivacional */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              ¡Sigue escribiendo para desbloquear más badges! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Manager de múltiples notificaciones
const BadgeNotificationManager = ({ badges, onClearAll }) => {
  const [visibleBadges, setVisibleBadges] = useState([]);

  useEffect(() => {
    if (badges && badges.length > 0) {
      setVisibleBadges(badges.map(badge => ({ ...badge, id: badge.badge_id || badge.id })));
    }
  }, [badges]);

  const handleCloseBadge = (badgeId) => {
    setVisibleBadges(prev => prev.filter(badge => badge.id !== badgeId));
    
    // Si no quedan badges visibles, limpiar todos
    if (visibleBadges.length <= 1) {
      onClearAll?.();
    }
  };

  if (visibleBadges.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      {visibleBadges.map((badge, index) => (
        <div 
          key={badge.id} 
          className="pointer-events-auto"
          style={{ 
            animationDelay: `${index * 500}ms`,
            marginTop: index > 0 ? '1rem' : '0'
          }}
        >
          <BadgeNotification
            badge={badge}
            onClose={() => handleCloseBadge(badge.id)}
            autoClose={true}
          />
        </div>
      ))}
    </div>
  );
};

export default BadgeNotification;
export { BadgeNotificationManager };