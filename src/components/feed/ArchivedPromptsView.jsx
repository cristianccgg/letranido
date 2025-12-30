// components/feed/ArchivedPromptsView.jsx - Vista de prompts archivados
import React, { useState, useEffect } from 'react';
import { Archive, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import useMicroStories from '../../hooks/useMicroStories';
import MicroStoryCard from './MicroStoryCard';

const ArchivedPromptsView = () => {
  const { user } = useGlobalApp();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [userLikes, setUserLikes] = useState({});

  // Hook para cargar historias del prompt expandido
  const { stories, loading: storiesLoading, refreshStories, updateStoryLikeCount } = useMicroStories(expandedPromptId);

  // Cargar prompts archivados
  useEffect(() => {
    loadArchivedPrompts();
  }, []);

  // Cargar likes del usuario cuando cambian las historias
  useEffect(() => {
    if (user && stories.length > 0) {
      loadUserLikes();
    }
  }, [user, stories]);

  const loadArchivedPrompts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('feed_prompts')
        .select('*')
        .eq('status', 'archived')
        .order('start_date', { ascending: false })
        .limit(20); // Últimos 20 prompts archivados

      if (error) throw error;

      setPrompts(data || []);
    } catch (err) {
      console.error('Error loading archived prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLikes = async () => {
    if (!user || !stories.length) return;

    const storyIds = stories.map(s => s.id);
    const { data } = await supabase.rpc('get_user_feed_story_likes_batch', {
      p_user_id: user.id,
      p_story_ids: storyIds
    });

    if (data) {
      const likesMap = {};
      data.forEach(item => {
        likesMap[item.story_id] = true;
      });
      setUserLikes(likesMap);
    }
  };

  const handleTogglePrompt = (promptId) => {
    if (expandedPromptId === promptId) {
      setExpandedPromptId(null);
    } else {
      setExpandedPromptId(promptId);
    }
  };

  const handleLike = async (storyId) => {
    if (!user) return;

    // Optimistic update del estado de like y contador
    const currentlyLiked = userLikes[storyId] || false;
    const likeChange = currentlyLiked ? -1 : 1;

    setUserLikes(prev => ({ ...prev, [storyId]: !currentlyLiked }));
    updateStoryLikeCount(storyId, likeChange);

    try {
      await supabase.rpc('toggle_feed_story_like', {
        p_user_id: user.id,
        p_story_id: storyId
      });

      // El trigger de la BD ya actualizó el contador
      // Nuestro update optimista mantiene la UI sincronizada sin reload
    } catch (err) {
      // Rollback on error
      setUserLikes(prev => ({ ...prev, [storyId]: currentlyLiked }));
      updateStoryLikeCount(storyId, -likeChange);
      console.error('Error toggling like:', err);
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = start.toLocaleDateString('es-CO', formatOptions);
    const endStr = end.toLocaleDateString('es-CO', formatOptions);

    return `${startStr} - ${endStr}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando archivo...</p>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          No hay prompts archivados
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Los prompts archivados aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Prompts Anteriores ({prompts.length})
        </h2>
      </div>

      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header del prompt (siempre visible) */}
          <button
            onClick={() => handleTogglePrompt(prompt.id)}
            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Semana {prompt.week_number} • {formatDateRange(prompt.start_date, prompt.end_date)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {prompt.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                  "{prompt.prompt_text}"
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{prompt.stories_count || 0} historias</span>
                  </div>
                </div>
              </div>

              {/* Icono expandir/colapsar */}
              <div className="ml-4">
                {expandedPromptId === prompt.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {/* Historias expandibles */}
          {expandedPromptId === prompt.id && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              {storiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando historias...</p>
                </div>
              ) : stories.length > 0 ? (
                <div className="space-y-4">
                  {stories.map((story) => (
                    <MicroStoryCard
                      key={story.id}
                      story={story}
                      onLike={handleLike}
                      isLiked={userLikes[story.id] || false}
                      currentUserId={user?.id}
                      // En archivo no permitimos eliminar ni reportar
                      onDelete={null}
                      onReport={null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No hay historias para este prompt
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ArchivedPromptsView;
