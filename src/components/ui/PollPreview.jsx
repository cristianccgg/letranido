import { useState, useEffect } from "react";
import {
  ChevronRight,
  Calendar,
  Clock,
  Vote,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
  BookOpen,
  Sparkles,
} from "lucide-react";

const PollPreview = ({ 
  poll, 
  onVote, 
  userVote, 
  isAuthenticated
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState(userVote?.option_id || null);
  const [votingStatus, setVotingStatus] = useState("idle"); // idle, loading, success, error
  const [statusMessage, setStatusMessage] = useState("");

  // Inicializar opción seleccionada cuando cambie userVote
  useEffect(() => {
    setSelectedOption(userVote?.option_id || null);
  }, [userVote]);

  // Calcular tiempo restante
  const getTimeRemaining = () => {
    if (!poll?.voting_deadline) return null;
    
    const now = new Date();
    const deadline = new Date(poll.voting_deadline);
    const diff = deadline - now;
    
    if (diff <= 0) return "Votación cerrada";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''} restante${hours !== 1 ? 's' : ''}`;
    } else {
      return "Menos de 1 hora";
    }
  };

  // Manejar votación
  const handleVote = async () => {
    if (!selectedOption) return;
    
    // Si no está autenticado, mostrar mensaje pidiendo login
    if (!isAuthenticated) {
      setVotingStatus("error");
      setStatusMessage("Inicia sesión para votar");
      
      setTimeout(() => {
        setVotingStatus("idle");
        setStatusMessage("");
      }, 4000);
      return;
    }
    
    if (!onVote) return;
    
    setVotingStatus("loading");
    
    try {
      const result = await onVote(selectedOption);
      
      if (result.success) {
        setVotingStatus("success");
        setStatusMessage(
          result.action === 'updated' 
            ? "¡Voto actualizado correctamente!" 
            : "¡Gracias por votar!"
        );
        setShowResults(true); // Mostrar resultados inmediatamente después de votar
        
        // Reset estado de botón después de 3 segundos, mantener resultados
        setTimeout(() => {
          setVotingStatus("idle");
          setStatusMessage("");
        }, 3000);
      } else {
        setVotingStatus("error");
        setStatusMessage(result.error || "Error al votar");
        
        setTimeout(() => {
          setVotingStatus("idle");
          setStatusMessage("");
        }, 4000);
      }
    } catch (error) {
      setVotingStatus("error");
      setStatusMessage("Error inesperado al votar");
      
      setTimeout(() => {
        setVotingStatus("idle");
        setStatusMessage("");
      }, 4000);
    }
  };

  if (!poll) return null;

  const timeRemaining = getTimeRemaining();
  const isVotingClosed = poll.status !== 'active' || timeRemaining === "Votación cerrada";
  const hasUserVoted = userVote && userVote.option_id;
  const shouldShowResults = (hasUserVoted && !isVotingClosed) || showResults;

  return (
    <div className="relative mt-6">
      {/* Contenedor principal con animación */}
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 border-2 border-purple-100 shadow-lg transition-all duration-700 ease-out ${
          isExpanded ? "max-h-[48rem] opacity-100" : "max-h-20 opacity-90"
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
                <Vote className="h-5 w-5 text-white" />
              </div>
              {/* Pulso animado */}
              <div className="absolute inset-0 w-10 h-10 bg-purple-400 rounded-full animate-pulse opacity-20"></div>
            </div>

            {/* Texto principal */}
            <div className="text-left">
              <span className="text-sm font-medium text-purple-600 block">
                Vota por el prompt
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                Reto de Noviembre
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
          {/* Descripción de la encuesta */}
          {poll.description && (
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed text-sm">
                {poll.description}
              </p>
            </div>
          )}

          {/* Información de la encuesta - Compacta */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4 bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>{poll.total_votes || 0} voto{poll.total_votes !== 1 ? 's' : ''}</span>
            </div>
          </div>


          {/* Opciones de votación */}
          {poll.options && poll.options.length > 0 && (
            <div className="space-y-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                Elige el prompt que más te guste:
              </h4>
              
              <div className="space-y-2">
                {poll.options.map((option) => (
                  <div
                    key={option.id}
                    className={`border-2 rounded-lg p-2 transition-all duration-300 cursor-pointer ${
                      selectedOption === option.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25"
                    } ${
                      isVotingClosed
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() => {
                      if (!isVotingClosed) {
                        setSelectedOption(option.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio button personalizado */}
                      <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                        selectedOption === option.id
                          ? "border-purple-500 bg-purple-500"
                          : "border-gray-300 bg-white"
                      }`}>
                        {selectedOption === option.id && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>

                      {/* Contenido de la opción */}
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1 text-sm">
                          {option.option_title}
                        </h5>
                        
                        <div className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded border-l-2 border-purple-300 line-clamp-2 leading-tight">
                          {option.option_text}
                        </div>

                        {/* Mostrar resultados solo después de votar (mientras votación activa) */}
                        {shouldShowResults && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>{option.vote_count || 0} voto{option.vote_count !== 1 ? 's' : ''}</span>
                              <span>{poll.total_votes > 0 ? Math.round(((option.vote_count || 0) / poll.total_votes) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  selectedOption === option.id ? 'bg-purple-500' : 'bg-gray-400'
                                }`}
                                style={{
                                  width: `${poll.total_votes > 0 ? Math.round(((option.vote_count || 0) / poll.total_votes) * 100) : 0}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de la votación - Más compacto */}
          <div className={`rounded-lg p-2 mb-2 text-center text-sm ${
            isVotingClosed 
              ? "bg-gray-50 border border-gray-200 text-gray-600"
              : hasUserVoted
                ? "bg-purple-50 border border-purple-200 text-purple-700"
                : "bg-indigo-50 border border-indigo-200 text-indigo-700"
          }`}>
            {isVotingClosed 
              ? "Votación cerrada. El reto se creará con el prompt ganador."
              : hasUserVoted
                ? "¡Ya votaste! Puedes cambiar tu voto."
                : ""  
            }
          </div>

          {/* Botón de votación - Más prominente */}
          {!isVotingClosed && (
            <div className="mb-2">
              <button
                onClick={handleVote}
                disabled={!selectedOption || votingStatus === "loading" || votingStatus === "success"}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-base"
              >
                {votingStatus === "loading" ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    {hasUserVoted ? "Actualizando..." : "Votando..."}
                  </>
                ) : votingStatus === "success" ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    ¡Votado!
                  </>
                ) : (
                  <>
                    <Vote className="h-5 w-5" />
                    {isAuthenticated 
                      ? (hasUserVoted ? "Cambiar voto" : "¡Votar ahora!")
                      : "¡Votar ahora!"
                    }
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mensaje de estado - Más compacto */}
          {statusMessage && (
            <div
              className={`p-2 rounded-lg text-center text-sm mb-2 ${
                votingStatus === "success"
                  ? "bg-purple-50 border border-purple-200 text-purple-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {votingStatus === "success" ? (
                <CheckCircle className="h-4 w-4 inline mr-1" />
              ) : (
                <AlertCircle className="h-4 w-4 inline mr-1" />
              )}
              {statusMessage}
            </div>
          )}

          {/* Información adicional - Más compacta */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-900">
                El prompt más votado será el tema del reto
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Línea conectora sutil */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gradient-to-b from-purple-200 to-transparent"></div>
    </div>
  );
};

export default PollPreview;