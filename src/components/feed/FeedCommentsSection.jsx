// components/feed/FeedCommentsSection.jsx - Sistema de comentarios para feed stories
import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Trash2, Flag, Heart, Reply } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import { supabase } from "../../lib/supabase";
import UserCardWithBadges from "../ui/UserCardWithBadges";

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Ahora";
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString("es-CO", { month: "short", day: "numeric" });
};

const CommentCard = ({
  comment,
  isReply,
  onDelete,
  onReport,
  onLike,
  isLiked,
  currentUserId,
}) => {
  const isAuthor = currentUserId === comment.author_id;

  return (
    <div
      className={`rounded-lg p-3 ${
        isReply
          ? "ml-8 border-l-4 border-primary-400 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/20"
          : "bg-gray-50 dark:bg-gray-700"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <UserCardWithBadges
            userId={comment.author_id}
            userName={comment.author}
            avatarSize="sm"
            badgeSize="xs"
            maxBadges={1}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeAgo(comment.created_at)}
          </span>
          {isReply && (
            <span className="text-xs text-primary-600 dark:text-primary-400">
              • Respuesta
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isAuthor && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {!isAuthor && onReport && (
            <button
              onClick={() => onReport(comment.id)}
              className="p-1 text-gray-400 hover:text-orange-600 transition-colors cursor-pointer"
              title="Reportar"
            >
              <Flag className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap mb-2 text-left">
        {comment.content}
      </p>

      {/* Like button */}
      {currentUserId && onLike && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLike(comment.id);
          }}
          className={`flex items-center gap-1 text-xs transition-colors cursor-pointer ${
            isLiked
              ? "text-red-500"
              : "text-gray-400 dark:text-gray-500 hover:text-red-500"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
          {comment.likes_count > 0 && (
            <span className="font-medium">{comment.likes_count}</span>
          )}
        </button>
      )}
    </div>
  );
};

const feedbackPlaceholders = [
  "¿Qué imagen o momento te quedó grabado de esta historia?",
  "¿Qué te gustó del estilo o la voz del narrador?",
  "¿Hay algo que cambiarías o desarrollarías más?",
  "¿Qué emoción te generó al leerla?",
  "¿La conclusión te sorprendió o la esperabas?",
];

const FeedCommentsSection = ({
  comments = [],
  onAddComment,
  onDeleteComment,
  onReportComment,
  loading = false,
}) => {
  const { user } = useGlobalApp();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [placeholder] = useState(
    () => feedbackPlaceholders[Math.floor(Math.random() * feedbackPlaceholders.length)]
  );

  // Estado para likes (optimistic UI)
  const [userLikes, setUserLikes] = useState({});
  const [localLikesCount, setLocalLikesCount] = useState({});

  // Cargar likes del usuario cuando cambian los comentarios
  useEffect(() => {
    const loadUserLikes = async () => {
      if (!user || !comments.length) return;

      const commentIds = comments.map((c) => c.id);
      const { data } = await supabase.rpc("get_user_feed_comment_likes_batch", {
        p_user_id: user.id,
        p_comment_ids: commentIds,
      });

      if (data) {
        const likesMap = {};
        data.forEach((item) => {
          likesMap[item.comment_id] = true;
        });
        setUserLikes(likesMap);
      }

      // Inicializar contadores locales
      const countsMap = {};
      comments.forEach((c) => {
        countsMap[c.id] = c.likes_count || 0;
      });
      setLocalLikesCount(countsMap);
    };

    loadUserLikes();
  }, [user, comments]);

  // Separar comentarios principales y respuestas
  const mainComments = comments.filter((c) => !c.parent_id);
  const repliesMap = {};
  comments
    .filter((c) => c.parent_id)
    .forEach((reply) => {
      if (!repliesMap[reply.parent_id]) {
        repliesMap[reply.parent_id] = [];
      }
      repliesMap[reply.parent_id].push(reply);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    const result = await onAddComment(newComment, null);

    if (result.success) {
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setSubmitting(true);
    const result = await onAddComment(replyContent, parentId);

    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    if (window.confirm("¿Eliminar este comentario?")) {
      await onDeleteComment(commentId);
    }
  };

  const handleReport = async (commentId) => {
    const reason = window.prompt("¿Por qué reportas este comentario?");
    if (reason) {
      await onReportComment(commentId, reason, null);
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!user) return;

    // Optimistic update del estado de like y contador
    const currentlyLiked = userLikes[commentId] || false;
    const likeChange = currentlyLiked ? -1 : 1;

    setUserLikes((prev) => ({ ...prev, [commentId]: !currentlyLiked }));
    setLocalLikesCount((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + likeChange,
    }));

    try {
      await supabase.rpc("toggle_feed_comment_like", {
        p_user_id: user.id,
        p_comment_id: commentId,
      });

      // El trigger de la BD ya actualizó el contador
      // Nuestro update optimista mantiene la UI sincronizada sin reload
    } catch (err) {
      // Rollback on error
      setUserLikes((prev) => ({ ...prev, [commentId]: currentlyLiked }));
      setLocalLikesCount((prev) => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) - likeChange,
      }));
      console.error("Error toggling comment like:", err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Cargando comentarios...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulario para nuevo comentario */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={placeholder}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {newComment.length}/500
            </span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Comentar
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión para comentar
          </p>
        </div>
      )}

      {/* Lista de comentarios */}
      {mainComments.length > 0 ? (
        <div className="space-y-3">
          {mainComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Comentario principal */}
              <CommentCard
                comment={{
                  ...comment,
                  likes_count:
                    localLikesCount[comment.id] ?? comment.likes_count ?? 0,
                }}
                isReply={false}
                onDelete={handleDelete}
                onReport={handleReport}
                onLike={handleToggleLike}
                isLiked={userLikes[comment.id] || false}
                currentUserId={user?.id}
              />

              {/* Botón responder */}
              {user && !replyingTo && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="ml-8 text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Reply className="w-3 h-3" />
                  Responder
                </button>
              )}

              {/* Formulario de respuesta */}
              {replyingTo === comment.id && (
                <div className="ml-8 space-y-2">
                  <form
                    onSubmit={(e) => handleSubmitReply(e, comment.id)}
                    className="space-y-2"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escribe una respuesta..."
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !replyContent.trim()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Send className="w-3 h-3" />
                        Responder
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Respuestas */}
              {repliesMap[comment.id]?.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={{
                    ...reply,
                    likes_count:
                      localLikesCount[reply.id] ?? reply.likes_count ?? 0,
                  }}
                  isReply={true}
                  onDelete={handleDelete}
                  onReport={handleReport}
                  onLike={handleToggleLike}
                  isLiked={userLikes[reply.id] || false}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          Sé el primero en comentar esta microhistoria
        </div>
      )}
    </div>
  );
};

export default FeedCommentsSection;
