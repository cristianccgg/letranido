import { useState, useEffect, useCallback } from 'react';

export const useDraftManager = (contestId) => {
  const [isLoading, setIsLoading] = useState(false);

  // Función para guardar borrador
  const saveDraft = useCallback((title, text) => {
    if (!contestId || (!title.trim() && !text.trim())) return;
    
    try {
      const saveData = { title, text };
      localStorage.setItem(`story-draft-${contestId}`, JSON.stringify(saveData));
    } catch (error) {
      console.error('Error guardando borrador:', error);
    }
  }, [contestId]);

  // Función para cargar borrador
  const loadDraft = useCallback(() => {
    if (!contestId) return { title: '', text: '' };

    try {
      setIsLoading(true);
      
      // Cargar borrador normal
      const savedDraft = localStorage.getItem(`story-draft-${contestId}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setIsLoading(false);
        return {
          title: parsed.title || '',
          text: parsed.text || ''
        };
      }

      // Verificar borrador temporal (después de registro)
      const tempDraft = localStorage.getItem(`story-draft-temp-${contestId}`);
      if (tempDraft) {
        const parsed = JSON.parse(tempDraft);
        
        // Mover a borrador normal y limpiar temporal
        localStorage.setItem(`story-draft-${contestId}`, tempDraft);
        localStorage.removeItem(`story-draft-temp-${contestId}`);
        
        setIsLoading(false);
        return {
          title: parsed.title || '',
          text: parsed.text || ''
        };
      }

      setIsLoading(false);
      return { title: '', text: '' };
    } catch (error) {
      console.error('Error cargando borrador:', error);
      setIsLoading(false);
      return { title: '', text: '' };
    }
  }, [contestId]);

  // Función para guardar borrador temporal (antes de auth)
  const saveTempDraft = useCallback((title, text) => {
    if (!contestId || (!title.trim() && !text.trim())) return;
    
    try {
      const tempDraft = { title, text };
      localStorage.setItem(`story-draft-temp-${contestId}`, JSON.stringify(tempDraft));
    } catch (error) {
      console.error('Error guardando borrador temporal:', error);
    }
  }, [contestId]);

  // Función para limpiar borrador
  const clearDraft = useCallback(() => {
    if (!contestId) return;
    
    try {
      localStorage.removeItem(`story-draft-${contestId}`);
      localStorage.removeItem(`story-draft-temp-${contestId}`);
    } catch (error) {
      console.error('Error limpiando borrador:', error);
    }
  }, [contestId]);

  return {
    saveDraft,
    loadDraft,
    saveTempDraft,
    clearDraft,
    isLoading
  };
};