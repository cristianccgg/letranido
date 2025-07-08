// components/BadgeNotification.jsx
import React, { useState, useEffect } from "react";
import { X, Trophy } from "lucide-react";
import BadgeDisplay from "./BadgeDisplay";

const BadgeNotification = ({ badge, isVisible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Auto cerrar después de 6 segundos
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Esperar animación
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getBadgeColor = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-orange-500";
      case "epic":
        return "from-purple-400 to-pink-500";
      case "rare":
        return "from-blue-400 to-indigo-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-500 ${
        show
          ? "opacity-100 transform translate-y-0 scale-100"
          : "opacity-0 transform -translate-y-8 scale-95"
      }`}
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-6 max-w-sm relative overflow-hidden">
        {/* Fondo decorativo */}
        <div
          className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getBadgeColor(
            badge.rarity
          )}`}
        ></div>

        {/* Botón cerrar */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start space-x-4">
          {/* Badge grande */}
          <div className="flex-shrink-0 mt-1">
            <BadgeDisplay badge={badge} size="lg" showTooltip={false} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center mb-2">
              <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
              <h4 className="font-bold text-gray-900 text-sm">
                ¡Nuevo logro desbloqueado!
              </h4>
            </div>

            {/* Badge info */}
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {badge.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {badge.description}
            </p>

            {/* Rareza */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  badge.rarity === "legendary"
                    ? "bg-yellow-100 text-yellow-700"
                    : badge.rarity === "epic"
                    ? "bg-purple-100 text-purple-700"
                    : badge.rarity === "rare"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {badge.rarity === "legendary"
                  ? "✨ Legendario"
                  : badge.rarity === "epic"
                  ? "🔮 Épico"
                  : badge.rarity === "rare"
                  ? "💎 Raro"
                  : "⚪ Común"}
              </span>

              {badge.isSpecial && (
                <span className="text-xs text-yellow-600 font-medium">
                  🌟 Especial
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Efectos visuales para badges especiales */}
        {badge.rarity === "legendary" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-4 right-4 w-1 h-1 bg-orange-400 rounded-full animate-ping delay-300"></div>
            <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping delay-700"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeNotification;
