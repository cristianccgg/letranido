// components/comments/SimpleComments.jsx
import { useState, useEffect } from "react";
import { MessageSquare, Send, User, Clock, Reply, Trash2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

const SimpleComments = ({ storyId, storyTitle }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar comentarios
  useEffect(() => {
    if (storyId) {
      loadComments();
    }
  }, [storyId]);

  const loadComments = async () => {
    try {
      setLoading(true);

      // NUEVA CONSULTA - Sin join directo
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Obtener información de usuarios por separado
      const userIds = [...new Set(commentsData?.map((c) => c.user_id) || [])];
      const { data: userProfiles } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .in("id", userIds);

      // Combinar datos manualmente
      const commentsWithUsers =
        commentsData?.map((comment) => ({
          ...comment,
          user_profiles: userProfiles?.find(
            (u) => u.id === comment.user_id
          ) || {
            id: comment.user_id,
            display_name: "Usuario",
          },
        })) || [];

      const organized = organizeComments(commentsWithUsers);
      setComments(organized);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const organizeComments = (flatComments) => {
    const parentComments = flatComments.filter((c) => !c.parent_id);
    const childComments = flatComments.filter((c) => c.parent_id);

    return parentComments.map((parent) => ({
      ...parent,
      replies: childComments.filter((child) => child.parent_id === parent.id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Debes iniciar sesión para comentar");
      return;
    }

    if (!newComment.trim()) return;

    if (newComment.length > 500) {
      alert("El comentario no puede exceder 500 caracteres");
      return;
    }

    try {
      setSubmitting(true);

      // INSERTAR comentario sin join
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            content: newComment.trim(),
            story_id: storyId,
            user_id: user.id,
            parent_id: replyTo,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;

      // Obtener info del usuario por separado
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .eq("id", user.id)
        .single();

      // Agregar datos de usuario al comentario
      const commentWithUser = {
        ...data,
        user_profiles: userProfile || {
          id: user.id,
          display_name: user.name || "Usuario",
        },
      };

      // Agregar a la lista local
      if (replyTo) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === replyTo
              ? { ...comment, replies: [...comment.replies, commentWithUser] }
              : comment
          )
        );
      } else {
        setComments((prev) => [...prev, { ...commentWithUser, replies: [] }]);
      }

      setNewComment("");
      setReplyTo(null);
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Error al enviar comentario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId, isReply = false, parentId = null) => {
    if (!confirm("¿Seguro que quieres eliminar este comentario?")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id); // Solo el autor puede eliminar

      if (error) throw error;

      if (isReply) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: comment.replies.filter((r) => r.id !== commentId),
                }
              : comment
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Error al eliminar comentario");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Hace unos minutos";
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Ayer";
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Cargando comentarios...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        Comentarios (
        {comments.reduce((total, c) => total + 1 + c.replies.length, 0)})
      </h3>

      {/* Formulario de comentario */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {replyTo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-blue-800 text-sm">
                📝 Respondiendo a un comentario
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyTo
                  ? "Escribe tu respuesta..."
                  : "Comparte tu opinión sobre esta historia..."
              }
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              rows={3}
              maxLength={500}
              disabled={submitting}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {newComment.length}/500
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              💡 Sé respetuoso y constructivo en tus comentarios
            </span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {replyTo ? "Responder" : "Comentar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800">
            <strong>Inicia sesión</strong> para dejar un comentario y unirte a
            la conversación sobre "{storyTitle}"
          </p>
        </div>
      )}

      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Sé el primero en comentar esta historia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Comentario principal */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {comment.user_profiles?.display_name || "Usuario"}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-gray-500 hover:text-primary-600 text-sm flex items-center"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Responder
                    </button>

                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-500 hover:text-red-600 text-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-8 space-y-3">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 text-sm">
                              {reply.user_profiles?.display_name || "Usuario"}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(reply.created_at)}
                            </div>
                          </div>
                        </div>

                        {user?.id === reply.user_id && (
                          <button
                            onClick={() =>
                              handleDelete(reply.id, true, comment.id)
                            }
                            className="text-gray-500 hover:text-red-600 text-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SimpleComments;
