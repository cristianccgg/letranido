import { useRef, useEffect, useCallback } from 'react';
import { useGoogleAnalytics, AnalyticsEvents } from './useGoogleAnalytics';

export const useWritingAnalytics = (contestId, isEditing = false) => {
  const { trackEvent, isAnalyticsEnabled } = useGoogleAnalytics();
  const startTimeRef = useRef(null);
  const lastWordCountRef = useRef(0);
  const wordCountMilestonesRef = useRef(new Set());
  const activeTimeRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);

  // Iniciar sesión de escritura
  const startWritingSession = useCallback(() => {
    if (!isAnalyticsEnabled) return;
    
    startTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    
    trackEvent(AnalyticsEvents.WRITING_STARTED, {
      contest_id: contestId,
      is_editing: isEditing,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent, isAnalyticsEnabled, contestId, isEditing]);

  // Tracking de tiempo activo (solo cuando está escribiendo)
  const trackActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Si han pasado menos de 30 segundos, consideramos que sigue activo
    if (timeSinceLastActivity < 30000) {
      activeTimeRef.current += timeSinceLastActivity;
    }
    
    lastActivityRef.current = now;
    isActiveRef.current = true;
  }, []);

  // Tracking de progreso por palabras
  const trackWordCount = useCallback((currentWordCount, title) => {
    if (!isAnalyticsEnabled) return;
    
    trackActivity(); // Marcar actividad
    
    const previousCount = lastWordCountRef.current;
    lastWordCountRef.current = currentWordCount;
    
    // Milestones importantes (50, 100, 250, 500, 750, 1000)
    const milestones = [50, 100, 250, 500, 750, 1000];
    
    for (const milestone of milestones) {
      if (currentWordCount >= milestone && 
          previousCount < milestone && 
          !wordCountMilestonesRef.current.has(milestone)) {
        
        wordCountMilestonesRef.current.add(milestone);
        
        trackEvent(AnalyticsEvents.STORY_WORD_COUNT_MILESTONE, {
          contest_id: contestId,
          word_count: currentWordCount,
          milestone_reached: milestone,
          has_title: title?.trim().length > 0,
          is_editing: isEditing,
          active_writing_time: Math.floor(activeTimeRef.current / 1000), // segundos
        });
      }
    }
  }, [trackEvent, isAnalyticsEnabled, contestId, isEditing, trackActivity]);

  // Tracking de borrador guardado
  const trackDraftSaved = useCallback((wordCount, title) => {
    if (!isAnalyticsEnabled) return;
    
    trackEvent(AnalyticsEvents.STORY_DRAFT_SAVED, {
      contest_id: contestId,
      word_count: wordCount,
      has_title: title?.trim().length > 0,
      is_editing: isEditing,
      session_duration: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0,
    });
  }, [trackEvent, isAnalyticsEnabled, contestId, isEditing]);

  // Finalizar sesión (abandono o envío exitoso)
  const endWritingSession = useCallback((reason = 'completed', finalWordCount = 0, finalTitle = '') => {
    if (!isAnalyticsEnabled || !startTimeRef.current) return;
    
    const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const activeWritingTime = Math.floor(activeTimeRef.current / 1000);
    
    const baseEventData = {
      contest_id: contestId,
      session_duration: totalDuration,
      active_writing_time: activeWritingTime,
      final_word_count: finalWordCount,
      has_title: finalTitle?.trim().length > 0,
      is_editing: isEditing,
      writing_efficiency: totalDuration > 0 ? (activeWritingTime / totalDuration) : 0,
    };

    if (reason === 'abandoned') {
      trackEvent(AnalyticsEvents.WRITING_ABANDONED, {
        ...baseEventData,
        abandon_reason: finalWordCount === 0 ? 'no_content' : 'incomplete',
      });
    } else if (reason === 'completed') {
      trackEvent(AnalyticsEvents.WRITING_TIME_SPENT, {
        ...baseEventData,
        completion_status: 'successful_submission',
      });
    }

    // Reset refs
    startTimeRef.current = null;
    activeTimeRef.current = 0;
    wordCountMilestonesRef.current.clear();
  }, [trackEvent, isAnalyticsEnabled, contestId, isEditing]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      if (startTimeRef.current) {
        endWritingSession('abandoned', lastWordCountRef.current);
      }
    };
  }, [endWritingSession]);

  // Track inactividad
  useEffect(() => {
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        isActiveRef.current = false;
      }, 30000); // 30 segundos de inactividad
    };

    const handleActivity = () => {
      if (!isActiveRef.current) {
        trackActivity();
      }
      resetInactivityTimer();
    };

    // Listeners para detectar actividad
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('scroll', handleActivity);

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, [trackActivity]);

  return {
    startWritingSession,
    trackWordCount,
    trackDraftSaved,
    endWritingSession,
    trackActivity,
  };
};