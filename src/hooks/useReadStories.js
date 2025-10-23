// hooks/useReadStories.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gestionar el sistema de historias leídas
 * Permite marcar/desmarcar historias como leídas y obtener estadísticas
 */
export const useReadStories = (contestId, userId) => {
  const [readStories, setReadStories] = useState(new Set());
  const [readStats, setReadStats] = useState({
    total: 0,
    read: 0,
    unread: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(false);

  /**
   * Cargar historias leídas del usuario para el concurso actual
   */
  const loadReadStories = useCallback(async () => {
    if (!userId || !contestId) {
      setReadStories(new Set());
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_story_reads')
        .select('story_id')
        .eq('user_id', userId)
        .eq('contest_id', contestId);

      if (error) throw error;

      // Crear Set para búsqueda O(1)
      const readSet = new Set(data?.map((r) => r.story_id) || []);
      setReadStories(readSet);
    } catch (error) {
      console.error('Error loading read stories:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, contestId]);

  /**
   * Cargar estadísticas de lectura del concurso
   */
  const loadReadStats = useCallback(async () => {
    if (!userId || !contestId) {
      setReadStats({ total: 0, read: 0, unread: 0, percentage: 0 });
      return;
    }

    try {
      // Llamar a la función SQL que calcula las estadísticas
      const { data, error } = await supabase.rpc('get_contest_read_stats', {
        p_user_id: userId,
        p_contest_id: contestId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];
        setReadStats({
          total: Number(stats.total_stories) || 0,
          read: Number(stats.read_stories) || 0,
          unread: Number(stats.unread_stories) || 0,
          percentage: Number(stats.read_percentage) || 0,
        });
      }
    } catch (error) {
      console.error('Error loading read stats:', error);
    }
  }, [userId, contestId]);

  /**
   * Marcar una historia como leída
   */
  const markAsRead = useCallback(
    async (storyId, isManual = false) => {
      if (!userId || !storyId || !contestId) return false;

      try {
        // Llamar a la función SQL para marcar como leída
        const { data, error } = await supabase.rpc('mark_story_as_read', {
          p_user_id: userId,
          p_story_id: storyId,
          p_contest_id: contestId,
          p_marked_manually: isManual,
        });

        if (error) throw error;

        // Actualizar estado local
        setReadStories((prev) => new Set([...prev, storyId]));

        // Actualizar estadísticas
        await loadReadStats();

        return true;
      } catch (error) {
        console.error('Error marking story as read:', error);
        return false;
      }
    },
    [userId, contestId, loadReadStats]
  );

  /**
   * Desmarcar una historia como leída
   */
  const unmarkAsRead = useCallback(
    async (storyId) => {
      if (!userId || !storyId || !contestId) return false;

      try {
        // Llamar a la función SQL para desmarcar
        const { data, error } = await supabase.rpc('unmark_story_as_read', {
          p_user_id: userId,
          p_story_id: storyId,
          p_contest_id: contestId,
        });

        if (error) throw error;

        // Actualizar estado local
        setReadStories((prev) => {
          const newSet = new Set(prev);
          newSet.delete(storyId);
          return newSet;
        });

        // Actualizar estadísticas
        await loadReadStats();

        return true;
      } catch (error) {
        console.error('Error unmarking story as read:', error);
        return false;
      }
    },
    [userId, contestId, loadReadStats]
  );

  /**
   * Toggle: marcar o desmarcar según estado actual
   */
  const toggleRead = useCallback(
    async (storyId, isManual = true) => {
      const isRead = readStories.has(storyId);
      if (isRead) {
        return await unmarkAsRead(storyId);
      } else {
        return await markAsRead(storyId, isManual);
      }
    },
    [readStories, markAsRead, unmarkAsRead]
  );

  /**
   * Verificar si una historia está leída
   */
  const isStoryRead = useCallback(
    (storyId) => {
      return readStories.has(storyId);
    },
    [readStories]
  );

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    if (userId && contestId) {
      loadReadStories();
      loadReadStats();
    }
  }, [userId, contestId, loadReadStories, loadReadStats]);

  return {
    readStories,
    readStats,
    loading,
    markAsRead,
    unmarkAsRead,
    toggleRead,
    isStoryRead,
    refreshReadStories: loadReadStories,
    refreshReadStats: loadReadStats,
  };
};

export default useReadStories;
