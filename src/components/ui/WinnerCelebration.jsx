// components/ui/WinnerCelebration.jsx - Celebración para ganadores
import { useState, useEffect } from 'react';
import { Crown, Trophy, Award, X } from 'lucide-react';

const WinnerCelebration = ({ position, isVisible, onClose, userName, storyTitle }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Auto-cerrar después de 10 segundos
      const timeout = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getPositionData = (pos) => {
    switch (pos) {
      case 1:
        return {
          icon: Crown,
          title: '¡Felicidades! 🎉',
          subtitle: '¡Ganaste el primer lugar!',
          message: `Tu historia "${storyTitle}" fue la más votada`,
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-300'
        };
      case 2:
        return {
          icon: Trophy,
          title: '¡Excelente! 🥈',
          subtitle: '¡Segundo lugar!',
          message: `Tu historia "${storyTitle}" quedó en segundo lugar`,
          color: 'from-gray-400 to-gray-600',
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
          borderColor: 'border-gray-300'
        };
      case 3:
        return {
          icon: Award,
          title: '¡Muy bien! 🥉',
          subtitle: '¡Tercer lugar!',
          message: `Tu historia "${storyTitle}" quedó en tercer lugar`,
          color: 'from-orange-400 to-orange-600',
          bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
          borderColor: 'border-orange-300'
        };
      default:
        return {
          icon: Trophy,
          title: '¡Felicidades!',
          subtitle: `¡Top ${pos}!`,
          message: `Tu historia "${storyTitle}" quedó en una excelente posición`,
          color: 'from-purple-400 to-indigo-600',
          bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50',
          borderColor: 'border-purple-300'
        };
    }
  };

  const positionData = getPositionData(position);
  const IconComponent = positionData.icon;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className={`relative max-w-md w-full ${positionData.bgColor} rounded-2xl border-2 ${positionData.borderColor} shadow-2xl overflow-hidden`}>
          {/* Confetti animation */}
          {showConfetti && <ConfettiAnimation />}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Content */}
          <div className="p-8 text-center relative z-10">
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${positionData.color} mb-6 animate-bounce`}>
              <IconComponent className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {positionData.title}
            </h2>

            {/* Subtitle */}
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              {positionData.subtitle}
            </h3>

            {/* Message */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {positionData.message}
            </p>

            {/* Action button */}
            <button
              onClick={onClose}
              className={`w-full py-3 px-6 bg-gradient-to-r ${positionData.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105`}
            >
              ¡Genial! Continuar
            </button>

            {/* Share suggestion */}
            <p className="text-sm text-gray-500 mt-4">
              ¡Comparte tu logro con otros escritores!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// Componente de animación de confetti
const ConfettiAnimation = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Generar partículas de confetti */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        >
          <div
            className={`w-2 h-2 ${
              ['bg-yellow-400', 'bg-blue-400', 'bg-red-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]
            } rounded-full`}
          />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};

export default WinnerCelebration;