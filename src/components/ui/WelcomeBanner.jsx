// components/ui/WelcomeBanner.jsx - Banner informativo de votación activa
import { useState } from "react";
import { X, MessageCircle, Sparkles } from "lucide-react";
import FeedbackModal from "../modals/FeedbackModal";

const WelcomeBanner = () => {
  const [isVisible, setIsVisible] = useState(true); // Siempre visible

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    // Banner temporal - vuelve a aparecer al refrescar
  };

  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Mensaje */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-base font-medium">
                  <span className="hidden sm:flex">
                    <span>🗳️</span> ¡Votación activa del reto de agosto! Lee las 36 historias y vota por tus 3 favoritas. ¿Encontraste algún error o tienes sugerencias?
                  </span>
                  <span className="sm:hidden ">
                    🗳️ ¡Votación activa! Si encuentras algún error repórtanoslo
                  </span>
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-4">
              {/* Botón de Feedback */}
              <button
                onClick={openFeedbackModal}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">¡Repórtalo aquí!</span>
                <span className="sm:hidden">Reportar</span>
              </button>

              {/* Botón cerrar */}
              <button
                onClick={handleDismiss}
                className="p-1.5 text-white/80 cursor-pointer hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
                aria-label="Cerrar banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Feedback */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={closeFeedbackModal} />
    </>
  );
};

export default WelcomeBanner;
