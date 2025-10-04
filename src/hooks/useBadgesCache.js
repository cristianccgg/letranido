// hooks/useBadgesCache.js - Cache para badges de múltiples usuarios
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Cache global para evitar múltiples consultas del mismo usuario
const badgesCache = new Map();
const badgeDefinitionsCache = new Map();

// Hook optimizado para cargar badges de cualquier usuario
export const useBadgesCache = (userId) => {
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar badges del usuario con cache
  const loadUserBadges = useCallback(async () => {
    if (!userId) {
      setUserBadges([]);
      setLoading(false);
      return;
    }

    // Verificar cache primero
    if (badgesCache.has(userId)) {
      setUserBadges(badgesCache.get(userId));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Cargar definiciones de badges si no están en cache
      if (badgeDefinitionsCache.size === 0) {
        const { data: definitions, error: defError } = await supabase
          .from('badge_definitions')
          .select('*');
        
        if (defError) throw defError;
        
        // Guardar en cache
        definitions?.forEach(def => {
          badgeDefinitionsCache.set(def.id, def);
        });
      }

      // Cargar badges del usuario
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Combinar con definiciones y enriquecer metadata
      const transformedBadges = await Promise.all((data || []).map(async (userBadge) => {
        const definition = badgeDefinitionsCache.get(userBadge.badge_id);
        if (!definition) return null;
        
        let enhancedMetadata = { ...userBadge.metadata };
        
        // Si el badge tiene contest_id, obtener información del reto
        if (userBadge.metadata?.contest_id) {
          try {
            const { data: contestData, error: contestError } = await supabase
              .from('contests')
              .select('title, month')
              .eq('id', userBadge.metadata.contest_id)
              .single();
            
            if (!contestError && contestData) {
              enhancedMetadata = {
                ...enhancedMetadata,
                contest_title: contestData.title,
                contest_month: contestData.month
              };
              
              // Obtener posición específica si es badge de ganador/finalista
              if (['contest_winner', 'contest_finalist'].includes(userBadge.badge_id)) {
                const { data: storyData, error: storyError } = await supabase
                  .from('stories')
                  .select('winner_position')
                  .eq('user_id', userId)
                  .eq('contest_id', userBadge.metadata.contest_id)
                  .eq('is_winner', true)
                  .single();
                
                if (!storyError && storyData) {
                  enhancedMetadata.position = storyData.winner_position;
                }
              }
            }
          } catch (error) {
            console.warn('Error enriching badge metadata in cache:', error);
          }
        }
        
        return {
          ...definition,
          earned_at: userBadge.earned_at,
          metadata: enhancedMetadata
        };
      }));
      
      // Filtrar badges nulos
      const validBadges = transformedBadges.filter(Boolean);

      // Guardar en cache
      badgesCache.set(userId, validBadges);
      setUserBadges(validBadges);
      
    } catch (err) {
      console.error('Error loading user badges:', err);
      setError(err.message);
      setUserBadges([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserBadges();
  }, [loadUserBadges]);

  return {
    userBadges,
    loading,
    error
  };
};

// Hook para obtener badges rápidamente sin estado reactivo
export const getBadgesSync = (userId) => {
  return badgesCache.get(userId) || [];
};

// Función para precargar badges de múltiples usuarios
export const preloadUsersBadges = async (userIds) => {
  if (!userIds || userIds.length === 0) return;

  try {
    // Filtrar IDs que no están en cache
    const uncachedIds = userIds.filter(id => !badgesCache.has(id));
    
    if (uncachedIds.length === 0) return;

    // Cargar definiciones si no están en cache
    if (badgeDefinitionsCache.size === 0) {
      const { data: definitions, error: defError } = await supabase
        .from('badge_definitions')
        .select('*');
      
      if (defError) throw defError;
      
      definitions?.forEach(def => {
        badgeDefinitionsCache.set(def.id, def);
      });
    }

    // Cargar badges de todos los usuarios de una vez
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .in('user_id', uncachedIds);

    if (error) throw error;

    // Organizar por usuario y enriquecer metadata
    const badgesByUser = {};
    
    // Procesar badges y enriquecer metadata
    await Promise.all((data || []).map(async (userBadge) => {
      if (!badgesByUser[userBadge.user_id]) {
        badgesByUser[userBadge.user_id] = [];
      }
      
      const definition = badgeDefinitionsCache.get(userBadge.badge_id);
      if (!definition) return;
      
      let enhancedMetadata = { ...userBadge.metadata };
      
      // Si el badge tiene contest_id, obtener información del reto
      if (userBadge.metadata?.contest_id) {
        try {
          const { data: contestData, error: contestError } = await supabase
            .from('contests')
            .select('title, month')
            .eq('id', userBadge.metadata.contest_id)
            .single();
          
          if (!contestError && contestData) {
            enhancedMetadata = {
              ...enhancedMetadata,
              contest_title: contestData.title,
              contest_month: contestData.month
            };
            
            // Obtener posición específica si es badge de ganador/finalista
            if (['contest_winner', 'contest_finalist'].includes(userBadge.badge_id)) {
              const { data: storyData, error: storyError } = await supabase
                .from('stories')
                .select('winner_position')
                .eq('user_id', userBadge.user_id)
                .eq('contest_id', userBadge.metadata.contest_id)
                .eq('is_winner', true)
                .single();
              
              if (!storyError && storyData) {
                enhancedMetadata.position = storyData.winner_position;
              }
            }
          }
        } catch (error) {
          console.warn('Error enriching badge metadata in preload:', error);
        }
      }
      
      badgesByUser[userBadge.user_id].push({
        ...definition,
        earned_at: userBadge.earned_at,
        metadata: enhancedMetadata
      });
    }));

    // Guardar en cache
    uncachedIds.forEach(userId => {
      badgesCache.set(userId, badgesByUser[userId] || []);
    });

  } catch (err) {
    console.error('Error preloading badges:', err);
  }
};

// Limpiar cache (útil para desarrollo)
export const clearBadgesCache = () => {
  badgesCache.clear();
  badgeDefinitionsCache.clear();
};

// Auto-limpiar cache al cargar el módulo para aplicar cambios inmediatamente
clearBadgesCache();