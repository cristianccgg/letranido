// hooks/useNotifications.js - Hook para manejar notificaciones
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar notificaciones del usuario
  const loadNotifications = useCallback(async (limit = 20) => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Obtener notificaciones ordenadas por fecha
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setNotifications(data || []);
      
      // Contar no leídas
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);

    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar solo el contador de no leídas (más eficiente)
  const loadUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);

    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [userId]);

  // Marcar notificaciones como leídas
  const markAsRead = useCallback(async (notificationIds = null) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase.rpc('mark_notifications_as_read', {
        target_user_id: userId,
        notification_ids: notificationIds
      });

      if (error) throw error;

      // Actualizar estado local
      if (notificationIds === null) {
        // Marcar todas como leídas
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      } else {
        // Marcar específicas como leídas
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) 
              ? { ...n, is_read: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }

      return true;
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      return false;
    }
  }, [userId]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    return markAsRead(null);
  }, [markAsRead]);

  // Marcar una notificación específica como leída
  const markNotificationAsRead = useCallback((notificationId) => {
    return markAsRead([notificationId]);
  }, [markAsRead]);

  // Crear notificación manual (para testing)
  const createNotification = useCallback(async (type, title, message, data = {}) => {
    if (!userId) return false;

    try {
      const { data: result, error } = await supabase.rpc('create_notification', {
        target_user_id: userId,
        notification_type: type,
        notification_title: title,
        notification_message: message,
        notification_data: data
      });

      if (error) throw error;

      // Si se creó la notificación, recargar
      if (result) {
        await loadNotifications();
      }

      return !!result;
    } catch (err) {
      console.error('Error creating notification:', err);
      return false;
    }
  }, [userId, loadNotifications]);

  // Obtener notificaciones por tipo
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Obtener notificaciones no leídas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  // Formatear tiempo relativo
  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }, []);

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!userId) return;

    // Cargar notificaciones iniciales
    loadNotifications();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Agregar nueva notificación al principio
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Actualizar notificación existente
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
          
          // Si se marcó como leída, reducir contador
          if (payload.old.is_read === false && payload.new.is_read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, loadNotifications]);

  // Actualizar contador periódicamente - DESHABILITADO para ahorrar recursos
  // useEffect(() => {
  //   if (!userId) return;
  //   const interval = setInterval(() => {
  //     loadUnreadCount();
  //   }, 30000); // Cada 30 segundos
  //   return () => clearInterval(interval);
  // }, [userId, loadUnreadCount]);

  return {
    // Estado
    notifications,
    unreadCount,
    loading,
    error,

    // Métodos de carga
    loadNotifications,
    loadUnreadCount,
    refreshNotifications: loadNotifications,

    // Métodos de marcado
    markAsRead,
    markAllAsRead,
    markNotificationAsRead,

    // Métodos de filtrado
    getNotificationsByType,
    getUnreadNotifications,

    // Utilidades
    formatTimeAgo,
    createNotification, // Para testing/desarrollo

    // Estado derivado
    hasUnread: unreadCount > 0,
    isEmpty: notifications.length === 0
  };
};

export default useNotifications;