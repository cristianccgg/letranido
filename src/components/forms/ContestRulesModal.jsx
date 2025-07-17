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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ring-1 ring-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <Trophy className="h-6 w-6 mr-3" />
                Reglas Esenciales
              </h2>
              <p className="text-white/90 text-sm mt-2">
                {contest.month} - "{contest.title}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Prompt */}
          <div className="bg-gradient-to-br from-accent-50 to-primary-50 border border-accent-200 rounded-xl p-5">
            <h3 className="font-semibold text-accent-900 mb-3 flex items-center">
              <Star className="h-5 w-5 mr-2 text-accent-600" />
              Prompt del Concurso:
            </h3>
            <p className="text-accent-800 italic text-sm leading-relaxed">
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
                  className={`border rounded-xl p-4 ${getBgColor(rule.type)} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${getIconColor(rule.type)}`} />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
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
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5">
            <h4 className="font-semibold text-slate-900 mb-3 text-sm flex items-center">
              <Heart className="h-4 w-4 mr-2 text-slate-600" />
              Datos rápidos:
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                Una historia por persona
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                Prohibido contenido ofensivo o sexual
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                Puedes marcar contenido maduro (18+)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                Ganadores se determinan por likes
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                No puedes votar por tu propia historia
              </li>
            </ul>
          </div>

          {/* Legal Notice - Conciso */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
            <h4 className="font-semibold text-red-900 mb-3 text-sm flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Compromiso Legal
            </h4>
            <p className="text-red-800 text-xs leading-relaxed">
              Al participar confirmas que tu historia es original, no usaste IA
              para escribirla, y aceptas nuestros términos de uso.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-6 rounded-b-2xl">
          <div className="flex flex-col gap-4">
            <button 
              onClick={onClose} 
              className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl"
            >
              ¡Entendido, vamos a escribir!
            </button>

            <div className="flex justify-center gap-4 text-xs">
              <Link
                to="/terms"
                className="text-slate-600 hover:text-slate-800 flex items-center transition-colors"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Términos completos
              </Link>
              <Link
                to="/privacy"
                className="text-slate-600 hover:text-slate-800 flex items-center transition-colors"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Privacidad
              </Link>
              <Link
                to="/community-guidelines"
                className="text-slate-600 hover:text-slate-800 flex items-center transition-colors"
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
