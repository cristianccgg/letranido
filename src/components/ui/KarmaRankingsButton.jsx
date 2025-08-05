import React, { useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import KarmaRankingsSidebar from './KarmaRankingsSidebar';

const KarmaRankingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed left-0 top-1/2 -translate-y-1/2 z-30
          bg-gradient-to-r from-yellow-400 to-orange-500 
          text-white font-bold py-3 px-4 pr-6
          rounded-r-xl shadow-lg hover:shadow-xl
          transform transition-all duration-300 hover:scale-105
          flex items-center gap-2
          ${isOpen ? 'translate-x-0' : 'hover:translate-x-1'}
        `}
        aria-label="Ver Rankings de Karma"
      >
        {/* Iconos */}
        <div className="flex items-center gap-1">
          <Trophy className="h-5 w-5" />
          <Zap className="h-4 w-4" />
        </div>
        
        {/* Texto */}
        <div className="flex flex-col items-start">
          <span className="text-sm leading-tight">Rankings</span>
          <span className="text-xs opacity-90 leading-tight">Karma</span>
        </div>

        {/* Indicador visual */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </button>

      {/* Sidebar */}
      <KarmaRankingsSidebar 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default KarmaRankingsButton;