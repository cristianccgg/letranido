// pages/FeedPage.jsx - Feed estilo red social con prompt activo arriba
import React, { useState, useEffect } from 'react';
import { Rss, Sparkles, Send, Archive, AlertCircle } from 'lucide-react';
import { useGlobalApp } from '../contexts/GlobalAppContext';
import useFeedPrompts from '../hooks/useFeedPrompts';
import useMicroStories from '../hooks/useMicroStories';
import MicroStoryCard from '../components/feed/MicroStoryCard';
import { supabase } from '../lib/supabase';

const FeedPage = () => {
  const { user } = useGlobalApp();
  const { activePrompt, loading: promptsLoading } = useFeedPrompts('active');
  const { stories, loading: storiesLoading, refreshStories, userHasPublished } = useMicroStories(activePrompt?.id);

  // Estado del formulario
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estado de likes (optimistic UI)
  const [userLikes, setUserLikes] = useState({});

  // Tab para ver archivo
  const [showArchive, setShowArchive] = useState(false);

  // Calcular word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Cargar likes del usuario
  useEffect(() => {
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

    loadUserLikes();
  }, [user, stories]);

  // Publicar microhistoria
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Debes iniciar sesión para publicar');
      return;
    }

    if (wordCount < 50 || wordCount > 300) {
      setError('La historia debe tener entre 50 y 300 palabras');
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('feed_stories')
        .insert([{
          prompt_id: activePrompt.id,
          user_id: user.id,
          title: title.trim() || null,
          content: content.trim(),
          word_count: wordCount
        }]);

      if (insertError) throw insertError;

      setSuccess('¡Historia publicada!');
      setTitle('');
      setContent('');
      setWordCount(0);
      refreshStories();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error publishing story:', err);
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Toggle like
  const handleLike = async (storyId) => {
    if (!user) return;

    // Optimistic update
    const currentlyLiked = userLikes[storyId] || false;
    setUserLikes(prev => ({ ...prev, [storyId]: !currentlyLiked }));

    try {
      await supabase.rpc('toggle_feed_story_like', {
        p_user_id: user.id,
        p_story_id: storyId
      });

      refreshStories();
    } catch (err) {
      // Rollback on error
      setUserLikes(prev => ({ ...prev, [storyId]: currentlyLiked }));
      console.error('Error toggling like:', err);
    }
  };

  const loading = promptsLoading || storiesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header compacto */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rss className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Feed</h1>
            </div>

            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
            >
              <Archive className="w-4 h-4" />
              {showArchive ? 'Feed Activo' : 'Archivo'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Vista principal: Prompt activo + formulario + feed */}
        {!showArchive && (
          <>
            {/* Prompt activo */}
            {activePrompt ? (
              <>
                {/* Prompt destacado */}
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-6 border-2 border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                      Prompt de esta semana
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {activePrompt.title}
                  </h2>
                  <p className="text-primary-900 dark:text-primary-100 text-lg italic mb-3">
                    "{activePrompt.prompt_text}"
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    50-300 palabras • Escribe una historia basada en este prompt
                  </p>
                </div>

                {/* Formulario de publicación (tipo "¿Qué estás pensando?") */}
                {user && !userHasPublished ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <form onSubmit={handlePublish} className="space-y-3">
                      {/* Título opcional */}
                      <input
                        type="text"
                        placeholder="Título (opcional)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                      />

                      {/* Textarea principal */}
                      <textarea
                        placeholder="Escribe tu historia aquí..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none"
                      />

                      {/* Word count y botón */}
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          wordCount < 50 || wordCount > 300
                            ? 'text-red-500'
                            : 'text-green-600'
                        }`}>
                          {wordCount}/300 palabras {wordCount < 50 && `(mínimo 50)`}
                        </span>

                        <button
                          type="submit"
                          disabled={publishing || wordCount < 50 || wordCount > 300}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                          {publishing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Publicar
                            </>
                          )}
                        </button>
                      </div>

                      {/* Mensajes */}
                      {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium">
                          {success}
                        </div>
                      )}
                    </form>
                  </div>
                ) : user && userHasPublished ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      ✅ Ya publicaste tu historia para este prompt
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Inicia sesión para publicar tu historia
                    </p>
                  </div>
                )}

                {/* Feed de historias */}
                <div className="space-y-4">
                  {stories.length > 0 ? (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Historias de la comunidad ({stories.length})
                      </h3>
                      {stories.map((story) => (
                        <MicroStoryCard
                          key={story.id}
                          story={story}
                          onLike={handleLike}
                          isLiked={userLikes[story.id] || false}
                          currentUserId={user?.id}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400">
                        Sé el primero en publicar una historia 🎉
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Rss className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  No hay prompts activos
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Vuelve pronto para ver nuevos prompts
                </p>
              </div>
            )}
          </>
        )}

        {/* Vista de archivo (pendiente de implementar) */}
        {showArchive && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Archivo de prompts anteriores
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Próximamente podrás ver prompts anteriores
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
