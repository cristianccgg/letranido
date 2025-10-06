import { useState, useEffect } from 'react';

const STORAGE_KEY = 'letranido_coming_soon_shown_v1';

/**
 * Hook para manejar el estado del modal de Coming Soon
 * @param {boolean} userAuthenticated - Si el usuario está autenticado (opcional, para mostrar solo a usuarios logueados)
 * @returns {Object} { isOpen, closeModal, resetModal }
 */
export const useComingSoonModal = (userAuthenticated = true) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // ============================================================
    // 🔧 MODO DESARROLLO vs PRODUCCIÓN
    // ============================================================
    // DESARROLLO (actual): Modal aparece siempre para testing
    // PRODUCCIÓN: Descomentar línea 16, comentar línea 17
    // ============================================================

    const hasBeenShown = localStorage.getItem(STORAGE_KEY); // ← PRODUCCIÓN: Solo muestra una vez
    // const hasBeenShown = false; // ← DESARROLLO: Descomentar para testing continuo

    // Mostrar solo si:
    // 1. No se ha mostrado antes
    // 2. (Opcional) Usuario está autenticado, si se requiere
    if (!hasBeenShown && userAuthenticated) {
      // Pequeño delay para mejor UX (después de que la página cargue)
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [userAuthenticated]);

  const closeModal = () => {
    setIsOpen(false);
    // Marcar como visto en localStorage
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Función para resetear (útil para testing o para volver a mostrar)
  const resetModal = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsOpen(true);
  };

  return {
    isOpen,
    closeModal,
    resetModal
  };
};
