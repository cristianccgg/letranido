// hooks/useFeedPrompts.js - Hook para gestión de prompts del feed
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook personalizado para gestionar prompts del feed
 * @param {string} filter - Filtro: 'all', 'active', 'archived'
 * @returns {object} - { prompts, loading, error, refreshPrompts, activePrompt, nextPrompt }
 */
const useFeedPrompts = (filter = 'all') => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Auto-gestionar prompts (archivar expirados, activar programados)
      await supabase.rpc('auto_manage_feed_prompts');

      let query = supabase
        .from('feed_prompts')
        .select('*')
        .order('start_date', { ascending: false });

      // Aplicar filtros
      if (filter === 'active') {
        // Incluir drafts para poder derivar nextPrompt
        query = query.in('status', ['active', 'draft']);
      } else if (filter === 'archived') {
        query = query.eq('status', 'archived');
      } else {
        // 'all' - active, archived y drafts próximos (RLS filtra drafts lejanos)
        query = query.in('status', ['active', 'archived', 'draft']);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPrompts(data || []);
    } catch (err) {
      console.error('Error loading feed prompts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Prompt activo (el que está en status 'active')
  const activePrompt = prompts.find(p => p.status === 'active');

  // Siguiente prompt: primer draft con start_date futuro
  const nextPrompt = useMemo(() => {
    const now = new Date();
    return prompts
      .filter(p => p.status === 'draft' && new Date(p.start_date) > now)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] || null;
  }, [prompts]);

  return {
    prompts,
    loading,
    error,
    refreshPrompts: loadPrompts,
    activePrompt,
    nextPrompt,
  };
};

export default useFeedPrompts;
