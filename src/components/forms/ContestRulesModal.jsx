import { X, Trophy, Clock, Star, Heart, Shield, ExternalLink } from "lucide-react";

const ContestRulesModal = ({ isOpen, onClose, contest }) => {
  if (!isOpen) return null;

  const essentialRules = [
    {
      icon: Shield,
      title: "Historia 100% original",
      description: "Escrita por ti, sin plagio. Tu responsabilidad garantizarlo",
      type: "warning",
    },
    {
      icon: Star,
      title: contest?.word_limit 
        ? `Máximo ${contest.word_limit.toLocaleString()} palabras`
        : "100-1,000 palabras",
      description: "Respeta el límite exacto del concurso",
      type: "info",
    },
    {
      icon: Heart,
      title: "3 votos para otorgar",
      description: "Vota por tus favoritas durante la fase de votación",
      type: "success",
    },
    {
      icon: Clock,
      title: contest?.submission_deadline
        ? `Envíos hasta: ${new Date(contest.submission_deadline).toLocaleDateString(
            "es-ES",
            {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Bogota",
            }
          )}`
        : "Fecha límite por confirmar",
      description: "Después comienza la votación comunitaria",
      type: "info",
    },
  ];

  const getIconColor = (type) => {
    switch (type) {
      case "success":
        return "text-purple-600 dark:text-purple-300";
      case "warning":
        return "text-pink-600 dark:text-pink-300";
      case "info":
        return "text-indigo-600 dark:text-indigo-300";
      default:
        return "text-gray-600 dark:text-gray-300";
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-purple-50 border-purple-200 dark:bg-purple-900 dark:border-purple-700";
      case "warning":
        return "bg-pink-50 border-pink-200 dark:bg-pink-900 dark:border-pink-700";
      case "info":
        return "bg-indigo-50 border-indigo-200 dark:bg-indigo-900 dark:border-indigo-700";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Header */}
          <div className="bg-gradient-to-r dark:from-indigo-900 dark:to-purple-900 from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center dark:text-purple-300">
                  <Trophy className="h-5 w-5 mr-2" />
                  Reglas del Concurso
                </h2>
                <p className="text-white/90 dark:text-purple-300 text-xs mt-1">
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
                        <h4 className="font-semibold text-gray-900 dark:text-gray-300 text-xs">
                          {rule.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Facts */}
            <div className="bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 from-slate-50 to-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <h4 className="font-semibold text-slate-900 dark:text-slate-300 mb-2 text-xs flex items-center">
                <Heart className="h-3 w-3 mr-1 text-slate-600 dark:text-slate-300" />
                Reglas adicionales:
              </h4>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <li>• Una historia por concurso</li>
                <li>• Sin contenido sexual explícito o violencia extrema</li>
                <li>• Top 3 gana badges automáticamente</li>
                <li>• No puedes votar por tu propia historia</li>
              </ul>
            </div>

            {/* Legal Notice - Conciso */}
            <div className="bg-gradient-to-br dark:from-red-900 dark:to-red-800 from-red-50 to-pink-50 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1 text-xs flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Compromiso Legal
                  </h4>
                  <p className="text-red-800 dark:text-red-300 text-xs">
                    Historia 100% original, aceptas términos de uso.
                  </p>
                </div>
                <a 
                  href="/como-funciona" 
                  target="_blank"
                  className="ml-2 p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                  title="Ver guía completa"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t dark:bg-slate-800  dark:border-slate-700 border-slate-200 bg-slate-50 p-4 rounded-b-2xl">
          <div className="text-center mb-2">
            <a 
              href="/como-funciona" 
              target="_blank"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Ver proceso completo
            </a>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r cursor-pointer dark:from-indigo-900 dark:to-indigo-700 from-indigo-600 to-purple-600 text-white dark:text-primary-200 py-2 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all text-sm"
          >
            ¡Perfecto, a escribir!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContestRulesModal;
