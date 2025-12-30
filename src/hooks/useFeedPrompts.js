// hooks/useFeedPrompts.js - Hook para gestión de prompts del feed
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook personalizado para gestionar prompts del feed
 * @param {string} filter - Filtro: 'all', 'active', 'archived'
 * @returns {object} - { prompts, loading, error, refreshPrompts, activePrompt }
 */
const useFeedPrompts = (filter = 'all') => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('feed_prompts')
        .select('*')
        .order('start_date', { ascending: false });

      // Aplicar filtros
      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'archived') {
        query = query.eq('status', 'archived');
      } else {
        // 'all' - solo mostrar active y archived (no drafts para usuarios normales)
        query = query.in('status', ['active', 'archived']);
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

  // Encontrar prompt activo (el más reciente que esté en status 'active')
  const activePrompt = prompts.find(p => p.status === 'active');

  return {
    prompts,
    loading,
    error,
    refreshPrompts: loadPrompts,
    activePrompt,
  };
};

export default useFeedPrompts;
