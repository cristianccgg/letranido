// components/voting/VotingGuidance.jsx - Solo clases Tailwind puras
import { useState } from "react";
import { Heart, Users, Trophy, Info, X, CheckCircle } from "lucide-react";

const VotingGuidance = ({
  currentPhase,
  userVotesCount = 0,
  totalStories = 0,
  contestMonth = "este mes",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (currentPhase !== "voting") return null;

  return (
    <div className="mb-6 animate-slide-in-down">
      {/* Guidance Compacto */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-red-500 animate-pulse" />
              <h3 className="font-semibold text-gray-900">
                🗳️ Votación Activa - ¡Apoya a tus autores favoritos!
              </h3>
            </div>

            <div className="text-sm text-gray-700 mb-3">
              <strong>¿Cómo votar?</strong> Puedes votar por hasta 3 historias
              diferentes. ¡Usa tus votos sabiamente para apoyar a tus autores
              favoritos!
            </div>

            {/* Stats rápidas */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-1 text-green-600 animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">
                  Has votado por{" "}
                  <strong className="animate-pulse">{userVotesCount}</strong>{" "}
                  historia
                  {userVotesCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 animate-fade-in">
                <Users className="h-4 w-4" />
                <span>
                  <strong className="animate-pulse">{totalStories}</strong>{" "}
                  historias disponibles
                </span>
              </div>
              {userVotesCount > 0 && totalStories > 0 && (
                <div className="flex items-center gap-1 text-purple-600 animate-bounce">
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">
                    {Math.round((userVotesCount / totalStories) * 100)}% leídas
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 text-gray-500 hover:text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full hover:bg-gray-100 ${
                isExpanded ? "rotate-180 bg-gray-100" : ""
              }`}
              title="Más información"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded Info */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200 animate-slide-in-down">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="animate-fade-in">
                <h4 className="font-medium text-gray-900 mb-2">
                  ✅ Qué SÍ puedes hacer:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="hover:text-green-600 transition-colors">
                    • Votar por hasta 3 historias diferentes
                  </li>
                  <li className="hover:text-green-600 transition-colors">
                    • Cambiar tu voto (quitar/poner voto)
                  </li>
                  <li className="hover:text-green-600 transition-colors">
                    • Leer todas las que quieras
                  </li>
                  <li className="hover:text-green-600 transition-colors">
                    • Votar hasta el último día
                  </li>
                </ul>
              </div>

              <div className="animate-fade-in delay-100">
                <h4 className="font-medium text-gray-900 mb-2">
                  ❌ Qué NO puedes hacer:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="hover:text-red-600 transition-colors">
                    • Votar por tu propia historia
                  </li>
                  <li className="hover:text-red-600 transition-colors">
                    • Votar múltiples veces por la misma historia
                  </li>
                  <li className="hover:text-red-600 transition-colors">
                    • Votar después del cierre
                  </li>
                  <li className="hover:text-red-600 transition-colors">
                    • Ver los votos de otros hasta el final
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-yellow-200 animate-fade-in delay-200">
              <div className="flex items-start gap-2">
                <Trophy className="h-4 w-4 text-yellow-600 mt-0.5 animate-bounce" />
                <div className="text-sm">
                  <strong className="text-yellow-800">
                    ¿Cómo se decide el ganador?
                  </strong>
                  <p className="text-gray-700 mt-1">
                    Las historias se ordenan por número de votos recibidos. En
                    caso de empate, gana quien alcanzó esa cantidad primero. ¡Tu
                    voto cuenta!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Motivational Messages */}
      {userVotesCount === 0 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 animate-slide-in-up shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg animate-wave">👋</span>
            <div className="text-sm">
              <span className="font-medium text-yellow-800">
                ¡Empieza a votar!
              </span>
              <span className="text-yellow-700 ml-1">
                Lee las historias de {contestMonth} y apoya a tus favoritas.
              </span>
            </div>
          </div>
        </div>
      )}

      {userVotesCount > 0 && userVotesCount < totalStories && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 animate-slide-in-up shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg animate-bounce">🚀</span>
            <div className="text-sm">
              <span className="font-medium text-green-800">¡Buen trabajo!</span>
              <span className="text-green-700 ml-1">
                Quedan{" "}
                <strong className="animate-pulse">
                  {totalStories - userVotesCount}
                </strong>{" "}
                historias por descubrir.
              </span>
            </div>
          </div>
        </div>
      )}

      {userVotesCount > 0 && userVotesCount === totalStories && (
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 animate-slide-in-up shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg animate-spin">🎉</span>
            <div className="text-sm">
              <span className="font-medium text-purple-800">¡Increíble!</span>
              <span className="text-purple-700 ml-1">
                Has leído y evaluado todas las historias de {contestMonth}.
                ¡Eres un verdadero amante de la literatura!
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// El componente solo recibe props y no interactúa con el contexto directamente.
export default VotingGuidance;
