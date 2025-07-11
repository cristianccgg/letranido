// components/ui/ContestPhaseBadge.jsx - BADGE DINÁMICO DE LA FASE
import { Clock, Vote, Trophy, PenTool, AlertCircle } from "lucide-react";
import { useAppState } from "../../contexts/AppStateContext";

const ContestPhaseBadge = ({
  showDescription = false,
  size = "default", // "small", "default", "large"
  className = "",
}) => {
  const { currentContest, currentContestPhase } = useAppState();

  // ✅ Función para obtener la configuración del badge
  const getBadgeConfig = () => {
    if (!currentContest) {
      return {
        text: "Sin concurso activo",
        description: "No hay concurso disponible",
        icon: AlertCircle,
        bgClass: "bg-gray-100",
        textClass: "text-gray-600",
        iconClass: "text-gray-400",
      };
    }

    switch (currentContestPhase) {
      case "submission":
        return {
          text: "📝 ENVIANDO HISTORIAS",
          description: "Los participantes están escribiendo sus historias",
          icon: PenTool,
          bgClass: "bg-blue-100",
          textClass: "text-blue-700",
          iconClass: "text-blue-600",
        };
      case "voting":
        return {
          text: "🗳️ VOTACIÓN ACTIVA",
          description: "¡Lee las historias y vota por tus favoritas!",
          icon: Vote,
          bgClass: "bg-green-100",
          textClass: "text-green-700",
          iconClass: "text-green-600",
        };
      case "results":
        return {
          text: "🏆 RESULTADOS FINALES",
          description: "Concurso finalizado - Conoce a los ganadores",
          icon: Trophy,
          bgClass: "bg-yellow-100",
          textClass: "text-yellow-700",
          iconClass: "text-yellow-600",
        };
      default:
        return {
          text: "🏆 CONCURSO ACTIVO",
          description: "Concurso en progreso",
          icon: Clock,
          bgClass: "bg-primary-100",
          textClass: "text-primary-700",
          iconClass: "text-primary-600",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  // ✅ Clases CSS según el tamaño
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          container: "px-2 py-1 text-xs",
          icon: "h-3 w-3",
        };
      case "large":
        return {
          container: "px-4 py-2 text-base",
          icon: "h-5 w-5",
        };
      default:
        return {
          container: "px-3 py-1 text-sm",
          icon: "h-4 w-4",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={className}>
      <span
        className={`inline-flex items-center font-bold rounded-full ${config.bgClass} ${config.textClass} ${sizeClasses.container}`}
        title={config.description}
      >
        <Icon className={`${sizeClasses.icon} mr-1 ${config.iconClass}`} />
        {config.text}
      </span>

      {showDescription && config.description && (
        <p className="text-xs text-gray-600 mt-1">{config.description}</p>
      )}
    </div>
  );
};

export default ContestPhaseBadge;
