// components/ui/WelcomeBanner.jsx - Banner informativo de votación activa
import { useState } from "react";
import { X, MessageCircle, Sparkles, Trophy, Vote } from "lucide-react";
import { Link } from "react-router-dom";
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

  const scrollToPodium = () => {
    const winnersSection = document.getElementById('winners-section');
    if (winnersSection) {
      winnersSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToPoll = () => {
    const pollSection = document.querySelector('[data-poll-section]');
    if (pollSection) {
      pollSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Mensaje */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-base font-medium">
                  <span className="hidden sm:flex">
                    <span>🗳️</span> ¡Ayuda a elegir el tema del reto de noviembre! Tu opinión cuenta.
                  </span>
                  <span className="sm:hidden ">
                    🗳️ ¡Ayuda a elegir el tema de noviembre!
                  </span>
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-4">
              {/* Botón a la Votación */}
              <button
                onClick={scrollToPoll}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                <Vote className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ir a Votar</span>
                <span className="sm:hidden">Votar</span>
              </button>
              
              {/* Botón de Feedback - Comentado temporalmente */}
              {/* <button
                onClick={openFeedbackModal}
                className="inline-flex cursor-pointer items-center px-2 py-1.5 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Reportar</span>
                <span className="sm:hidden">Bug?</span>
              </button> */}

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
