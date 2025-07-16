import { useState, useEffect } from "react";
import {
  ChevronRight,
  Calendar,
  Eye,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";

const NextContestPreview = ({ nextContest, currentContest }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // Solo mostrar si hay un siguiente concurso y hay un concurso actual activo
  useEffect(() => {
    setShouldShow(
      nextContest && currentContest && currentContest.status !== "results"
    );
  }, [nextContest, currentContest]);

  if (!shouldShow) return null;

  return (
    <div className="relative mt-6 ">
      {/* Contenedor principal con animación */}
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 border-2 border-purple-100 shadow-lg transition-all duration-700 ease-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-20 opacity-90"
        }`}
      >
        {/* Botón de expansión */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center cursor-pointer justify-between hover:bg-white/20 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            {/* Icono animado */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              {/* Pulso animado */}
              <div className="absolute inset-0 w-10 h-10 bg-purple-400 rounded-full animate-pulse opacity-20"></div>
            </div>

            {/* Texto principal */}
            <div className="text-left">
              <span className="text-sm font-medium text-purple-600 block">
                Próximo concurso
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                {nextContest.title}
              </span>
            </div>
          </div>

          {/* Flecha con animación */}
          <ChevronRight
            className={`h-5 w-5 text-purple-600 transition-transform duration-300 ${
              isExpanded ? "rotate-90" : "group-hover:translate-x-1"
            }`}
          />
        </button>

        {/* Contenido expandido */}
        <div
          className={`px-4 pb-4 transition-all duration-500 ${
            isExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
        >
          {/* Descripción del concurso */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">
              {nextContest.description}
            </p>
          </div>

          {/* Información del concurso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de inicio (basada en voting_deadline del actual + 1 día) */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>
                Inicia:{" "}
                {currentContest?.voting_deadline
                  ? (() => {
                      const nextDay = new Date(currentContest.voting_deadline);
                      nextDay.setDate(nextDay.getDate() + 1);
                      return nextDay.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                    })()
                  : "Por confirmar"}
              </span>
            </div>

            {/* Mes del concurso (calculado dinámicamente) */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>
                {currentContest?.voting_deadline
                  ? (() => {
                      const nextDay = new Date(currentContest.voting_deadline);
                      nextDay.setDate(nextDay.getDate() + 1);
                      const monthName = nextDay.toLocaleDateString("es-ES", {
                        month: "long",
                      });
                      const capitalizedMonth =
                        monthName.charAt(0).toUpperCase() + monthName.slice(1);
                      return `Concurso de ${capitalizedMonth}`;
                    })()
                  : `Concurso de ${nextContest.month}`}
              </span>
            </div>
          </div>

          {/* Información de preparación */}
          <div className="mt-4 space-y-3">
            {/* Requisitos del concurso */}
            {nextContest.word_limit && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Requisitos
                  </span>
                </div>
                <p className="text-sm text-purple-700">
                  Máximo {nextContest.word_limit} palabras
                </p>
              </div>
            )}

            {/* Consejos de preparación */}
            <div className="bg-gradient-to-r flex flex-col justify-center items-center from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
              <div className="flex justify-center items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium  text-purple-800">
                  Consejos para prepararte
                </span>
              </div>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Lee el prompt con atención</li>
                <li>• Planifica tu historia antes de escribir</li>
                <li>• Revisa la ortografía y gramática</li>
                <li>• ¡Deja volar tu creatividad!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Línea conectora sutil */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gradient-to-b from-purple-200 to-transparent"></div>
    </div>
  );
};

export default NextContestPreview;
