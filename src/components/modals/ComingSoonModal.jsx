import { useState, useEffect } from "react";
import { X, Sparkles, BookOpen, CheckCircle, Calendar } from "lucide-react";
import confetti from "canvas-confetti";

const ComingSoonModal = ({ isOpen, onClose }) => {
  const [show, setShow] = useState(false);
  const [showFeature1, setShowFeature1] = useState(false);
  const [showFeature2, setShowFeature2] = useState(false);
  const [showDate, setShowDate] = useState(false);

  // Función de confetti personalizada
  const fireConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        spread: 26,
        startVelocity: 55,
      });
    }

    // Explosión de confetti con colores de Letranido
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#6366f1', '#8b5cf6', '#ec4899'], // indigo, purple, pink
    });

    fire(0.2, {
      spread: 60,
      colors: ['#6366f1', '#8b5cf6', '#ec4899'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#6366f1', '#8b5cf6', '#ec4899'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#6366f1', '#8b5cf6', '#ec4899'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#6366f1', '#8b5cf6', '#ec4899'],
    });
  };

  useEffect(() => {
    if (isOpen) {
      // Animación secuencial
      const timer1 = setTimeout(() => {
        setShow(true);
        // Confetti explosión después de que aparece el modal
        setTimeout(() => fireConfetti(), 300);
      }, 50);

      // Reveal progresivo de features
      const timer2 = setTimeout(() => setShowFeature1(true), 800);
      const timer3 = setTimeout(() => setShowFeature2(true), 1200);
      const timer4 = setTimeout(() => setShowDate(true), 1600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setShow(false);
      setShowFeature1(false);
      setShowFeature2(false);
      setShowDate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleNotifyMe = () => {
    // Mini confetti al hacer clic
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899'],
      zIndex: 9999,
    });
    handleClose();
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden ring-1 ring-slate-200 dark:ring-gray-600 transition-all duration-500 transform ${
          show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white p-4 sm:p-6 relative overflow-hidden">
          {/* Decoración de fondo animada */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold animate-fade-in">
                  ¡Escuchamos tu voz!
                </h2>
              </div>
              <p className="text-white/90 text-xs sm:text-sm">
                Tú lo pediste, lo estamos construyendo
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20 active:bg-white/30 ml-2 cursor-pointer touch-manipulation"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Mensaje principal */}
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 text-center">
            Gracias a <span className="font-semibold text-indigo-600 dark:text-indigo-400">tu voz</span>, estamos preparando:
          </p>

          {/* Features con reveal progresivo */}
          <div className="space-y-3 sm:space-y-4">
            {/* Feature 1: Perfiles Públicos */}
            <div
              className={`bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-3 sm:p-4 border border-indigo-100 dark:border-indigo-800/50 transition-all duration-500 transform ${
                showFeature1 ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 dark:bg-indigo-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1">
                    ✨ Perfiles Públicos de Autores
                  </h3>
                  <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">→</span>
                      <span>Muestra tu biografía, redes sociales y portfolio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">→</span>
                      <span>Sigue a tus autores favoritos ⭐</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">→</span>
                      <span>Descubre todas las historias y el progreso de cada escritor</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Feature 2: Marcar como Leído */}
            <div
              className={`bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-3 sm:p-4 border border-purple-100 dark:border-purple-800/50 transition-all duration-500 transform ${
                showFeature2 ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 dark:bg-purple-700 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1">
                    📖 Marcar Historias como Leídas
                  </h3>
                  <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 mt-0.5">→</span>
                      <span>No vuelvas a abrir historias que ya leíste</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 mt-0.5">→</span>
                      <span>Organiza tu lectura durante votaciones</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Fecha de lanzamiento con reveal */}
          <div
            className={`bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-xl p-3 sm:p-4 text-center transition-all duration-500 transform ${
              showDate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-white">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-bold text-sm sm:text-lg">Lanzamiento en los próximos días</span>
            </div>
          </div>

          {/* Botón */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleNotifyMe}
              className="w-full sm:w-auto px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-800 dark:hover:to-purple-800 active:scale-95 transition-all duration-200 font-medium flex items-center justify-center gap-2 hover:scale-105 animate-pulse-subtle cursor-pointer touch-manipulation"
            >
              <Sparkles className="h-4 w-4" />
              ¡Me emociona!
            </button>
          </div>
        </div>
      </div>

      {/* CSS personalizado para animación de pulso sutil */}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ComingSoonModal;
