// components/comments/SimpleComments.jsx - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useState, useEffect } from "react";
import { MessageSquare, Send, Heart, Trash2, Flag, User } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext"; // ✅ CAMBIADO
import UserAvatar from "../ui/UserAvatar";

const SimpleComments = ({ storyId, storyTitle }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ USO DEL CONTEXTO GLOBAL CON FUNCIONES DE COMENTARIOS
  const { 
    user, 
    isAuthenticated,
    getStoryComments,
    addComment,
    deleteComment,
    toggleCommentLike
  } = useGlobalApp();

  // ✅ CARGAR COMENTARIOS REALES
  useEffect(() => {
    const loadComments = async () => {
      if (!storyId) return;

      setLoading(true);
      try {
        const result = await getStoryComments(storyId);
        
        if (result.success) {
          // Transformar datos de Supabase al formato esperado
          const transformedComments = result.comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            author: "Usuario", // Por ahora mostrar "Usuario" genérico
            author_id: comment.user_id,
            created_at: comment.created_at,
            likes_count: comment.likes_count || 0,
            isLiked: false, // TODO: Verificar si el usuario actual ha dado like
            parent_id: comment.parent_id,
            is_featured: comment.is_featured
          }));
          
          setComments(transformedComments);
        } else {
          console.error("Error loading comments:", result.error);
          setComments([]);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [storyId, getStoryComments]);

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
        // Transformar el comentario agregado al formato esperado
        const newCommentData = {
          id: result.comment.id,
          content: result.comment.content,
          author: user.name || user.display_name || "Usuario", // Usar el usuario actual
          author_id: result.comment.user_id,
          created_at: result.comment.created_at,
          likes_count: result.comment.likes_count || 0,
          isLiked: false,
          parent_id: result.comment.parent_id,
          is_featured: result.comment.is_featured
        };

        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");
      } else {
        console.error("Error adding comment:", result.error);
        alert("Error al enviar el comentario: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Error al enviar el comentario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para dar like");
      return;
    }

    try {
      const result = await toggleCommentLike(commentId);
      
      if (result.success) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: result.liked,
                likes_count: comment.likes_count + (result.liked ? 1 : -1),
              };
            }
            return comment;
          })
        );
      } else {
        console.error("Error liking comment:", result.error);
        alert("Error al procesar el like: " + result.error);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    try {
      const result = await deleteComment(commentId);
      
      if (result.success) {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      } else {
        console.error("Error deleting comment:", result.error);
        alert("Error al eliminar el comentario: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error al eliminar el comentario");
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comentarios ({comments.length})
        </h3>
      </div>

      {/* Formulario de nuevo comentario */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario constructivo sobre esta historia..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  Sé respetuoso y constructivo en tus comentarios
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? "Enviando..." : "Comentar"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 mb-3">
            Inicia sesión para dejar un comentario sobre "{storyTitle}"
          </p>
          <button className="btn-primary text-sm">Iniciar sesión</button>
        </div>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Cargando comentarios...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">
              Aún no hay comentarios. ¡Sé el primero en comentar!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <UserAvatar 
                  user={{ name: comment.author, email: `${comment.author}@mock.com` }} 
                  size="sm" 
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botón de like */}
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={!isAuthenticated}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          comment.isLiked
                            ? "bg-red-100 text-red-600"
                            : "hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            comment.isLiked ? "fill-current" : ""
                          }`}
                        />
                        {comment.likes_count}
                      </button>

                      {/* Botón de eliminar (solo para el autor) */}
                      {isAuthenticated && user?.id === comment.author_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar comentario"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}

                      {/* Botón de reportar */}
                      {isAuthenticated && user?.id !== comment.author_id && (
                        <button
                          className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Reportar comentario"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer informativo */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
        Los comentarios están moderados. Mantén un tono respetuoso y
        constructivo.
      </div>
    </div>
  );
};

export default SimpleComments;

// El componente simula comentarios, no interactúa con el contexto global.
// No se requiere autenticación real ni conexión a Supabase.
// Los comentarios se cargan y envían de forma simulada para propósitos de demostración.
