// components/comments/SimpleComments.jsx - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Trash2,
  Flag,
  User,
  Heart,
  Reply,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext"; // ✅ CAMBIADO
import {
  useGoogleAnalytics,
  AnalyticsEvents,
} from "../../hooks/useGoogleAnalytics";
import UserAvatar from "../ui/UserAvatar";
import ReportModal from "../modals/ReportModal";
import UserCardWithBadges from "../ui/UserCardWithBadges";

// Hook para detectar tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

// Función helper para formatear tiempo
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Hace menos de una hora";
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Hace 1 día";
  return `Hace ${diffInDays} días`;
};

// ✅ Componente CommentCard movido FUERA para evitar re-renders
const CommentCard = ({
  comment,
  isReply = false,
  onReply,
  onDelete,
  onReport,
  onToggleLike,
  isLiked,
  isAuthenticated,
  currentUserId,
}) => {
  const canReply = !isReply; // Solo permitir respuestas en comentarios principales

  return (
    <div
      id={`comment-${comment.id}`}
      className={`
        bg-gray-50 dark:bg-dark-700 rounded-lg p-3 md:p-4
        ${isReply ? "ml-4 sm:ml-6 md:ml-12 border-l-2 border-primary-300 dark:border-primary-700" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {/* Header: Usuario, tiempo, acciones */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserCardWithBadges
                userId={comment.author_id}
                userName={comment.author}
                avatarSize="sm"
                badgeSize="xs"
                maxBadges={1}
                className="font-medium"
              />
              <span className="text-xs text-gray-500 dark:text-dark-400">
                {formatTimeAgo(comment.created_at)}
              </span>
              {isReply && (
                <span className="text-xs text-primary-600 dark:text-primary-400">
                  • Respuesta
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Botón de eliminar (solo autor) */}
              {isAuthenticated && currentUserId === comment.author_id && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1 text-gray-400 dark:text-dark-500 hover:text-red-600 transition-colors"
                  title="Eliminar comentario"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}

              {/* Botón de reportar */}
              {isAuthenticated && currentUserId !== comment.author_id && (
                <button
                  onClick={() => onReport(comment.id, comment.content)}
                  className="p-1 text-gray-400 dark:text-dark-500 hover:text-orange-600 transition-colors"
                  title="Reportar comentario"
                >
                  <Flag className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Contenido del comentario */}
          <p className="text-gray-700 dark:text-dark-200 text-sm leading-relaxed mb-3">
            {comment.content}
          </p>

          {/* Footer: Likes y botón responder */}
          <div className="flex items-center gap-4">
            {/* Botón de like */}
            <button
              onClick={() => onToggleLike(comment.id)}
              disabled={!isAuthenticated}
              className={`
                flex items-center cursor-pointer gap-1.5 text-xs transition-colors
                ${
                  isLiked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-500 dark:text-dark-400 hover:text-red-500"
                }
                ${!isAuthenticated && "opacity-50 cursor-not-allowed"}
              `}
              title={
                isAuthenticated
                  ? isLiked
                    ? "Quitar like"
                    : "Dar like"
                  : "Inicia sesión para dar like"
              }
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="font-medium">
                {comment.likes_count > 0 ? comment.likes_count : ""}
              </span>
            </button>

            {/* Botón de responder (solo en comentarios principales) */}
            {canReply && isAuthenticated && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Reply className="h-4 w-4 " />
                <span>Responder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleComments = ({
  storyId,
  storyTitle,
  contestId,
  onCommentsCountChange,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    commentId: null,
    commentContent: "",
  });

  // ✅ NUEVO ESTADO PARA RESPUESTAS Y LIKES
  const [replyingTo, setReplyingTo] = useState(null); // ID del comentario al que se está respondiendo
  const [replyContent, setReplyContent] = useState("");
  const [repliesMap, setRepliesMap] = useState({}); // Respuestas agrupadas por parent_id
  const [userLikes, setUserLikes] = useState({}); // Map de comment_id -> boolean

  // Hook para detectar móvil
  const isMobile = useIsMobile();

  // ✅ USO DEL CONTEXTO GLOBAL CON FUNCIONES DE COMENTARIOS
  const {
    user,
    isAuthenticated,
    getStoryComments,
    addComment,
    deleteComment,
    reportComment,
    openAuthModal,
    toggleCommentLike,
    getUserCommentLikesBatch,
  } = useGlobalApp();

  // ✅ ANALYTICS
  const { trackEvent } = useGoogleAnalytics();

  // Placeholder fijo (solo se genera una vez)
  const [placeholder] = useState(() => {
    const examples = [
      "Me gustó mucho cómo desarrollaste el personaje principal...",
      "La descripción del ambiente me transportó completamente...",
      "Quizás podrías explorar más la motivación del protagonista...",
      "El diálogo se siente muy natural y realista...",
      "La construcción del suspenso está muy bien lograda...",
    ];

    const randomExample = examples[Math.floor(Math.random() * examples.length)];

    if (isMobile) {
      return `Ej: "${randomExample}"`;
    }
    return `Comparte qué te gustó, sugiere mejoras o comenta sobre estilo/personajes. Ej: "${randomExample}"`;
  });

  // ✅ CARGAR COMENTARIOS REALES CON RESPUESTAS Y LIKES
  useEffect(() => {
    const loadComments = async () => {
      if (!storyId) return;

      setLoading(true);
      try {
        const result = await getStoryComments(storyId);

        if (result.success) {
          // Transformar comentarios principales
          const transformedComments = result.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            author:
              comment.profiles?.display_name ||
              comment.profiles?.email ||
              "Usuario",
            author_id: comment.user_id,
            created_at: comment.created_at,
            parent_id: comment.parent_id,
            is_featured: comment.is_featured,
            likes_count: comment.likes_count || 0,
          }));

          // Transformar respuestas agrupadas por parent_id
          const transformedReplies = {};
          Object.keys(result.replies).forEach((parentId) => {
            transformedReplies[parentId] = result.replies[parentId].map(
              (reply) => ({
                id: reply.id,
                content: reply.content,
                author:
                  reply.profiles?.display_name ||
                  reply.profiles?.email ||
                  "Usuario",
                author_id: reply.user_id,
                created_at: reply.created_at,
                parent_id: reply.parent_id,
                is_featured: reply.is_featured,
                likes_count: reply.likes_count || 0,
              })
            );
          });

          setComments(transformedComments);
          setRepliesMap(transformedReplies);

          // Contar total (principales + todas las respuestas)
          const totalCount =
            transformedComments.length +
            Object.values(transformedReplies).reduce(
              (sum, arr) => sum + arr.length,
              0
            );

          onCommentsCountChange?.(totalCount);

          // Cargar estado de likes del usuario (batch query)
          if (isAuthenticated && result.allComments.length > 0) {
            const commentIds = result.allComments.map((c) => c.id);
            const likesResult = await getUserCommentLikesBatch(commentIds);
            if (likesResult.success) {
              setUserLikes(likesResult.likes);
            }
          }
        } else {
          console.error("Error loading comments:", result.error);
          setComments([]);
          setRepliesMap({});
          onCommentsCountChange?.(0);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
        setComments([]);
        setRepliesMap({});
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [storyId, getStoryComments, getUserCommentLikesBatch, isAuthenticated]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Debes iniciar sesión para comentar");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await addComment(storyId, newComment.trim());

      if (result.success) {
        // Track comment analytics
        trackEvent(AnalyticsEvents.COMMENT_POSTED, {
          story_id: storyId,
          contest_id: contestId,
          comment_length: newComment.trim().length,
          story_title: storyTitle,
        });
        // Transformar el comentario agregado al formato esperado
        const newCommentData = {
          id: result.comment.id,
          content: result.comment.content,
          author: user.name || user.display_name || "Usuario", // Usar el usuario actual
          author_id: result.comment.user_id,
          created_at: result.comment.created_at,
          parent_id: result.comment.parent_id,
          is_featured: result.comment.is_featured,
        };

        setComments((prev) => {
          const newComments = [newCommentData, ...prev];
          // Notificar al padre sobre el nuevo número de comentarios
          onCommentsCountChange?.(newComments.length);
          return newComments;
        });
        setNewComment("");
      } else {
        console.error("Error adding comment:", result.error);
        // Si es error de sesión, mostrar mensaje específico
        if (result.error.includes("Sesión expirada")) {
          alert(result.error);
        } else {
          alert("Error al enviar el comentario: " + result.error);
        }
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Error al enviar el comentario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    try {
      const result = await deleteComment(commentId);

      if (result.success) {
        // Determinar si es un comentario principal o una respuesta
        const isMainComment = comments.some((c) => c.id === commentId);

        if (isMainComment) {
          // Es comentario principal: remover el comentario y sus respuestas
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setRepliesMap((prev) => {
            const updated = { ...prev };
            delete updated[commentId]; // Remover todas sus respuestas
            return updated;
          });
        } else {
          // Es una respuesta: buscar en qué parent está y removerla
          setRepliesMap((prev) => {
            const updated = {};
            Object.keys(prev).forEach((parentId) => {
              updated[parentId] = prev[parentId].filter(
                (reply) => reply.id !== commentId
              );
            });
            return updated;
          });
        }

        // Recalcular contador total (setTimeout para que los states se actualicen)
        setTimeout(() => {
          const totalCount =
            comments.filter((c) => c.id !== commentId).length +
            Object.values(repliesMap)
              .filter((_, key) => key !== commentId) // Excluir respuestas del comentario eliminado
              .reduce(
                (sum, arr) =>
                  sum + arr.filter((r) => r.id !== commentId).length,
                0
              );
          onCommentsCountChange?.(totalCount);
        }, 0);
      } else {
        console.error("Error deleting comment:", result.error);
        alert("Error al eliminar el comentario: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error al eliminar el comentario");
    }
  };

  const handleReportComment = (commentId, commentContent) => {
    setReportModal({ isOpen: true, commentId, commentContent });
  };

  const handleSubmitReport = async (commentId, reason, description) => {
    try {
      const result = await reportComment(commentId, reason, description);

      if (result.success) {
        alert(
          "Reporte enviado exitosamente. Nuestro equipo lo revisará pronto."
        );
      } else {
        alert("Error al enviar el reporte: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error al enviar el reporte");
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Debes iniciar sesión para responder");
      return;
    }

    if (!replyContent.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await addComment(storyId, replyContent.trim(), parentId);

      if (result.success) {
        // Track reply analytics
        trackEvent(AnalyticsEvents.COMMENT_POSTED, {
          story_id: storyId,
          contest_id: contestId,
          comment_length: replyContent.trim().length,
          story_title: storyTitle,
          is_reply: true,
          parent_comment_id: parentId,
        });

        // Transformar la respuesta agregada
        const newReply = {
          id: result.comment.id,
          content: result.comment.content,
          author: user.name || user.display_name || "Usuario",
          author_id: result.comment.user_id,
          created_at: result.comment.created_at,
          parent_id: result.comment.parent_id,
          is_featured: result.comment.is_featured,
          likes_count: 0,
        };

        // Agregar respuesta al mapa
        setRepliesMap((prev) => {
          const parentReplies = prev[parentId] || [];
          const updated = {
            ...prev,
            [parentId]: [...parentReplies, newReply],
          };

          // Actualizar contador total
          const totalCount =
            comments.length +
            Object.values(updated).reduce((sum, arr) => sum + arr.length, 0);
          onCommentsCountChange?.(totalCount);

          return updated;
        });

        setReplyContent("");
        setReplyingTo(null); // Cerrar formulario de respuesta
      } else {
        console.error("Error adding reply:", result.error);
        alert("Error al enviar la respuesta: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Error al enviar la respuesta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para dar like");
      return;
    }

    // Optimistic update
    const currentlyLiked = userLikes[commentId] || false;
    const newLikedState = !currentlyLiked;

    // Actualizar UI inmediatamente
    setUserLikes((prev) => ({ ...prev, [commentId]: newLikedState }));

    // Actualizar contador localmente (optimistic)
    const updateCommentLikes = (commentsList) =>
      commentsList.map((c) =>
        c.id === commentId
          ? { ...c, likes_count: c.likes_count + (newLikedState ? 1 : -1) }
          : c
      );

    setComments((prev) => updateCommentLikes(prev));
    setRepliesMap((prev) => {
      const updated = {};
      Object.keys(prev).forEach((parentId) => {
        updated[parentId] = updateCommentLikes(prev[parentId]);
      });
      return updated;
    });

    try {
      const result = await toggleCommentLike(commentId);

      if (!result.success) {
        // Rollback optimistic update si falla
        setUserLikes((prev) => ({ ...prev, [commentId]: currentlyLiked }));
        setComments((prev) => updateCommentLikes(prev));
        setRepliesMap((prev) => {
          const updated = {};
          Object.keys(prev).forEach((parentId) => {
            updated[parentId] = updateCommentLikes(prev[parentId]);
          });
          return updated;
        });

        alert("Error al dar like: " + result.error);
      } else {
        // Sincronizar con el servidor (por si acaso)
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likes_count: result.likesCount } : c
          )
        );
        setRepliesMap((prev) => {
          const updated = {};
          Object.keys(prev).forEach((parentId) => {
            updated[parentId] = prev[parentId].map((c) =>
              c.id === commentId ? { ...c, likes_count: result.likesCount } : c
            );
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback
      setUserLikes((prev) => ({ ...prev, [commentId]: currentlyLiked }));
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Formulario de nuevo comentario */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500 dark:text-dark-400">
                  🌱 Recuerda: todos estamos aprendiendo. Comparte lo positivo y
                  sugiere con amabilidad
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? "Enviando..." : "Comentar"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-dark-300 mb-3">
            Inicia sesión para dejar un comentario sobre "{storyTitle}"
          </p>
          <button
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => openAuthModal("login")}
          >
            Iniciar sesión
          </button>
        </div>
      )}

      {/* Lista de comentarios con respuestas anidadas */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-dark-300 text-sm">
              Cargando comentarios...
            </p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 dark:text-dark-500 mb-2" />
            <p className="text-gray-600 dark:text-dark-300">
              Aún no hay comentarios. ¡Sé el primero en comentar!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Comentario principal */}
                <CommentCard
                  comment={comment}
                  isReply={false}
                  onReply={(commentId) => setReplyingTo(commentId)}
                  onDelete={handleDeleteComment}
                  onReport={handleReportComment}
                  onToggleLike={handleToggleLike}
                  isLiked={userLikes[comment.id] || false}
                  isAuthenticated={isAuthenticated}
                  currentUserId={user?.id}
                />

                {/* Formulario de respuesta inline */}
                {replyingTo === comment.id && (
                  <form
                    onSubmit={(e) => handleSubmitReply(e, comment.id)}
                    className="ml-4 sm:ml-6 md:ml-12 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <UserAvatar user={user} size="xs" />
                      <div className="flex-1">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                          rows={2}
                          disabled={submitting}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                            className="px-3 py-1 text-xs text-gray-600 dark:text-dark-300 hover:text-gray-800 dark:hover:text-dark-100 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={!replyContent.trim() || submitting}
                            className="inline-flex items-center px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            {submitting ? "Enviando..." : "Responder"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* Respuestas anidadas */}
                {repliesMap[comment.id] &&
                  repliesMap[comment.id].length > 0 && (
                    <div className="space-y-3">
                      {repliesMap[comment.id].map((reply) => (
                        <CommentCard
                          key={reply.id}
                          comment={reply}
                          isReply={true}
                          onDelete={handleDeleteComment}
                          onReport={handleReportComment}
                          onToggleLike={handleToggleLike}
                          isLiked={userLikes[reply.id] || false}
                          isAuthenticated={isAuthenticated}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer informativo */}
      <div className="text-xs text-gray-500 dark:text-dark-400 text-center pt-4 border-t border-gray-200 dark:border-dark-600">
        💫 Comunidad de escritores en crecimiento: valora el esfuerzo, celebra
        las fortalezas, sugiere con amabilidad
      </div>

      {/* Modal de reportes */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() =>
          setReportModal({ isOpen: false, commentId: null, commentContent: "" })
        }
        onReport={handleSubmitReport}
        commentId={reportModal.commentId}
        commentContent={reportModal.commentContent}
      />
    </div>
  );
};

export default SimpleComments;

// El componente simula comentarios, no interactúa con el contexto global.
// No se requiere autenticación real ni conexión a Supabase.
// Los comentarios se cargan y envían de forma simulada para propósitos de demostración.
