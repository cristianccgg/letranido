// components/BadgeNotification.jsx - Estilo modal como el de fundador
import React from "react";
import { X, Trophy, Star } from "lucide-react";

const BadgeNotification = ({ badge, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getBadgeColors = (rarity) => {
    switch (rarity) {
      case "legendary":
        return {
          gradient: "from-yellow-400 via-orange-400 to-red-400",
          badgeBg: "from-yellow-100 to-orange-100",
          badgeBorder: "border-yellow-300",
          buttonBg: "from-yellow-500 to-orange-500",
          buttonHover: "from-yellow-600 to-orange-600",
        };
      case "epic":
        return {
          gradient: "from-purple-400 via-pink-400 to-red-400",
          badgeBg: "from-purple-100 to-pink-100",
          badgeBorder: "border-purple-300",
          buttonBg: "from-purple-500 to-pink-500",
          buttonHover: "from-purple-600 to-pink-600",
        };
      case "rare":
        return {
          gradient: "from-blue-400 via-indigo-400 to-purple-400",
          badgeBg: "from-blue-100 to-indigo-100",
          badgeBorder: "border-blue-300",
          buttonBg: "from-blue-500 to-indigo-500",
          buttonHover: "from-blue-600 to-indigo-600",
        };
      default: // common
        return {
          gradient: "from-green-400 via-emerald-400 to-teal-400",
          badgeBg: "from-green-100 to-emerald-100",
          badgeBorder: "border-green-300",
          buttonBg: "from-green-500 to-emerald-500",
          buttonHover: "from-green-600 to-emerald-600",
        };
    }
  };

  const colors = getBadgeColors(badge.rarity);

  const getRarityText = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "✨ Legendario";
      case "epic":
        return "🔮 Épico";
      case "rare":
        return "💎 Raro";
      default:
        return "🌟 Común";
    }
  };

  const getTitle = () => {
    switch (badge.rarity) {
      case "legendary":
        return "¡Logro Legendario Desbloqueado!";
      case "epic":
        return "¡Logro Épico Desbloqueado!";
      case "rare":
        return "¡Logro Raro Desbloqueado!";
      default:
        return "¡Nuevo Logro Desbloqueado!";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform animate-in zoom-in-95 duration-300">
        <div
          className={`relative bg-gradient-to-br ${colors.gradient} p-6 rounded-t-lg text-white text-center`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Icono grande del badge */}
          <div className="text-6xl mb-4 animate-bounce">{badge.icon}</div>

          <h2 className="text-2xl font-bold mb-2">{getTitle()}</h2>

          <p className="text-yellow-100 text-sm">
            {getRarityText(badge.rarity)}
          </p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            {/* Badge display grande */}
            <div
              className={`w-20 h-20 bg-gradient-to-br ${colors.badgeBg} border-4 ${colors.badgeBorder} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
            >
              <span className="text-3xl">{badge.icon}</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {badge.name}
            </h3>

            <p className="text-gray-600 leading-relaxed">{badge.description}</p>
          </div>

          {/* Información adicional del badge */}
          <div
            className={`bg-gradient-to-r ${colors.badgeBg} border ${colors.badgeBorder} rounded-lg p-4 mb-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">
                  Rareza del logro
                </h4>
                <p className="text-gray-700 text-sm">
                  {getRarityText(badge.rarity)}
                </p>
              </div>

              {badge.isSpecial && (
                <div className="text-right">
                  <h4 className="font-bold text-gray-800 text-sm mb-1">
                    Edición especial
                  </h4>
                  <p className="text-gray-700 text-sm">🌟 Exclusivo</p>
                </div>
              )}
            </div>

            {badge.earnedAt && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-gray-600 text-xs text-center">
                  Desbloqueado el{" "}
                  {new Date(badge.earnedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Botón de cierre */}
          <button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${colors.buttonBg} text-white font-bold py-3 px-4 rounded-lg hover:${colors.buttonHover} transition-colors shadow-lg`}
          >
            ¡Genial, continuar!
          </button>
        </div>

        {/* Efectos visuales para badges especiales */}
        {badge.rarity === "legendary" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-4 right-4 w-1 h-1 bg-orange-400 rounded-full animate-ping delay-300"></div>
            <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping delay-700"></div>
            <div className="absolute top-8 right-1/3 w-1 h-1 bg-red-300 rounded-full animate-ping delay-1000"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeNotification;
