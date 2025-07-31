// hooks/useWinnerCelebration.js - Hook para manejar celebraciones de ganadores
import { useState, useEffect } from 'react';
import { useGlobalApp } from '../contexts/GlobalAppContext';

export const useWinnerCelebration = () => {
  const { user, isAuthenticated, galleryStories, currentContest, getContestPhase } = useGlobalApp();
  const [celebration, setCelebration] = useState({
    show: false,
    position: null,
    storyTitle: null,
    contestTitle: null
  });

  // Clave para localStorage - evitar mostrar la misma celebración múltiples veces
  const getCelebrationKey = (contestId, userId, position) => {
    return `celebration_shown_${contestId}_${userId}_${position}`;
  };

  const checkForWinnerStatus = () => {
    if (!isAuthenticated || !user?.id || !currentContest || !galleryStories.length) {
      return;
    }

    const contestPhase = getContestPhase(currentContest);
    
    // Solo mostrar celebración en fase de resultados
    if (contestPhase !== 'results') {
      return;
    }

    // Filtrar historias del usuario en el concurso actual
    const userStoriesInContest = galleryStories.filter(story => 
      story.user_id === user.id && story.contest_id === currentContest.id
    );

    if (userStoriesInContest.length === 0) {
      return;
    }

    // Ordenar historias por votos (igual que en CurrentContest.jsx)
    const sortedStories = [...galleryStories]
      .filter(story => story.contest_id === currentContest.id)
      .sort((a, b) => b.likes_count - a.likes_count);

    // Buscar si alguna de las historias del usuario está en top 3
    userStoriesInContest.forEach(userStory => {
      const position = sortedStories.findIndex(story => story.id === userStory.id) + 1;
      
      // Solo celebrar si está en top 3
      if (position <= 3) {
        const celebrationKey = getCelebrationKey(currentContest.id, user.id, position);
        
        // Verificar si ya se mostró esta celebración
        if (!localStorage.getItem(celebrationKey)) {
          setCelebration({
            show: true,
            position,
            storyTitle: userStory.title,
            contestTitle: currentContest.title
          });
          
          // Marcar como mostrada
          localStorage.setItem(celebrationKey, 'true');
          
          // También crear una notificación si no existe
          createWinnerNotification(position, userStory.title, currentContest.title);
          
          // Solo mostrar una celebración por vez
          return;
        }
      }
    });
  };

  const createWinnerNotification = async (position, storyTitle, contestTitle) => {
    try {
      // Intentar crear la notificación usando el hook de notificaciones
      const { createNotification } = await import('./useNotifications');
      
      const positionText = position === 1 ? '1er lugar' : position === 2 ? '2do lugar' : '3er lugar';
      const emoji = position === 1 ? '🏆' : position === 2 ? '🥈' : '🥉';
      
      if (createNotification) {
        await createNotification(
          'contest_winner',
          `${emoji} ¡${positionText} en el concurso!`,
          `Tu historia "${storyTitle}" quedó en ${positionText} en "${contestTitle}"`,
          {
            contest_id: currentContest?.id,
            story_title: storyTitle,
            position: position,
            contest_title: contestTitle
          }
        );
      }
    } catch (error) {
      console.warn('No se pudo crear la notificación de ganador:', error);
    }
  };

  const closeCelebration = () => {
    setCelebration(prev => ({
      ...prev,
      show: false
    }));
  };

  // Limpiar celebraciones antiguas (más de 30 días)
  const cleanupOldCelebrations = () => {
    const keys = Object.keys(localStorage);
    const celebrationKeys = keys.filter(key => key.startsWith('celebration_shown_'));
    
    celebrationKeys.forEach(key => {
      // Podrías implementar lógica de limpieza por fecha aquí
      // Por ahora mantenemos todas las celebraciones para evitar duplicados
    });
  };

  useEffect(() => {
    checkForWinnerStatus();
    cleanupOldCelebrations();
  }, [isAuthenticated, user?.id, galleryStories, currentContest]);

  return {
    celebration,
    closeCelebration,
    checkForWinnerStatus
  };
};

export default useWinnerCelebration;