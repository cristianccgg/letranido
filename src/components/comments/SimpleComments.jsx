// components/comments/SimpleComments.jsx - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useState, useEffect } from "react";
import { MessageSquare, Send, Trash2, Flag, User } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext"; // ✅ CAMBIADO
import { useTheme } from "../../contexts/ThemeContext";
import { useGoogleAnalytics, AnalyticsEvents } from "../../hooks/useGoogleAnalytics";
import UserAvatar from "../ui/UserAvatar";
import ReportModal from "../modals/ReportModal";
import { UserWithTopBadge } from "../ui/UserNameWithBadges";

// Hook para detectar tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const SimpleComments = ({ storyId, storyTitle, contestId, onCommentsCountChange }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportModal, setReportModal] = useState({ isOpen: false, commentId: null, commentContent: '' });

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
    openAuthModal
  } = useGlobalApp();

  // ✅ ANALYTICS
  const { trackEvent } = useGoogleAnalytics();

  // Hook para tema
  const { isDark } = useTheme();

  // Placeholders con ejemplos específicos
  const getPlaceholder = () => {
    const examples = [
      "Me gustó mucho cómo desarrollaste el personaje principal...",
      "La descripción del ambiente me transportó completamente...", 
      "Quizás podrías explorar más la motivación del protagonista...",
      "El diálogo se siente muy natural y realista...",
      "La construcción del suspenso está muy bien lograda..."
    ];
    
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    
    if (isMobile) {
      return `Ej: "${randomExample}"`;
    }
    return `Comparte qué te gustó, sugiere mejoras o comenta sobre estilo/personajes. Ej: "${randomExample}"`;
  };

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
            author: comment.profiles?.display_name || comment.profiles?.email || "Usuario",
            author_id: comment.user_id,
            created_at: comment.created_at,
            parent_id: comment.parent_id,
            is_featured: comment.is_featured
          }));
          
          setComments(transformedComments);
          // Notificar al padre sobre el número de comentarios
          onCommentsCountChange?.(transformedComments.length);
        } else {
          console.error("Error loading comments:", result.error);
          setComments([]);
          onCommentsCountChange?.(0);
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
          is_featured: result.comment.is_featured
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
        alert("Error al enviar el comentario: " + result.error);
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
        setComments((prev) => {
          const newComments = prev.filter((comment) => comment.id !== commentId);
          // Notificar al padre sobre el nuevo número de comentarios
          onCommentsCountChange?.(newComments.length);
          return newComments;
        });
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
        alert("Reporte enviado exitosamente. Nuestro equipo lo revisará pronto.");
      } else {
        alert("Error al enviar el reporte: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error al enviar el reporte");
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

      {/* Formulario de nuevo comentario */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500 dark:text-dark-400">
                  🌱 Recuerda: todos estamos aprendiendo. Comparte lo positivo y sugiere con amabilidad
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-dark-300 text-sm">Cargando comentarios...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 dark:text-dark-500 mb-2" />
            <p className="text-gray-600 dark:text-dark-300">
              Aún no hay comentarios. ¡Sé el primero en comentar!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              id={`comment-${comment.id}`}
              className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <UserAvatar 
                  user={{ name: comment.author, email: `${comment.author}@mock.com` }} 
                  size="sm" 
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserWithTopBadge 
                        userId={comment.author_id}
                        userName={comment.author}
                        className="font-medium"
                      />
                      <span className="text-xs text-gray-500 dark:text-dark-400">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botón de eliminar (solo para el autor) */}
                      {isAuthenticated && user?.id === comment.author_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 dark:text-dark-500 hover:text-red-600 transition-colors"
                          title="Eliminar comentario"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}

                      {/* Botón de reportar */}
                      {isAuthenticated && user?.id !== comment.author_id && (
                        <button
                          onClick={() => handleReportComment(comment.id, comment.content)}
                          className="p-1 text-gray-400 dark:text-dark-500 hover:text-orange-600 transition-colors"
                          title="Reportar comentario"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-dark-200 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer informativo */}
      <div className="text-xs text-gray-500 dark:text-dark-400 text-center pt-4 border-t border-gray-200 dark:border-dark-600">
        💫 Comunidad de escritores en crecimiento: valora el esfuerzo, celebra las fortalezas, sugiere con amabilidad
      </div>

      {/* Modal de reportes */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, commentId: null, commentContent: '' })}
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
