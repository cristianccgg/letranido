import {
  X,
  Trophy,
  Clock,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  Heart,
  MessageSquare,
} from "lucide-react";

const ContestRulesModal = ({ isOpen, onClose, contest }) => {
  if (!isOpen) return null;

  const rules = [
    {
      icon: Clock,
      title: "Duración del concurso",
      description: `El concurso de ${
        contest.month
      } cierra el ${contest.endDate.toLocaleDateString(
        "es-ES"
      )} a las 23:59 hora local.`,
      type: "info",
    },
    {
      icon: Users,
      title: "Elegibilidad",
      description:
        "Cualquier persona puede participar y votar. Solo necesitas registrarte con un email válido.",
      type: "info",
    },
    {
      icon: Star,
      title: "Límites de texto",
      description:
        "Tu historia debe tener entre 100 y 1,000 palabras. Sin excepciones.",
      type: "warning",
    },
    {
      icon: Heart,
      title: "Sistema de votación",
      description: `✅ Todos los usuarios registrados pueden votar
❤️ Un like por historia por usuario
🚫 No puedes votar por tu propia historia
⏰ Votación abierta durante todo el concurso`,
      type: "success",
    },
    {
      icon: Trophy,
      title: "Premios y ganadores",
      description: `🥇 1er lugar: Historia con más likes + ${contest.prize}
🥈 2do lugar: Segunda más votada + Insignia de Plata
🥉 3er lugar: Tercera más votada + Insignia de Bronce
🎖️ Mención especial: Historias destacadas por originalidad`,
      type: "success",
    },
  ];

  const guidelines = [
    "Una sola participación por persona por concurso",
    "El texto debe ser original y de tu autoría",
    "Prohibido contenido ofensivo, violento o inapropiado",
    "Respeta el prompt - interpretaciones creativas son bienvenidas",
    "Lee y vota por otras historias para fortalecer la comunidad",
    "Puedes votar hasta el último día del concurso",
    "Los resultados se publican automáticamente al cierre",
  ];

  const getIconColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
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
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
                Reglas del Concurso
              </h2>
              <p className="text-gray-600 mt-1">
                {contest.month} - "{contest.title}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contest Info */}
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Prompt del concurso:
            </h3>
            <p className="text-gray-700 italic">"{contest.description}"</p>
          </div>

          {/* Voting System Explanation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              ¿Cómo funciona la votación?
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-600">1.</span>
                <span>Escribe tu historia y envíala al concurso</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-600">2.</span>
                <span>
                  Lee las historias de otros participantes en la galería
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-600">3.</span>
                <span>
                  Da likes a las historias que más te gusten (¡cuantas quieras!)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-600">4.</span>
                <span>
                  Los ganadores se determinan por la cantidad de likes recibidos
                </span>
              </div>
            </div>
          </div>

          {/* Main Rules */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reglas principales
            </h3>
            <div className="space-y-4">
              {rules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getBgColor(rule.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(
                          rule.type
                        )}`}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {rule.title}
                        </h4>
                        <p className="text-gray-700 text-sm whitespace-pre-line">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pautas adicionales
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ul className="space-y-2">
                {guidelines.map((guideline, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    {guideline}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cronograma
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Inicio del concurso:</span>
                  <span className="font-medium">
                    1 de {contest.month.split(" ")[0]}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">
                    Cierre de participaciones:
                  </span>
                  <span className="font-medium">
                    {contest.endDate.toLocaleDateString("es-ES")} 23:59
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Cierre de votación:</span>
                  <span className="font-medium">
                    {contest.endDate.toLocaleDateString("es-ES")} 23:59
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Anuncio de ganadores:</span>
                  <span className="font-medium text-green-600">
                    Automático al cierre
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preguntas frecuentes
            </h3>
            <div className="space-y-3">
              <details className="bg-gray-50 border border-gray-200 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-100 rounded-lg">
                  ¿Puedo cambiar mi voto después de darlo?
                </summary>
                <div className="px-4 pb-4 text-gray-700 text-sm">
                  Sí, puedes quitar o cambiar tus likes en cualquier momento
                  durante el concurso.
                </div>
              </details>

              <details className="bg-gray-50 border border-gray-200 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-100 rounded-lg">
                  ¿Puedo votar por múltiples historias?
                </summary>
                <div className="px-4 pb-4 text-gray-700 text-sm">
                  ¡Por supuesto! Puedes dar like a todas las historias que te
                  gusten. No hay límite.
                </div>
              </details>

              <details className="bg-gray-50 border border-gray-200 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-100 rounded-lg">
                  ¿Qué pasa si hay empate en likes?
                </summary>
                <div className="px-4 pb-4 text-gray-700 text-sm">
                  En caso de empate, gana la historia que alcanzó esa cantidad
                  de likes primero (por timestamp).
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              ¿Tienes más preguntas?{" "}
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                Contáctanos
              </button>
            </p>
            <button onClick={onClose} className="btn-primary">
              ¡Entendido, vamos a escribir!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestRulesModal;
