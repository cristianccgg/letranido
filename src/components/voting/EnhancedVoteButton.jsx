// components/voting/EnhancedVoteButton.jsx - Solo clases Tailwind puras
import { useState, useEffect } from "react";
import { Heart, Lock, Clock, User, CheckCircle, Sparkles } from "lucide-react";

const EnhancedVoteButton = ({
  isLiked = false,
  likesCount = 0,
  canVote = true,
  votingInfo = {},
  isAuthenticated = false,
  onVote,
  onAuthRequired,
  size = "default", // "small", "default", "large"
  showTooltip = true,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [previousCount, setPreviousCount] = useState(likesCount);

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          button: "px-2 py-1 text-xs",
          icon: "h-3 w-3",
          text: "text-xs",
        };
      case "large":
        return {
          button: "px-6 py-3 text-lg",
          icon: "h-6 w-6",
          text: "text-lg",
        };
      default:
        return {
          button: "px-4 py-2 text-sm",
          icon: "h-4 w-4",
          text: "text-sm",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Detectar cambios en el conteo para animaciones
  useEffect(() => {
    if (likesCount !== previousCount) {
      if (likesCount > previousCount) {
        // Si aumentó, mostrar animación de celebración
        setShowSparkles(true);
        setTimeout(() => setShowSparkles(false), 1200);
      }
      setPreviousCount(likesCount);
    }
  }, [likesCount, previousCount]);

  const handleClick = async () => {
    if (disabled) return;

    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    if (!canVote) {
      return;
    }

    setIsAnimating(true);
    await onVote?.();

    // Resetear animación después de un momento
    setTimeout(() => setIsAnimating(false), 600);
  };

  const getButtonState = () => {
    const baseClasses = `${sizeClasses.button} flex items-center gap-2 rounded-lg font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`;

    if (disabled) {
      return {
        className: `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 scale-95`,
        icon: <Heart className={`${sizeClasses.icon} opacity-50`} />,
        tooltip: "Votación deshabilitada",
      };
    }

    if (!isAuthenticated) {
      return {
        className: `${baseClasses} bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:scale-105 cursor-pointer`,
        icon: (
          <Heart
            className={`${sizeClasses.icon} ${
              isHovered ? "animate-bounce" : ""
            }`}
          />
        ),
        tooltip: "Inicia sesión para votar",
      };
    }

    if (!canVote) {
      if (votingInfo.reason?.includes("propia")) {
        return {
          className: `${baseClasses} bg-purple-50 text-purple-600 border-purple-200 cursor-not-allowed opacity-70`,
          icon: <User className={`${sizeClasses.icon}`} />,
          tooltip: "No puedes votar por tu propia historia",
        };
      }

      if (votingInfo.phase === "submission") {
        return {
          className: `${baseClasses} bg-yellow-50 text-yellow-600 border-yellow-200 cursor-not-allowed opacity-70`,
          icon: <Clock className={`${sizeClasses.icon}`} />,
          tooltip: "La votación aún no ha comenzado",
        };
      }

      if (votingInfo.phase === "results") {
        return {
          className: `${baseClasses} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed opacity-70`,
          icon: <Lock className={`${sizeClasses.icon}`} />,
          tooltip: "La votación ha terminado",
        };
      }

      return {
        className: `${baseClasses} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed opacity-70`,
        icon: <Lock className={`${sizeClasses.icon}`} />,
        tooltip: votingInfo.reason || "No se puede votar",
      };
    }

    // Estado normal - puede votar
    if (isLiked) {
      return {
        className: `${baseClasses} bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer shadow-lg shadow-red-100 ${
          isAnimating ? "animate-pulse scale-110" : "hover:scale-105"
        }`,
        icon: (
          <Heart
            className={`${sizeClasses.icon} fill-current ${
              isAnimating ? "animate-bounce text-red-500" : ""
            }`}
          />
        ),
        tooltip: "Quitar voto",
      };
    }

    return {
      className: `${baseClasses} bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer ${
        isHovered ? "scale-105 shadow-md" : ""
      } ${isAnimating ? "animate-pulse" : ""}`,
      icon: (
        <Heart
          className={`${sizeClasses.icon} ${
            isAnimating ? "animate-bounce" : ""
          } ${isHovered ? "animate-pulse" : ""}`}
        />
      ),
      tooltip: "Dar like a esta historia",
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled || (!isAuthenticated && !onAuthRequired) || !canVote}
        className={`${buttonState.className} ${isAnimating && isLiked ? 'animate-heart-burst' : ''} transition-all duration-300`}
        title={showTooltip ? buttonState.tooltip : undefined}
        style={{
          transform: isHovered && canVote ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <span className={`${isAnimating && isLiked ? 'animate-heart-burst' : ''} transition-transform duration-200`}>
          {buttonState.icon}
        </span>

        <span
          className={`${sizeClasses.text} ${
            likesCount > previousCount ? "animate-count-bounce" : ""
          } transition-all duration-300`}
        >
          {likesCount}
          {size !== "small" && (
            <span className="ml-1">{likesCount === 1 ? "like" : "likes"}</span>
          )}
        </span>

        {/* Indicador visual de voto propio */}
        {isLiked && (
          <CheckCircle className="h-3 w-3 text-red-500 ml-1 animate-pulse" />
        )}
      </button>

      {/* Tooltip personalizado para casos especiales */}
      {showTooltip && isHovered && votingInfo.votingStartsAt && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 animate-fade-in">
          <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
            Votación inicia el{" "}
            {votingInfo.votingStartsAt.toLocaleDateString("es-ES")}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      )}

      {showTooltip && isHovered && votingInfo.votingEndsAt && canVote && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 animate-fade-in">
          <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
            Puedes votar hasta el{" "}
            {votingInfo.votingEndsAt.toLocaleDateString("es-ES")}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      )}

      {/* Sparkles de celebración */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 animate-sparkle" />
          <Sparkles className="absolute -top-1 -left-2 h-3 w-3 text-pink-400 animate-sparkle" style={{ animationDelay: '0.2s' }} />
          <Sparkles className="absolute -bottom-1 right-0 h-3 w-3 text-purple-400 animate-sparkle" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
};

// El componente solo recibe props y no interactúa con el contexto directamente.

export default EnhancedVoteButton;
