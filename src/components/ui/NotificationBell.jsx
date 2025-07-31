// components/ui/NotificationBell.jsx - Campana de notificaciones con dropdown
import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Trophy, MessageCircle, Heart, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';
import Badge from './Badge';

const NotificationBell = ({ userId, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    hasUnread,
    markNotificationAsRead,
    markAllAsRead,
    formatTimeAgo,
    refreshNotifications
  } = useNotifications(userId);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Iconos por tipo de notificación
  const getNotificationIcon = (type, data) => {
    switch (type) {
      case 'badge':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'contest_winner':
        return <Crown className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Acción al hacer click en notificación
  const handleNotificationClick = async (notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }

    // Redirigir según el tipo
    const data = notification.data || {};
    
    if ((notification.type === 'like' || notification.type === 'comment') && data.story_id) {
      // Ir a la historia
      window.location.href = `/story/${data.story_id}`;
    } else if (notification.type === 'badge') {
      // Ir al perfil para ver badges
      window.location.href = `/profile`;
    } else if (notification.type === 'contest_winner') {
      // Ir a los resultados del concurso
      window.location.href = `/contest/current`;
    }
    
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && hasUnread) {
      // Opcional: marcar como vistas al abrir (no como leídas)
      // Puedes implementar un estado "visto" vs "leído" si quieres
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={handleToggle}
        className={`
          relative p-2 rounded-full transition-all duration-200
          ${hasUnread 
            ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }
        `}
        title={`${unreadCount} notificaciones sin leer`}
      >
        <Bell className="w-6 h-6" />
        
        {/* Contador de notificaciones */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Notificaciones
                {hasUnread && (
                  <span className="ml-2 text-sm text-purple-600">
                    ({unreadCount} nuevas)
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Leer todas
                  </button>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 text-sm mt-2">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No tienes notificaciones</p>
                <p className="text-sm">Te avisaremos cuando tengas algo nuevo</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 border-b border-gray-100 cursor-pointer transition-all duration-200
                    ${notification.is_read 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type, notification.data)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          
                          {/* Badge especial para notificaciones de badge */}
                          {notification.type === 'badge' && notification.data?.badge_id && (
                            <div className="mt-2">
                              <div className="inline-flex items-center gap-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
                                <Trophy className="w-4 h-4 text-yellow-600" />
                                <span className="text-xs font-medium text-yellow-800">
                                  {notification.data.badge_name}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tiempo y acciones */}
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              title="Marcar como leída"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <button
                onClick={refreshNotifications}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Actualizar notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;