import React, { useState } from "react";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import ContestActionButton from "./ContestActionButton";
import { Link } from "react-router-dom";

const ContestCard = ({
  contest,
  phase,
  timeLeft,
  isNext = false,
  isEnabled = true, // ✅ Nuevo prop para habilitar/deshabilitar botones
  onRulesClick,
}) => {
  if (!contest) return null;

  // Estado para expansión (solo para siguiente concurso)
  const [isExpanded, setIsExpanded] = useState(false);

  // Determinar el tipo de botones según la fase
  const getButtons = () => {
    if (isNext) {
      // Concurso siguiente (siempre en fase submission)
      const buttonClass = isEnabled
        ? "inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300"
        : "inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-400 font-medium cursor-not-allowed";

      const primaryButtonClass = isEnabled
        ? "flex-1"
        : "flex-1 opacity-50 cursor-not-allowed";

      return (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ContestActionButton
            variant="primary"
            size="default"
            showDescription={false}
            className={`${isEnabled ? "" : "opacity-50 cursor-not-allowed"} flex-1`}
            contestId={contest.id}
            forcedPhase="submission" // ✅ Forzar fase submission para el próximo concurso
            disabled={!isEnabled}
          />

          <Link
            to={isEnabled ? `/contest/${contest.id}#stories-section` : "#"}
            className={`${buttonClass} flex-1`}
            onClick={!isEnabled ? (e) => e.preventDefault() : undefined}
          >
            Ver participantes
          </Link>

          <button
            onClick={isEnabled ? onRulesClick : undefined}
            className={`${buttonClass} flex-1`}
            disabled={!isEnabled}
          >
            Reglas
          </button>
        </div>
      );
    } else {
      // Concurso actual
      if (phase === "submission") {
        return (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <ContestActionButton
              variant="primary"
              size="default"
              showDescription={false}
              className="flex-1"
            />
            <Link
              to={`/contest/${contest.id}#stories-section`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 flex-1"
            >
              Ver participantes
            </Link>
            <button
              onClick={onRulesClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 flex-1"
            >
              Reglas
            </button>
          </div>
        );
      } else if (phase === "voting") {
        return (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/contest/${contest.id}#stories-section`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
            >
              Leer y Votar
            </Link>
            <Link
              to={`/contest/${contest.id}#stories-section`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 flex-1"
            >
              Ver historias
            </Link>
            <button
              onClick={onRulesClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 flex-1"
            >
              Reglas
            </button>
          </div>
        );
      } else {
        // Phase results
        return (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/contest/${contest.id}#stories-section`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
            >
              Ver Ganadores
            </Link>
            <button
              onClick={onRulesClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 flex-1"
            >
              Reglas
            </button>
          </div>
        );
      }
    }
  };

  // Determinar el color del badge según si es el siguiente concurso
  const badgeClass = isNext
    ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
    : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500";

  // Determinar el texto del badge
  const badgeText = isNext
    ? `${contest.month}`
    : `Concurso de ${contest.month}`;

  // Si es siguiente concurso, renderizar versión expandible
  if (isNext) {
    return (
      <div className="bg-white/95 backdrop-blur-md border-2 border-indigo-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-300 overflow-hidden">
        {/* Header siempre visible - clickeable para expandir/contraer */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all duration-300 group text-left cursor-pointer"
        >
          <div className="flex-1">
            {/* Título y badge en la misma línea */}
            <div className="flex items-center gap-4 mb-2">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 ${badgeClass}`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {badgeText}
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                {contest.title}
              </h2>
            </div>

            {/* Texto de invitación a expandir */}
            <p className="text-gray-500 text-sm italic">
              Haz clic para ver más detalles y participar
            </p>
          </div>

          {/* Indicador de expansión */}
          <div className="ml-4 flex-shrink-0">
            <ChevronDown
              className={`h-6 w-6 text-gray-400 group-hover:text-gray-600 transition-all duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Contenido expandible */}
        <div
          className={`transition-all duration-500 overflow-hidden ${
            isExpanded ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
          }`}
        >
          <div className="px-6 pb-6 space-y-6">
            {/* Descripción del concurso (solo visible cuando está expandida) */}
            <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 border border-purple-200 rounded-xl p-4">
              <p className="text-gray-700 md:text-lg leading-relaxed">
                {contest.description}
              </p>
            </div>

            {/* Contador para siguiente concurso cuando esté habilitado */}
            {timeLeft && isEnabled && (
              <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-xl p-4 inline-flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm md:text-base text-indigo-700 font-medium tracking-wide">
                      Envíos cierran en
                    </span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-indigo-900 tracking-tight">
                    {timeLeft}
                  </span>
                  <div className="text-xs text-red-600 font-medium mt-1 animate-pulse">
                    ¡No te quedes sin participar!
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje para concurso siguiente */}
            <div
              className={`rounded-xl p-4 ${
                isEnabled
                  ? "bg-gradient-to-r from-green-50 via-white to-emerald-50 border border-green-200"
                  : "bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                <span
                  className={`font-medium ${
                    isEnabled ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {isEnabled
                    ? `¡Ya puedes escribir tu historia para ${contest.month}!`
                    : `Próximo concurso: ${contest.month}. Se activará cuando empiece la votación actual.`}
                </span>
              </div>
            </div>

            {/* Botones dinámicos */}
            {getButtons()}
          </div>
        </div>
      </div>
    );
  }

  // Renderizado normal para concurso actual
  return (
    <div className="bg-white/95 backdrop-blur-md border-2 border-indigo-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-300">
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 ${badgeClass}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {badgeText}
        </span>
      </div>

      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
        {contest.title}
      </h2>

      <p className="text-gray-700 md:text-lg mb-6 leading-relaxed">
        {contest.description}
      </p>

      {/* Contador solo para concurso actual */}
      {timeLeft && (
        <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-xl p-4 inline-flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm md:text-base text-indigo-700 font-medium tracking-wide">
                {phase === "submission"
                  ? "Envíos cierran en"
                  : "Votación termina en"}
              </span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl md:text-2xl font-bold text-indigo-900 tracking-tight">
              {timeLeft}
            </span>
            <div className="text-xs text-red-600 font-medium mt-1 animate-pulse">
              {phase === "submission"
                ? "¡No te quedes sin participar!"
                : "¡Vota por tus favoritas!"}
            </div>
          </div>
        </div>
      )}

      {/* Botones dinámicos */}
      {getButtons()}
    </div>
  );
};

export default ContestCard;
