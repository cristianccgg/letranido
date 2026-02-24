import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, Zap, PenTool, MessageCircle } from "lucide-react";

/**
 * Modal que anuncia nuevas features a los usuarios existentes
 * Se muestra UNA VEZ usando localStorage
 *
 * Actualizado: Febrero 2026 - Microhistorias semanales
 */
const FeatureAnnouncementModal = ({ isOpen, onClose, userId, onGoToMicrohistorias }) => {
  const STORAGE_KEY = `feature_announcement_microhistorias_feb2026_${userId}`;
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

  const handleGoToMicrohistorias = () => {
    handleClose();
    onGoToMicrohistorias?.();
  };

  // No mostrar si el usuario ya vio el anuncio
  if (!isOpen || hasSeenAnnouncement) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header con gradiente */}
        <div className="relative bg-linear-to-br from-purple-500 via-pink-500 to-rose-500 p-4 sm:p-5 text-white rounded-t-2xl">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Microhistorias
              </h2>
              <p className="text-white/90 text-xs">
                Nueva forma de escribir en Letranido
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Qué son */}
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <PenTool className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Prompts para escribir microhistorias
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Cada prompt es una invitación a escribir una microhistoria corta (50–300 palabras). Una escena, un momento, un personaje. El objetivo es practicar y compartir con la comunidad.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Sin presión */}
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Sin votación, sin presión
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Escribe, lee y comenta. Un espacio para practicar escritura creativa con likes y comentarios de la comunidad.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Formato */}
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                50 a 300 palabras
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Microhistorias cortas que se leen en minutos. Perfectas para escribir en cualquier momento del día.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 mt-4">
            <button
              onClick={handleGoToMicrohistorias}
              className="w-full inline-flex cursor-pointer items-center justify-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              <Zap className="w-4 h-4" />
              Ver microhistorias
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureAnnouncementModal;
