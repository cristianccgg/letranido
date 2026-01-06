const KarmaRankingsButton = ({ isOpen, onToggle }) => {
  // Solo mostrar cuando el sidebar está cerrado (tanto en mobile como desktop)
  if (isOpen === true) {
    return null;
  }

  return (
    <button
      onClick={onToggle}
      className={`
        fixed left-0 z-30 cursor-pointer
        bg-gradient-to-r from-yellow-400 to-orange-500
        text-white font-bold
        rounded-r-xl shadow-lg hover:shadow-xl
        transform transition-all duration-300 hover:scale-105
        flex items-center justify-center
        hover:translate-x-1

        // Desktop: posición central y tamaño normal
        lg:top-1/2 lg:-translate-y-1/2 lg:py-3 lg:px-4

        // Mobile: posición más baja y tamaño muy reducido
        top-1/2 py-1 px-1 pr-2
      `}
      aria-label="Abrir Rankings"
    >
      {/* Solo texto "Rankings" (el botón solo aparece cuando está cerrado) */}
      <div className="flex items-center">
        <span
          className="lg:text-sm text-xs leading-tight"
          style={{ writingMode: "vertical-rl" }}
        >
          Rankings
        </span>
      </div>
    </button>
  );
};

export default KarmaRankingsButton;
