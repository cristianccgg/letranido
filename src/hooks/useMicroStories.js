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

      // Cargar historias
      const { data: storiesData, error: fetchError } = await supabase
        .from('feed_stories')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Cargar display_name de cada autor (mismo patrón que resto del sitio)
      let data = [];
      if (storiesData && storiesData.length > 0) {
        const userIds = [...new Set(storiesData.map(s => s.user_id).filter(Boolean))];

        // Cargar solo display_name de user_profiles
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', userIds);

        // Crear map de nombres
        const namesMap = {};
        profiles?.forEach(p => {
          namesMap[p.id] = p.display_name;
        });

        // Transformar: author es un string (igual que en stories de retos)
        data = storiesData.map(story => ({
          ...story,
          author: namesMap[story.user_id] || 'Usuario'
        }));
      }

      setStories(data);

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

  // Función para actualizar el contador de likes localmente sin recargar todo
  const updateStoryLikeCount = useCallback((storyId, increment) => {
    setStories(prevStories =>
      prevStories.map(story =>
        story.id === storyId
          ? { ...story, likes_count: story.likes_count + increment }
          : story
      )
    );
  }, []);

  return {
    stories,
    loading,
    error,
    refreshStories: loadStories,
    updateStoryLikeCount,
    userHasPublished: !!userStoryId,
    userStoryId,
  };
};

export default useMicroStories;
