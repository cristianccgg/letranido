// components/voting/VoteCounter.jsx
import { useState, useEffect } from "react";
import { Heart, AlertTriangle } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";

const VoteCounter = ({ contestId, className = "" }) => {
  const { user, isAuthenticated, getUserVoteCount, currentContest, getContestPhase } = useGlobalApp();
  const [votesUsed, setVotesUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  // Solo mostrar para el concurso actual
  const isCurrentContest = contestId === currentContest?.id;
  const maxVotes = 3;

  // ✅ Determinar fase del concurso
  const contestPhase = currentContest ? getContestPhase(currentContest) : null;

  useEffect(() => {
    const loadVoteCount = async () => {
      if (!isAuthenticated || !user?.id || !isCurrentContest || !contestId) {
        setVotesUsed(0);
        return;
      }

      setLoading(true);
      try {
        const result = await getUserVoteCount(contestId);
        if (result.success) {
          setVotesUsed(result.count || 0);
        }
      } catch (error) {
        console.error("Error loading vote count:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVoteCount();

    // Escuchar eventos de voto para actualizar contador inmediatamente
    const handleVoteChange = () => {
      console.log("🔄 VoteCounter: Detectado cambio de voto, recargando...");
      loadVoteCount();
    };

    window.addEventListener('voteChanged', handleVoteChange);
    
    return () => {
      window.removeEventListener('voteChanged', handleVoteChange);
    };
  }, [isAuthenticated, user?.id, contestId, isCurrentContest, getUserVoteCount]);

  // ✅ Solo mostrar durante fase de VOTING
  // No mostrar si no es el concurso actual, si no está autenticado, o si NO está en voting
  if (!isAuthenticated || !isCurrentContest || contestPhase !== "voting") {
    return null;
  }

  const votesRemaining = Math.max(0, maxVotes - votesUsed);
  const isNearLimit = votesUsed >= 2;
  const isAtLimit = votesUsed >= maxVotes;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          isAtLimit
            ? "bg-red-100 text-red-700 border border-red-200"
            : isNearLimit
            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
            : "bg-blue-100 text-blue-700 border border-blue-200"
        }`}
      >
        {isAtLimit ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Heart className="h-4 w-4" />
        )}
        
        {loading ? (
          <span>...</span>
        ) : (
          <span>
            {votesRemaining > 0 
              ? `${votesRemaining} votos restantes`
              : "Sin votos disponibles"
            }
          </span>
        )}
      </div>

      {/* Indicadores visuales */}
      <div className="flex gap-1">
        {Array.from({ length: maxVotes }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < votesUsed
                ? "bg-red-500"
                : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VoteCounter;