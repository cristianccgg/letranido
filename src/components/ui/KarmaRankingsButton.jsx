import React, { useState } from "react";
import { Trophy, Zap } from "lucide-react";
import KarmaRankingsSidebar from "./KarmaRankingsSidebar";

const KarmaRankingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed left-0 z-30 cursor-pointer
          bg-gradient-to-r from-yellow-400 to-orange-500 
          text-white font-bold 
          rounded-r-xl shadow-lg hover:shadow-xl
          transform transition-all duration-300 hover:scale-105
          flex items-center gap-2
          ${isOpen ? "translate-x-0" : "hover:translate-x-1"}
          
          // Desktop: posición central y tamaño normal
          lg:top-1/2 lg:-translate-y-1/2 lg:py-3 lg:px-4 lg:pr-6
          
          // Mobile: posición más baja y tamaño reducido
          top-1/3 py-2 px-2 pr-4
        `}
        aria-label="Ver Rankings de Karma"
      >
        {/* Texto - más pequeño en mobile */}
        <div className="flex  items-center">
          <span
            className="lg:text-sm text-xs leading-tight"
            style={{ writingMode: "vertical-rl" }}
          >
            Rankings
          </span>
          <span
            className="lg:text-xs text-[10px] opacity-90 leading-tight"
            style={{ writingMode: "vertical-rl" }}
          >
            Karma
          </span>
        </div>

        {/* Indicador visual - más pequeño en mobile */}
        <div className="absolute -top-1 -right-1 lg:w-3 lg:h-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      </button>

      {/* Sidebar */}
      <KarmaRankingsSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default KarmaRankingsButton;
