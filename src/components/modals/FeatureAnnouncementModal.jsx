import { useState, useEffect } from "react";
import { X, UserCircle, BookCheck, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../ui/Badge";

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
                ¡Novedades!
              </h2>
              <p className="text-white/90 text-xs">
                Mejoras pensadas para ti
              </p>
            </div>
          </div>
        </div>

        {/* Contenido - más compacto */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Feature 1: Perfiles Públicos */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                <UserCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                ✨ Perfiles Públicos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Crea tu perfil con biografía, país y redes sociales. Todas tus historias visibles en un solo lugar.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Feature 2: Historias Leídas */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <BookCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                📖 Lectura Rastreada
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Marca automáticamente historias como leídas
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Feature 3: Ko-fi Supporter Badge - con badge REAL */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 flex items-center">
              <Badge
                badge={{
                  id: "kofi_supporter",
                  name: "Ko-fi Supporter",
                  description: "Apoya a Letranido en Ko-fi",
                  icon: "❤️",
                  rarity: "legendary"
                }}
                size="sm"
                showDescription={false}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                ☕ Badge Exclusivo
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Reconocimiento especial para quienes apoyan en Ko-fi
              </p>
            </div>
          </div>

          {/* CTA Section - más compacto */}
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800 mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center">
              Es el momento perfecto para que los lectores te conozcan mejor
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/profile"
                onClick={handleClose}
                className="inline-flex cursor-pointer items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Completar mi perfil
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={handleClose}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureAnnouncementModal;
