// components/ui/ContestActionButton.jsx - ACTUALIZADO PARA CONTEXTO UNIFICADO
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Vote,
  Trophy,
  Eye,
  User,
  CheckCircle,
  Loader,
  Clock,
  Heart,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import AuthModal from "../forms/AuthModal";

const ContestActionButton = ({
  size = "default", // "small", "default", "large"
  showDescription = true,
  className = "",
  onAuthRequired,
  customText,
  disabled = false,
  forceWhiteStyle = false, // ✅ NUEVO: Para forzar estilo blanco en footer
  contestId = null, // ✅ NUEVO: ID del reto específico 
  forcedPhase = null, // ✅ NUEVO: Forzar una fase específica
}) => {
  // ✅ TODO DESDE EL CONTEXTO GLOBAL UNIFICADO
  const {
    isAuthenticated,
    user,
    currentContest,
    currentContestPhase,
    contests, // ✅ Para poder encontrar contest específico
    userStories, // ✅ Podemos usar directamente las historias del usuario
    userStoriesLoading,
  } = useGlobalApp(); // ✅ Cambiado de useAuthStore + useAppState

  const [hasUserParticipated, setHasUserParticipated] = useState(false);
  const [loadingParticipation, setLoadingParticipation] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ✅ Determinar el reto y fase a usar
  const targetContestId = contestId || currentContest?.id;
  const targetPhase = forcedPhase || currentContestPhase;
  const targetContest = contestId 
    ? contests.find(c => c.id === contestId) || currentContest
    : currentContest;

  // ✅ Verificar participación usando los datos ya cargados del contexto (OPTIMIZADO)
  useEffect(() => {
    // ✅ Si no hay usuario o reto, no hay participación
    if (!targetContestId || !user || !isAuthenticated) {
      setHasUserParticipated(false);
      setLoadingParticipation(false);
      return;
    }

    // ✅ Si aún está cargando las historias del usuario, mostrar loading
    if (userStoriesLoading) {
      setLoadingParticipation(true);
      return;
    }

    setLoadingParticipation(false);

    // ✅ Verificar directamente en las historias ya cargadas
    const hasParticipated = userStories.some(
      (story) => story.contest_id === targetContestId
    );

    // Solo actualizar y loggear si realmente cambió
    if (hasParticipated !== hasUserParticipated) {
      console.log("🔍 Verificación de participación:", {
        contestId: targetContestId,
        userId: user.id,
        hasParticipated,
        userStoriesCount: userStories.length,
        previousState: hasUserParticipated,
      });
      setHasUserParticipated(hasParticipated);
    }
  }, [
    targetContestId,
    user?.id,
    isAuthenticated,
    userStories, // Array completo para detectar cambios de historias
    userStoriesLoading,
  ]); // Removido hasUserParticipated para evitar loops

  // ✅ Función para obtener la configuración del botón
  const getButtonConfig = () => {
    if (disabled) {
      return {
        text: customText || "No disponible",
        description: "",
        href: "#",
        onClick: null,
        icon: Clock,
        disabled: true,
        variant: "secondary",
      };
    }

    if (!targetContest) {
      return {
        text: "Ver retos",
        description: "Explora los retos anteriores",
        href: "/contest/current",
        onClick: null,
        icon: Eye,
        disabled: false,
        variant: "secondary",
      };
    }

    if (loadingParticipation) {
      return {
        text: "Verificando...",
        description: "",
        href: "#",
        onClick: null,
        icon: Loader,
        disabled: true,
        variant: "secondary",
      };
    }

    // ✅ Lógica según la fase del reto y participación
    switch (targetPhase) {
      case "submission":
        // ✅ SOLO para usuarios autenticados verificamos participación
        if (isAuthenticated && hasUserParticipated) {
          return {
            text: customText || "Ya participaste",
            description: "Tu historia fue enviada exitosamente",
            href: "/contest/current",
            onClick: null,
            icon: CheckCircle,
            disabled: true,
            variant: "success",
          };
        }

        // ✅ Para todos los demás (no autenticados + autenticados sin participar)
        return {
          text: customText || "Escribir mi historia",
          description: isAuthenticated
            ? `Participa en el reto de ${targetContest.month}`
            : "Comienza a escribir (registro al enviar)",
          href: `/write/${targetContest.id}`,
          onClick: null,
          icon: PenTool,
          disabled: false,
          variant: "primary",
        };

      case "voting":
        if (!isAuthenticated) {
          return {
            text: customText || "Registrarse para votar",
            description: "Únete para votar por tus historias favoritas",
            href: "#",
            onClick: "auth",
            icon: User,
            disabled: false,
            variant: "primary",
          };
        }

        if (isAuthenticated && hasUserParticipated) {
          return {
            text: customText || "Votar por historias",
            description: "Lee y vota por tus favoritas",
            href: "/contest/current",
            onClick: "scroll",
            icon: Vote,
            disabled: false,
            variant: "primary",
          };
        }
        return {
          text: customText || "Leer y votar",
          description: isAuthenticated
            ? "Explora las historias y vota"
            : "Regístrate para votar por las historias",
          href: isAuthenticated ? "/contest/current" : "#",
          onClick: isAuthenticated ? "scroll" : "auth",
          icon: isAuthenticated ? Heart : User,
          disabled: false,
          variant: "primary",
        };

      case "results":
        return {
          text: customText || "Ver resultados",
          description: "Descubre a los ganadores",
          href: "/contest/current",
          onClick: "scroll",
          icon: Trophy,
          disabled: false,
          variant: "secondary",
        };

      default:
        return {
          text: customText || "Ver reto",
          description: "",
          href: "/contest/current",
          onClick: null,
          icon: Eye,
          disabled: false,
          variant: "secondary",
        };
    }
  };

  // ✅ Handler para clics especiales
  const handleClick = (e, onClick, href) => {
    if (onClick === "auth") {
      e.preventDefault();
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        setShowAuthModal(true);
      }
    } else if (onClick === "scroll") {
      e.preventDefault();
      // Ir a la página y hacer scroll
      if (href) {
        window.location.href = href + "#stories-section";
      }
    }
    // Para otros casos, dejar que el Link maneje la navegación normal
  };

  const config = getButtonConfig();
  const Icon = config.icon;

  // ✅ Clases CSS según el variant y size - MODERNIZADAS
  const getButtonClasses = () => {
    const baseClasses =
      "inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl shadow-lg hover:shadow-xl hover:scale-105";

    // Size classes
    const sizeClasses = {
      small: "px-3 py-2 text-xs md:px-4 md:text-sm",
      default: "px-4 py-2 text-xs md:px-5 md:py-3 md:text-sm",
      large: "px-6 py-3 text-sm md:px-8 md:py-4 md:text-base",
    };

    // Variant classes - ✅ Modernizadas con gradientes elegantes
    const variantClasses = {
      primary: config.disabled
        ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:scale-100 hover:shadow-lg"
        : forceWhiteStyle
          ? "bg-white text-indigo-600 hover:bg-indigo-50 focus:ring-white hover:shadow-2xl"
          : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500",
      secondary: config.disabled
        ? "bg-gray-100 text-gray-400 cursor-not-allowed hover:scale-100 hover:shadow-lg"
        : forceWhiteStyle
          ? "bg-white/20 text-white border border-white hover:bg-white/30 focus:ring-white backdrop-blur-sm"
          : "bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-purple-300 focus:ring-indigo-500",
      outline: config.disabled
        ? "border border-gray-200 text-gray-400 cursor-not-allowed hover:scale-100 hover:shadow-lg"
        : forceWhiteStyle
          ? "border-2 border-white text-white hover:bg-white/10 focus:ring-white backdrop-blur-sm"
          : "border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-purple-400 focus:ring-indigo-500",
      success: forceWhiteStyle
        ? "bg-white/20 text-white cursor-not-allowed backdrop-blur-sm hover:scale-100"
        : "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 cursor-not-allowed border border-green-200 hover:scale-100 hover:shadow-lg",
    };

    return `${baseClasses} ${sizeClasses[size]} ${
      variantClasses[config.variant]
    } ${className}`;
  };

  // ✅ Render del botón
  const ButtonContent = () => (
    <>
      {config.icon === Loader ? (
        <Icon
          className={`animate-spin ${
            size === "small" ? "h-4 w-4" : "h-5 w-5"
          } ${config.text ? "mr-2" : ""}`}
        />
      ) : (
        <Icon
          className={`${size === "small" ? "h-4 w-4" : "h-5 w-5"} ${
            config.text ? "mr-2" : ""
          }`}
        />
      )}
      {config.text && <span>{config.text}</span>}
    </>
  );

  return (
    <>
      {config.disabled || config.onClick ? (
        <button
          onClick={(e) => handleClick(e, config.onClick, config.href)}
          disabled={config.disabled}
          className={getButtonClasses()}
          title={config.description}
        >
          <ButtonContent />
        </button>
      ) : (
        <Link
          to={config.href}
          className={getButtonClasses()}
          title={config.description}
        >
          <ButtonContent />
        </Link>
      )}

      {showDescription && config.description && !config.disabled && (
        <p
          className={`text-xs mt-1 text-center max-w-xs ${
            forceWhiteStyle ? "text-white/80" : "text-gray-500"
          }`}
        >
          {config.description}
        </p>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};

export default ContestActionButton;

// El componente usa el contexto correctamente y no causa el bug.
