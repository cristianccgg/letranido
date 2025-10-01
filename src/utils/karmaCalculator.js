// utils/karmaCalculator.js - Utilidades para calcular karma de usuarios específicos

import { supabase } from '../lib/supabase';

// Sistema de karma (mismo que KarmaRankingsSidebar.jsx)
export const KARMA_POINTS = {
  STORY_PUBLISHED: 15,
  LIKE_RECEIVED: 2,
  COMMENT_RECEIVED: 3,
  COMMENT_GIVEN: 2,
  CONTEST_WIN: 75,
  CONTEST_FINALIST: 30,
  VOTE_GIVEN: 1,
  CONSECUTIVE_MONTHS: 10
};

/**
 * Calcula el karma y estadísticas de un usuario específico
 * @param {string} userId - ID del usuario
 * @param {Object} globalData - Datos globales del contexto (currentContestPhase, contests)
 * @returns {Object} Objeto con karma total, stats y ranking global estimado
 */
export const calculateUserKarma = async (userId, globalData = {}) => {
  try {
    console.log('🔄 Calculando karma para usuario:', userId);
    
    // Obtener historias del usuario
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
        likes_count,
        contest_id,
        published_at,
        title
      `)
      .eq('user_id', userId)
      .not('published_at', 'is', null);

    if (storiesError) {
      console.error('Error loading user stories:', storiesError);
      throw storiesError;
    }

    // Obtener votos dados por el usuario
    let votes = [];
    try {
      const { data: rpcVotes, error: rpcError } = await supabase
        .rpc('get_all_votes_for_rankings');
      
      if (rpcError) {
        // Fallback a consulta directa
        const { data: directVotes } = await supabase
          .from('votes')
          .select('user_id, created_at')
          .eq('user_id', userId);
        votes = directVotes || [];
      } else {
        votes = (rpcVotes || []).filter(v => v.user_id === userId);
      }
    } catch (error) {
      console.warn('Error loading votes for user:', error);
      votes = [];
    }

    // Obtener comentarios del usuario (dados y recibidos)
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('user_id, story_id, created_at')
      .or(`user_id.eq.${userId},story_id.in.(${(stories || []).map(s => s.id).join(',') || 'null'})`);

    if (commentsError) {
      console.warn('Error loading comments for user:', commentsError);
    }

    // Obtener información de concursos
    const { data: contests, error: contestsError } = await supabase
      .from('contests')
      .select('id, title, month, status, finalized_at, voting_deadline');

    if (contestsError) {
      console.warn('Error loading contests:', contestsError);
    }

    // Calcular karma del usuario
    const userKarma = calculateSingleUserKarma(
      userId, 
      stories || [], 
      votes || [], 
      comments || [], 
      contests || [], 
      globalData
    );

    return userKarma;

  } catch (error) {
    console.error('Error calculating user karma:', error);
    return {
      userId,
      totalKarma: 0,
      monthlyKarma: 0,
      totalStories: 0,
      contestWins: 0,
      contestFinals: 0,
      votesGiven: 0,
      commentsGiven: 0,
      commentsReceived: 0,
      rank: null,
      badges: []
    };
  }
};

/**
 * Calcula karma para un usuario específico (lógica extraída de KarmaRankingsSidebar)
 */
const calculateSingleUserKarma = (userId, stories, votes, comments, contests, globalData) => {
  const { currentContestPhase } = globalData;
  
  const userStats = {
    userId,
    totalKarma: 0,
    monthlyKarma: 0,
    totalStories: 0,
    contestWins: 0,
    contestFinals: 0,
    votesGiven: 0,
    commentsGiven: 0,
    commentsReceived: 0,
    badges: []
  };

  // Calcular karma por votos dados
  votes.forEach(vote => {
    userStats.votesGiven++;
    userStats.totalKarma += KARMA_POINTS.VOTE_GIVEN;

    // Karma mensual por votos
    const voteDate = new Date(vote.created_at);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (voteDate.getMonth() === currentMonth && voteDate.getFullYear() === currentYear) {
      userStats.monthlyKarma += KARMA_POINTS.VOTE_GIVEN;
    }
  });

  // Calcular karma por comentarios
  comments.forEach(comment => {
    const commentAuthorId = comment.user_id;
    const storyAuthorId = stories.find(s => s.id === comment.story_id)?.user_id;
    
    // Karma para quien da el comentario
    if (commentAuthorId === userId) {
      userStats.commentsGiven++;
      userStats.totalKarma += KARMA_POINTS.COMMENT_GIVEN;

      // Karma mensual por comentario dado
      const commentDate = new Date(comment.created_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      if (commentDate.getMonth() === currentMonth && commentDate.getFullYear() === currentYear) {
        userStats.monthlyKarma += KARMA_POINTS.COMMENT_GIVEN;
      }
    }
    
    // Karma para quien recibe el comentario (autor de la historia)
    if (storyAuthorId === userId && storyAuthorId !== commentAuthorId) {
      userStats.commentsReceived++;
      userStats.totalKarma += KARMA_POINTS.COMMENT_RECEIVED;

      // Karma mensual por comentario recibido
      const commentDate = new Date(comment.created_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      if (commentDate.getMonth() === currentMonth && commentDate.getFullYear() === currentYear) {
        userStats.monthlyKarma += KARMA_POINTS.COMMENT_RECEIVED;
      }
    }
  });

  // Calcular karma por historias
  stories.forEach(story => {
    // Karma básico por historia
    userStats.totalKarma += KARMA_POINTS.STORY_PUBLISHED;
    userStats.totalStories++;

    // Buscar información del concurso
    const contest = contests.find(c => c.id === story.contest_id);
    const canShowVotes = contest && (
      contest.status === 'results' || 
      (contest.status === 'voting' && currentContestPhase === 'voting')
    );

    if (canShowVotes && story.likes_count) {
      userStats.totalKarma += story.likes_count * KARMA_POINTS.LIKE_RECEIVED;
    }

    // Detectar ganadores y finalistas
    if (contest?.status === 'results') {
      const allContestStories = stories.filter(s => s.contest_id === story.contest_id);
      const sortedByVotes = allContestStories.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      const position = sortedByVotes.findIndex(s => s.id === story.id) + 1;
      
      if (position === 1) {
        userStats.contestWins++;
        userStats.totalKarma += KARMA_POINTS.CONTEST_WIN;
      } else if (position <= 3) {
        userStats.contestFinals++;
        userStats.totalKarma += KARMA_POINTS.CONTEST_FINALIST;
      }
    }

    // Karma mensual
    const storyDate = new Date(story.published_at);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (storyDate.getMonth() === currentMonth && storyDate.getFullYear() === currentYear) {
      userStats.monthlyKarma += KARMA_POINTS.STORY_PUBLISHED;
      if (canShowVotes && story.likes_count) {
        userStats.monthlyKarma += story.likes_count * KARMA_POINTS.LIKE_RECEIVED;
      }
    }
  });

  // Calcular badges basados en estadísticas
  userStats.badges = calculateUserBadges(userStats);

  return userStats;
};

/**
 * Calcula badges basados en las estadísticas del usuario
 */
const calculateUserBadges = (stats) => {
  const badges = [];

  // Badges por número de historias
  if (stats.totalStories >= 1) badges.push({ type: 'stories', level: 'bronze', title: 'Primer Relato' });
  if (stats.totalStories >= 5) badges.push({ type: 'stories', level: 'silver', title: 'Narrador' });
  if (stats.totalStories >= 10) badges.push({ type: 'stories', level: 'gold', title: 'Escritor Prolífico' });
  if (stats.totalStories >= 25) badges.push({ type: 'stories', level: 'platinum', title: 'Maestro Narrador' });

  // Badges por karma total
  if (stats.totalKarma >= 50) badges.push({ type: 'karma', level: 'bronze', title: 'Participante Activo' });
  if (stats.totalKarma >= 200) badges.push({ type: 'karma', level: 'silver', title: 'Miembro Valioso' });
  if (stats.totalKarma >= 500) badges.push({ type: 'karma', level: 'gold', title: 'Pilar de la Comunidad' });
  if (stats.totalKarma >= 1000) badges.push({ type: 'karma', level: 'platinum', title: 'Leyenda de Letranido' });

  // Badges por concursos
  if (stats.contestWins >= 1) badges.push({ type: 'contest', level: 'gold', title: 'Campeón' });
  if (stats.contestWins >= 3) badges.push({ type: 'contest', level: 'platinum', title: 'Tricampeón' });
  if (stats.contestFinals >= 1) badges.push({ type: 'contest', level: 'silver', title: 'Finalista' });

  // Badges por interacción
  if (stats.commentsGiven >= 10) badges.push({ type: 'community', level: 'bronze', title: 'Comentarista' });
  if (stats.commentsGiven >= 50) badges.push({ type: 'community', level: 'silver', title: 'Crítico Constructivo' });
  if (stats.votesGiven >= 25) badges.push({ type: 'community', level: 'bronze', title: 'Votante Activo' });

  return badges;
};

/**
 * Obtiene el ranking aproximado del usuario comparándolo con la cache
 */
export const getUserRanking = async (userId, userKarma) => {
  try {
    // Intentar obtener ranking desde cache
    const { data: cachedRankings, error } = await supabase
      .from('cached_rankings')
      .select('user_id, total_karma, position')
      .order('position', { ascending: true });

    if (error || !cachedRankings) {
      return null;
    }

    // Buscar posición exacta del usuario en cache
    const userRankingEntry = cachedRankings.find(r => r.user_id === userId);
    if (userRankingEntry) {
      return {
        position: userRankingEntry.position,
        totalUsers: cachedRankings.length,
        percentile: Math.round((1 - (userRankingEntry.position / cachedRankings.length)) * 100)
      };
    }

    // Si no está en cache, estimar posición basada en karma
    const usersWithMoreKarma = cachedRankings.filter(r => r.total_karma > userKarma).length;
    return {
      position: usersWithMoreKarma + 1,
      totalUsers: cachedRankings.length + 1,
      percentile: Math.round((1 - ((usersWithMoreKarma + 1) / (cachedRankings.length + 1))) * 100)
    };

  } catch (error) {
    console.error('Error getting user ranking:', error);
    return null;
  }
};