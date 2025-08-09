import { useRef, useEffect, useCallback } from 'react';
import { useGoogleAnalytics, AnalyticsEvents } from './useGoogleAnalytics';

export const useReadingAnalytics = (storyId, storyTitle, wordCount, contestId) => {
  const { trackEvent, isAnalyticsEnabled } = useGoogleAnalytics();
  const startTimeRef = useRef(null);
  const scrollDepthRef = useRef(0);
  const maxScrollRef = useRef(0);
  const isReadingRef = useRef(false);
  const hasTrackedStartRef = useRef(false);

  // Calcular tiempo de lectura estimado
  const estimatedReadTime = Math.ceil(wordCount / 200) * 60; // segundos

  // Iniciar tracking de lectura
  const startReading = useCallback(() => {
    if (!isAnalyticsEnabled || hasTrackedStartRef.current) return;
    
    startTimeRef.current = Date.now();
    isReadingRef.current = true;
    hasTrackedStartRef.current = true;
    
    trackEvent(AnalyticsEvents.STORY_READ, {
      story_id: storyId,
      contest_id: contestId,
      story_title: storyTitle,
      word_count: wordCount,
      estimated_read_time: estimatedReadTime,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent, isAnalyticsEnabled, storyId, contestId, storyTitle, wordCount, estimatedReadTime]);

  // Tracking de scroll depth
  const trackScrollDepth = useCallback(() => {
    if (!isAnalyticsEnabled || !isReadingRef.current) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    const scrollDepth = Math.min(100, Math.round(((scrollTop + windowHeight) / documentHeight) * 100));
    
    if (scrollDepth > maxScrollRef.current) {
      maxScrollRef.current = scrollDepth;
      scrollDepthRef.current = scrollDepth;

      // Track milestones de scroll (25%, 50%, 75%, 90%, 100%)
      const milestones = [25, 50, 75, 90, 100];
      const currentMilestone = milestones.find(m => scrollDepth >= m && maxScrollRef.current < m);
      
      if (currentMilestone) {
        trackEvent(AnalyticsEvents.STORY_SCROLL_DEPTH, {
          story_id: storyId,
          contest_id: contestId,
          scroll_depth: scrollDepth,
          milestone: currentMilestone,
          time_to_milestone: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0,
        });
      }
    }
  }, [trackEvent, isAnalyticsEnabled, storyId, contestId]);

  // Finalizar lectura
  const endReading = useCallback((reason = 'natural') => {
    if (!isAnalyticsEnabled || !startTimeRef.current || !isReadingRef.current) return;
    
    const readingTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const readingProgress = maxScrollRef.current;
    const wasCompleted = readingProgress >= 90; // Consideramos "completa" si llegó al 90%

    // Determinar engagement quality basado en tiempo vs contenido
    const expectedMinTime = Math.min(wordCount / 10, 30); // mínimo 30 seg o 10 palabras/seg
    const isQualityRead = readingTime >= expectedMinTime;

    trackEvent(AnalyticsEvents.STORY_READ_TIME, {
      story_id: storyId,
      contest_id: contestId,
      reading_time: readingTime,
      scroll_depth: readingProgress,
      was_completed: wasCompleted,
      is_quality_read: isQualityRead,
      reading_speed: readingTime > 0 ? Math.round(wordCount / (readingTime / 60)) : 0, // palabras por minuto
      end_reason: reason, // 'natural', 'navigation', 'close'
    });

    if (wasCompleted) {
      trackEvent(AnalyticsEvents.STORY_READ_COMPLETE, {
        story_id: storyId,
        contest_id: contestId,
        total_reading_time: readingTime,
        reading_efficiency: estimatedReadTime > 0 ? (readingTime / estimatedReadTime) : 0,
      });
    }

    // Reset
    isReadingRef.current = false;
  }, [trackEvent, isAnalyticsEnabled, storyId, contestId, wordCount, estimatedReadTime]);

  // Setup scroll listener
  useEffect(() => {
    let scrollTimeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScrollDepth, 100); // Debounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [trackScrollDepth]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (isReadingRef.current) {
        endReading('navigation');
      }
    };
  }, [endReading]);

  // Auto-start cuando el componente se monta
  useEffect(() => {
    // Delay pequeño para asegurar que el contenido esté renderizado
    const timer = setTimeout(startReading, 1000);
    return () => clearTimeout(timer);
  }, [startReading]);

  return {
    startReading,
    endReading,
    trackScrollDepth,
    getCurrentScrollDepth: () => scrollDepthRef.current,
    isReading: () => isReadingRef.current,
  };
};