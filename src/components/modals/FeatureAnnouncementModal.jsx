import { useState, useEffect } from "react";
import { X, UserCircle, BookCheck, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Modal que anuncia nuevas features a los usuarios existentes
 * Se muestra UNA VEZ usando localStorage
 */
const FeatureAnnouncementModal = ({ isOpen, onClose, userId }) => {
  const STORAGE_KEY = `feature_announcement_perfiles_${userId}`;
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 p-6 sm:p-8 text-white rounded-t-2xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                ¡Nuevas Features!
              </h2>
              <p className="text-white/90 text-sm">
                Mejoras pensadas para ti
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Feature 1: Perfiles Públicos */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl">
                <UserCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Perfiles Públicos de Autor
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Ahora puedes crear tu perfil de autor con biografía, país y
                redes sociales. Los lectores podrán conocerte mejor y seguir tu
                trabajo.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">✓</span>
                  <span>Agrega tu biografía y cuéntanos sobre ti</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">✓</span>
                  <span>Comparte tus redes sociales y sitio web</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">✓</span>
                  <span>Control total de privacidad sobre tu información</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Feature 2: Historias Leídas */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                <BookCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Sistema de Lectura Mejorado
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Marca las historias como leídas y lleva un seguimiento de tu
                progreso durante la votación.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Marca historias como leídas automáticamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Ve tu progreso de lectura en el concurso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Filtra historias leídas/no leídas</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              ¡Completa tu perfil ahora!
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Con el próximo reto entrando en fase de votación, es el momento
              perfecto para que los lectores te conozcan mejor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/profile"
                onClick={handleClose}
                className="inline-flex cursor-pointer items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Completar mi perfil
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Recordarme después
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Este mensaje solo se mostrará una vez. Puedes editar tu perfil en
            cualquier momento desde tu panel de usuario.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureAnnouncementModal;
