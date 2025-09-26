import { useState, useEffect } from "react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import NextContestPreview from "./NextContestPreview";
import PollPreview from "./PollPreview";
import { getUserVoteForPoll, submitPollVote } from "../../lib/supabase-polls";
import { supabase } from "../../lib/supabase";

const NextContestOrPoll = ({ nextContest, currentContest, isEnabled = false }) => {
  const { user, initialized } = useGlobalApp();
  
  // Estados para la encuesta
  const [activePoll, setActivePoll] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [pollError, setPollError] = useState(null);

  // Cargar encuesta activa al montar el componente
  useEffect(() => {
    loadActivePoll();
  }, [initialized]);

  // Cargar voto del usuario cuando cambie la encuesta o el usuario
  useEffect(() => {
    if (activePoll && user?.id) {
      loadUserVote();
    } else {
      setUserVote(null);
    }
  }, [activePoll?.id, user?.id]);

  const loadActivePoll = async () => {
    try {
      setPollLoading(true);
      setPollError(null);
      
      // Buscar concursos en estado 'poll' (con encuesta activa)
      const { data: contestsWithPolls, error: contestError } = await supabase
        .from('contests')
        .select('id, title, month, status, poll_deadline, poll_enabled')
        .eq('status', 'poll')
        .gt('poll_deadline', new Date().toISOString())
        .order('poll_deadline', { ascending: true })
        .limit(1);

      if (contestError) {
        throw new Error(contestError.message);
      }

      if (contestsWithPolls && contestsWithPolls.length > 0) {
        const contestWithPoll = contestsWithPolls[0];
        
        // Obtener la encuesta asociada al concurso
        const { data: pollData, error: pollError } = await supabase
          .rpc('get_contest_active_poll', { contest_id: contestWithPoll.id });

        if (pollError) {
          throw new Error(pollError.message);
        }

        if (pollData && pollData.length > 0) {
          const pollInfo = pollData[0];
          // Parsear opciones JSON
          const options = pollInfo.options || [];
          
          setActivePoll({
            ...pollInfo,
            contest_id: contestWithPoll.id,
            contest_title: contestWithPoll.title,
            contest_month: contestWithPoll.month,
            options: options
          });
        } else {
          setActivePoll(null);
        }
      } else {
        setActivePoll(null);
      }
    } catch (error) {
      console.error('Error cargando encuesta activa:', error);
      setPollError(error.message);
    } finally {
      setPollLoading(false);
    }
  };

  const loadUserVote = async () => {
    if (!activePoll?.id || !user?.id) return;
    
    try {
      const vote = await getUserVoteForPoll(activePoll.id, user.id);
      setUserVote(vote);
    } catch (error) {
      console.error('Error cargando voto del usuario:', error);
    }
  };

  const handleVote = async (optionId) => {
    if (!activePoll?.id || !user?.id) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const result = await submitPollVote(activePoll.id, optionId, user.id);
      
      if (result.success) {
        // Actualizar voto local
        setUserVote({ 
          option_id: optionId, 
          created_at: new Date().toISOString() 
        });
        
        // Recargar encuesta para actualizar contadores
        await loadActivePoll();
      }
      
      return result;
    } catch (error) {
      console.error('Error enviando voto:', error);
      return { success: false, error: error.message };
    }
  };

  // Mostrar loading mientras se cargan datos iniciales
  if (pollLoading && initialized) {
    return (
      <div className="relative mt-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 border-2 border-purple-100 shadow-lg p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Si hay error cargando la encuesta, no renderizar nada
  // (el NextContest ya se muestra como ContestCard en LandingPage)
  if (pollError) {
    console.warn('Error en poll, no renderizando duplicado NextContest:', pollError);
    return null;
  }

  // Si hay encuesta activa, mostrar PollPreview
  if (activePoll && activePoll.status === 'active') {
    return (
      <div data-poll-section>
        <PollPreview
          poll={activePoll}
          onVote={handleVote}
          userVote={userVote}
          isAuthenticated={!!user}
          isLoading={pollLoading}
        />
      </div>
    );
  }

  // Si no hay encuesta activa, no renderizar nada 
  // (el NextContest ya se muestra como ContestCard en LandingPage)
  return null;
};

export default NextContestOrPoll;