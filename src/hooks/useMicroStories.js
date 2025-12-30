// hooks/useMicroStories.js - Hook para gestión de microhistorias del feed
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para cargar microhistorias de un prompt específico
 * @param {string} promptId - ID del prompt
 * @returns {object} - { stories, loading, error, refreshStories, userHasPublished }
 */
const useMicroStories = (promptId) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStoryId, setUserStoryId] = useState(null);

  const loadStories = useCallback(async () => {
    if (!promptId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cargar historias con información del autor
      const { data, error: fetchError } = await supabase
        .from('feed_stories')
        .select(`
          *,
          author:user_profiles!user_id (
            id,
            display_name,
            avatar_url,
            country
          )
        `)
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setStories(data || []);

      // Verificar si el usuario actual ya publicó
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userStory = data?.find(s => s.user_id === user.id);
        setUserStoryId(userStory?.id || null);
      }
    } catch (err) {
      console.error('Error loading micro stories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  return {
    stories,
    loading,
    error,
    refreshStories: loadStories,
    userHasPublished: !!userStoryId,
    userStoryId,
  };
};

export default useMicroStories;
