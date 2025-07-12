import {
  X,
  Trophy,
  Clock,
  Star,
  Heart,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

const ContestRulesModal = ({ isOpen, onClose, contest }) => {
  if (!isOpen) return null;

  const essentialRules = [
    {
      icon: Shield,
      title: "Tu historia debe ser original",
      description: "100% escrita por ti, sin IA ni contenido copiado",
      type: "warning",
    },
    {
      icon: Star,
      title: "100-1,000 palabras",
      description: "Respeta los límites de extensión",
      type: "info",
    },
    {
      icon: Heart,
      title: "Vota por otras historias",
      description: "Lee y da likes para fortalecer la comunidad",
      type: "success",
    },
    {
      icon: Clock,
      title: contest?.submission_deadline
        ? `Cierra: ${new Date(contest.submission_deadline).toLocaleDateString(
            "es-ES"
          )}`
        : "Cierre: fecha no disponible",
      description: "Envía tu historia antes de la fecha límite",
      type: "info",
    },
  ];

  const getIconColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-red-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                Reglas Esenciales
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {contest.month} - "{contest.title}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Prompt */}
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Prompt:</h3>
            <p className="text-gray-700 italic text-sm">
              "{contest.description}"
            </p>
          </div>

          {/* Essential Rules Grid */}
          <div className="grid grid-cols-1 gap-3">
            {essentialRules.map((rule, index) => {
              const Icon = rule.icon;
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${getBgColor(rule.type)}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${getIconColor(rule.type)}`} />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {rule.title}
                      </h4>
                      <p className="text-gray-600 text-xs mt-1">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Facts */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Datos rápidos:
            </h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Una historia por persona</li>
              <li>• Prohibido contenido ofensivo o sexual</li>
              <li>• Puedes marcar contenido maduro (18+)</li>
              <li>• Ganadores se determinan por likes</li>
              <li>• No puedes votar por tu propia historia</li>
            </ul>
          </div>

          {/* Legal Notice - Conciso */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2 text-sm flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Compromiso Legal
            </h4>
            <p className="text-red-800 text-xs">
              Al participar confirmas que tu historia es original, no usaste IA
              para escribirla, y aceptas nuestros términos de uso.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-col gap-3">
            <button onClick={onClose} className="btn-primary w-full">
              ¡Entendido, vamos a escribir!
            </button>

            <div className="flex justify-center gap-4 text-xs">
              <Link
                to="/terms"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Términos completos
              </Link>
              <Link
                to="/privacy"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Privacidad
              </Link>
              <Link
                to="/community-guidelines"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Guías de comunidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestRulesModal;
