import { useState, useEffect } from 'react';
import { useGlobalApp } from '../contexts/GlobalAppContext';
import { supabase } from '../lib/supabase';

/**
 * Hook para manejar funciones premium y permisos del usuario
 */
export const usePremiumFeatures = () => {
  const { user, isAuthenticated } = useGlobalApp();
  const [userLimits, setUserLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar límites del usuario
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUserLimits({
        max_words: 1000,
        contests_per_month: 1,
        can_use_portfolio: false,
        has_premium_feedback: false,
        can_buy_feedback: true,
        can_edit_bio: false,
        can_set_location: false,
        can_add_website: false,
        profile_features: 'basic'
      });
      setLoading(false);
      return;
    }

    fetchUserLimits();
  }, [user?.id, isAuthenticated]);

  const fetchUserLimits = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_user_limits', { 
          user_id: user.id 
        });

      if (error) {
        console.error('Error fetching user limits:', error);
        return;
      }

      setUserLimits(data);
    } catch (error) {
      console.error('Error in fetchUserLimits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones helper para verificar permisos específicos
  const canEditBio = () => userLimits?.can_edit_bio || false;
  const canSetLocation = () => userLimits?.can_set_location || false;
  const canAddWebsite = () => userLimits?.can_add_website || false;
  const canUsePortfolio = () => userLimits?.can_use_portfolio || false;
  const hasPremiumFeedback = () => userLimits?.has_premium_feedback || false;
  const canBuyFeedback = () => userLimits?.can_buy_feedback || false;
  const isPremium = () => userLimits?.profile_features === 'premium';

  // Obtener límite de palabras para el usuario
  const getWordLimit = () => userLimits?.max_words || 1000;

  // Obtener límite de concursos por mes
  const getContestLimit = () => userLimits?.contests_per_month || 1;

  // Verificar cuántos concursos ha participado este mes
  const checkMonthlyContestLimit = async () => {
    if (!user?.id) return { canParticipate: true, used: 0, limit: 1 };

    try {
      // Calcular el primer día de este mes
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('stories')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString());

      if (error) {
        console.error('Error checking monthly contest limit:', error);
        return { canParticipate: true, used: 0, limit: getContestLimit() };
      }

      const used = data?.length || 0;
      const limit = getContestLimit();
      
      return {
        canParticipate: used < limit,
        used,
        limit,
        remaining: Math.max(0, limit - used)
      };
    } catch (error) {
      console.error('Error in checkMonthlyContestLimit:', error);
      return { canParticipate: true, used: 0, limit: getContestLimit() };
    }
  };

  // Verificar si el usuario ha alcanzado algún límite
  const checkWordLimit = (wordCount) => {
    const limit = getWordLimit();
    return {
      isWithinLimit: wordCount <= limit,
      limit,
      remaining: Math.max(0, limit - wordCount),
      percentage: Math.min(100, (wordCount / limit) * 100)
    };
  };

  // Obtener mensaje de upgrade para una función específica
  const getUpgradeMessage = (feature) => {
    const messages = {
      bio: 'Bio personalizada solo disponible para usuarios premium',
      location: 'Ubicación solo disponible para usuarios premium',  
      website: 'Website personal solo disponible para usuarios premium',
      portfolio: 'Portafolio personal solo disponible para usuarios premium',
      words: `Límite de ${getWordLimit()} palabras. Upgrade a premium para 3,000 palabras`,
      contests: `Límite de ${getContestLimit()} concurso por mes. Upgrade a premium para concursos ilimitados`,
      feedback: 'Feedback profesional incluido en plan premium'
    };
    
    return messages[feature] || 'Esta función requiere plan premium';
  };

  return {
    // Estado
    userLimits,
    loading,
    
    // Permisos
    canEditBio,
    canSetLocation,
    canAddWebsite,
    canUsePortfolio,
    hasPremiumFeedback,
    canBuyFeedback,
    isPremium,
    
    // Límites
    getWordLimit,
    getContestLimit,
    checkWordLimit,
    checkMonthlyContestLimit,
    
    // Utilidades
    getUpgradeMessage,
    refreshLimits: fetchUserLimits
  };
};

export default usePremiumFeatures;