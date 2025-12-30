import { useState, useEffect } from "react";
import { X, MessageSquare, Heart, Reply, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Modal que anuncia nuevas features a los usuarios existentes
 * Se muestra UNA VEZ usando localStorage
 *
 * Actualizado: Diciembre 2024 - Comentarios interactivos + Roadmap 2025
 */
const FeatureAnnouncementModal = ({ isOpen, onClose, userId }) => {
  const STORAGE_KEY = `feature_announcement_comments_dec2024_${userId}`;
  const [hasSeenAnnouncement, setHasSeenAnnouncement] = useState(false);

  useEffect(() => {
    if (userId) {
      const seen = localStorage.getItem(STORAGE_KEY);
      setHasSeenAnnouncement(seen === "true");
    }
  }, [userId, STORAGE_KEY]);

  const handleClose = () => {
    if (userId) {
      localStorage.setItem(STORAGE_KEY, "true");
      setHasSeenAnnouncement(true);
    }
    onClose();
  };

  // No mostrar si el usuario ya vio el anuncio
  if (!isOpen || hasSeenAnnouncement) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header con gradiente - más compacto */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 p-4 sm:p-5 text-white rounded-t-2xl">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                ✨ Comentarios más interactivos
              </h2>
              <p className="text-white/90 text-xs">
                Nuevas funcionalidades disponibles ahora
              </p>
            </div>
          </div>
        </div>

        {/* Contenido - más compacto */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Feature 1: Respuestas a Comentarios */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Reply className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                💬 Responde Comentarios
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Ahora puedes responder directamente a comentarios en las historias. Crea conversaciones más profundas con otros lectores.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Feature 2: Likes en Comentarios */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                ❤️ Likes en Comentarios
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Dale like a los comentarios que te gusten. Celebra los aportes valiosos de la comunidad.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Roadmap 2026 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                🚀 Próximo en 2026
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Historias libres fuera de retos, múltiples concursos mensuales, y un nuevo sistema de créditos. ¡Mantente atento!
              </p>
            </div>
          </div>

          {/* CTA Section - más compacto */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center">
              ¡Visita cualquier historia y prueba las nuevas funciones!
            </p>
            <button
              onClick={handleClose}
              className="w-full inline-flex cursor-pointer items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ¡Entendido!
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureAnnouncementModal;
