// components/BadgeDisplay.jsx
import React from "react";

const BadgeDisplay = ({ badge, size = "sm", showTooltip = true }) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
  };

  const rarityColors = {
    common: "bg-gray-100 border-gray-300 text-gray-700",
    rare: "bg-blue-100 border-blue-300 text-blue-700",
    epic: "bg-purple-100 border-purple-300 text-purple-700",
    legendary:
      "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 text-yellow-700",
  };

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]} 
          ${rarityColors[badge.rarity] || rarityColors.common}
          rounded-full border-2 flex items-center justify-center font-bold
          ${badge.isSpecial ? "animate-pulse" : ""}
          cursor-help
        `}
        title={showTooltip ? `${badge.name}: ${badge.description}` : ""}
      >
        {badge.icon}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
            <div className="font-bold">{badge.name}</div>
            <div className="text-gray-300">{badge.description}</div>
            {badge.earnedAt && (
              <div className="text-gray-400 text-xs mt-1">
                {new Date(badge.earnedAt).toLocaleDateString("es-ES")}
              </div>
            )}
            {/* Flecha del tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
