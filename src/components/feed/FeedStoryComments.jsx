// components/feed/FeedStoryComments.jsx - Adaptador de comentarios para feed
import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import FeedCommentsSection from './FeedCommentsSection';

/**
 * Componente que adapta SimpleComments para trabajar con feed_story_comments
 * en lugar de la tabla comments normal
 */
const FeedStoryComments = ({ storyId, initialCount = 0, onCountChange, isOpen = false, onToggleOpen }) => {
  const { user } = useGlobalApp();
  const [showComments, setShowComments] = useState(isOpen);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCount);

  // Cargar comentarios cuando se abre el panel
  useEffect(() => {
    if (showComments && storyId) {
      loadComments();
    }
  }, [showComments, storyId]);

  // Sincronizar con prop externo
  useEffect(() => {
    setCommentsCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setShowComments(isOpen);
  }, [isOpen]);

  const loadComments = async () => {
    try {
      setLoading(true);

      // Cargar comentarios con información del autor
      const { data: commentsData, error } = await supabase
        .from('feed_story_comments')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Cargar perfiles de autores
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        // Crear mapa de perfiles
        const profilesMap = {};
        profiles?.forEach(p => {
          profilesMap[p.id] = p;
        });

        // Combinar datos
        const enrichedComments = commentsData.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author_id: comment.user_id,
          author: profilesMap[comment.user_id]?.display_name || 'Usuario',
          author_avatar: profilesMap[comment.user_id]?.avatar_url,
          likes_count: comment.likes_count,
          parent_id: comment.parent_id,
        }));

        setComments(enrichedComments);
        setCommentsCount(enrichedComments.length);
        onCountChange?.(enrichedComments.length);
      } else {
        setComments([]);
        setCommentsCount(0);
        onCountChange?.(0);
      }
    } catch (err) {
      console.error('Error loading feed comments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Agregar nuevo comentario
  const handleAddComment = async (content, parentId = null) => {
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    try {
      const { data, error } = await supabase
        .from('feed_story_comments')
        .insert([{
          story_id: storyId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId,
        }])
        .select()
        .single();

      if (error) throw error;

      // El trigger actualiza automáticamente el contador
      // Recargar comentarios
      await loadComments();

      return { success: true };
    } catch (err) {
      console.error('Error adding comment:', err);
      return { success: false, error: err.message };
    }
  };

  // Eliminar comentario
  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('feed_story_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Solo el autor puede eliminar

      if (error) throw error;

      // El trigger actualiza automáticamente el contador
      // Recargar comentarios
      await loadComments();

      return { success: true };
    } catch (err) {
      console.error('Error deleting comment:', err);
      return { success: false, error: err.message };
    }
  };

  // Toggle like en comentario
  const handleToggleCommentLike = async (commentId) => {
    if (!user) return { success: false };

    try {
      await supabase.rpc('toggle_feed_comment_like', {
        p_user_id: user.id,
        p_comment_id: commentId
      });

      // Recargar comentarios para actualizar contador
      await loadComments();

      return { success: true };
    } catch (err) {
      console.error('Error toggling comment like:', err);
      return { success: false };
    }
  };

  // Reportar comentario
  const handleReportComment = async (commentId, reason, description) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: user.id,
          reported_item_type: 'feed_comment',
          reported_item_id: commentId,
          reason,
          description,
        }]);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error reporting comment:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-700">
      {/* Botón para mostrar/ocultar comentarios */}
      <button
        onClick={() => {
          const next = !showComments;
          setShowComments(next);
          onToggleOpen?.(next);
        }}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
      >
        <MessageSquare className="w-4 h-4" />
        {showComments ? 'Ocultar comentarios' : `Ver comentarios${commentsCount > 0 ? ` (${commentsCount})` : ''}`}
      </button>

      {/* Panel de comentarios expandible */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
          <FeedCommentsSection
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onReportComment={handleReportComment}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default FeedStoryComments;
