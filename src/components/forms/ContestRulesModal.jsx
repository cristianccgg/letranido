import {
  X,
  Trophy,
  Clock,
  Star,
  Heart,
  Shield,
} from "lucide-react";

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
        return "text-purple-600";
      case "warning":
        return "text-pink-600";
      case "info":
        return "text-indigo-600";
      default:
        return "text-gray-600";
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-purple-50 border-purple-200";
      case "warning":
        return "bg-pink-50 border-pink-200";
      case "info":
        return "bg-indigo-50 border-indigo-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Reglas del Concurso
                </h2>
                <p className="text-white/90 text-xs mt-1">
                  {contest.month} - "{contest.title}"
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Essential Rules Grid */}
            <div className="grid grid-cols-1 gap-2">
            {essentialRules.map((rule, index) => {
              const Icon = rule.icon;
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${getBgColor(rule.type)} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${getIconColor(rule.type)}`} />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-xs">
                        {rule.title}
                      </h4>
                      <p className="text-gray-600 text-xs">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Facts */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3">
            <h4 className="font-semibold text-slate-900 mb-2 text-xs flex items-center">
              <Heart className="h-3 w-3 mr-1 text-slate-600" />
              Datos importantes:
            </h4>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>• Una historia por persona</li>
              <li>• Sin contenido ofensivo o sexual</li>
              <li>• Ganadores por likes de la comunidad</li>
            </ul>
          </div>

          {/* Legal Notice - Conciso */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-semibold text-red-900 mb-1 text-xs flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Compromiso Legal
            </h4>
            <p className="text-red-800 text-xs">
              Historia 100% original, sin IA, aceptas términos de uso.
            </p>
          </div>
        </div>
      </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all text-sm"
          >
            ¡Entendido, vamos a escribir!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContestRulesModal;
