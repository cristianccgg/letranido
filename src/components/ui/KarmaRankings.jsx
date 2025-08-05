import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Star, Users, Medal, Crown, Flame, Sparkles, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import UserAvatar from './UserAvatar';
import Badge from './Badge';
import { useBadgesCache } from '../../hooks/useBadgesCache';

// Sistema de karma adaptado para Letranido
const KARMA_POINTS = {
  STORY_PUBLISHED: 15,        // Por publicar una historia
  LIKE_RECEIVED: 2,           // Por cada like recibido
  COMMENT_RECEIVED: 1,        // Por cada comentario recibido
  CONTEST_WIN: 75,            // Por ganar un concurso
  CONTEST_FINALIST: 30,       // Por ser top 3
  VOTE_GIVEN: 1,              // Por votar en concursos
  CONSECUTIVE_MONTHS: 10      // Bonus por participar meses consecutivos
};

const KarmaRankings = () => {
  const { currentContest, currentContestPhase, contests } = useGlobalApp();
  const [rankings, setRankings] = useState({
    allTime: [],
    thisMonth: [],
    risingStars: [],
    mostActive: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('allTime');

  useEffect(() => {
    loadRankings();
  }, [currentContestPhase]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      // Obtener todas las historias con información de concursos
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          user_id,
          author,
          likes_count,
          contest_id,
          published_at,
          word_count,
          contests(id, title, month, status, finalized_at, voting_deadline)
        `)
        .not('published_at', 'is', null);

      if (storiesError) throw storiesError;

      // Obtener votos dados por usuarios (para karma por votar)
      const { data: votes, error: votesError } = await supabase
        .from('story_votes')
        .select('user_id, story_id, created_at');

      if (votesError) console.warn('Error loading votes:', votesError);

      // Calcular karma por usuario
      const userKarma = calculateUserKarma(stories, votes || []);
      
      setRankings({
        allTime: getAllTimeRanking(userKarma),
        thisMonth: getThisMonthRanking(userKarma, stories),
        risingStars: getRisingStars(userKarma, stories),
        mostActive: getMostActive(userKarma)
      });

    } catch (error) {
      console.error('Error loading karma rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserKarma = (stories, votes) => {
    const userKarma = {};

    // Procesar historias para karma
    stories.forEach(story => {
      const userId = story.user_id;
      const author = story.author;

      if (!userKarma[userId]) {
        userKarma[userId] = {
          userId,
          author,
          totalKarma: 0,
          monthlyKarma: 0,
          totalStories: 0,
          totalLikes: 0,
          contestWins: 0,
          contestFinalist: 0,
          votesGiven: 0,
          consecutiveMonths: 0,
          joinDate: new Date(story.published_at),
          lastActivity: new Date(story.published_at),
          recentActivity: 0,
          contestsParticipated: new Set()
        };
      }

      const user = userKarma[userId];
      
      // Karma por publicar historia
      user.totalKarma += KARMA_POINTS.STORY_PUBLISHED;
      user.totalStories++;
      user.contestsParticipated.add(story.contest_id);

      // Karma por likes (solo si el concurso está en fase de resultados o votación)
      const contest = story.contests;
      const canShowVotes = contest && (
        contest.status === 'results' || 
        (contest.status === 'voting' && currentContestPhase === 'voting')
      );

      if (canShowVotes) {
        const likes = story.likes_count || 0;
        user.totalKarma += likes * KARMA_POINTS.LIKE_RECEIVED;
        user.totalLikes += likes;
      }

      // Detectar ganadores y finalistas en concursos finalizados
      if (contest?.status === 'results') {
        const allContestStories = stories.filter(s => s.contest_id === story.contest_id);
        const sortedByVotes = allContestStories.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        const position = sortedByVotes.findIndex(s => s.id === story.id) + 1;
        
        if (position === 1) {
          user.contestWins++;
          user.totalKarma += KARMA_POINTS.CONTEST_WIN;
        } else if (position <= 3) {
          user.contestFinalist++;
          user.totalKarma += KARMA_POINTS.CONTEST_FINALIST;
        }
      }

      // Actividad del mes actual
      const storyDate = new Date(story.published_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      if (storyDate.getMonth() === currentMonth && storyDate.getFullYear() === currentYear) {
        user.monthlyKarma += KARMA_POINTS.STORY_PUBLISHED;
        if (canShowVotes) {
          user.monthlyKarma += (story.likes_count || 0) * KARMA_POINTS.LIKE_RECEIVED;
        }
      }

      // Actividad reciente (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (storyDate > thirtyDaysAgo) {
        user.recentActivity++;
      }

      // Actualizar fechas
      if (storyDate < user.joinDate) user.joinDate = storyDate;
      if (storyDate > user.lastActivity) user.lastActivity = storyDate;
    });

    // Procesar votos dados por usuarios
    votes.forEach(vote => {
      if (userKarma[vote.user_id]) {
        userKarma[vote.user_id].votesGiven++;
        userKarma[vote.user_id].totalKarma += KARMA_POINTS.VOTE_GIVEN;
        
        // Karma mensual por votos
        const voteDate = new Date(vote.created_at);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (voteDate.getMonth() === currentMonth && voteDate.getFullYear() === currentYear) {
          userKarma[vote.user_id].monthlyKarma += KARMA_POINTS.VOTE_GIVEN;
        }
      }
    });

    // Calcular meses consecutivos y bonus
    Object.values(userKarma).forEach(user => {
      user.contestsParticipated = user.contestsParticipated.size;
      
      // Bonus por participación consecutiva (simplificado por ahora)
      if (user.contestsParticipated >= 2) {
        user.consecutiveMonths = user.contestsParticipated;
        user.totalKarma += user.consecutiveMonths * KARMA_POINTS.CONSECUTIVE_MONTHS;
      }
    });

    return userKarma;
  };

  const getAllTimeRanking = (userKarma) => {
    return Object.values(userKarma)
      .sort((a, b) => b.totalKarma - a.totalKarma)
      .slice(0, 10);
  };

  const getThisMonthRanking = (userKarma) => {
    return Object.values(userKarma)
      .filter(user => user.monthlyKarma > 0)
      .sort((a, b) => b.monthlyKarma - a.monthlyKarma)
      .slice(0, 10);
  };

  const getRisingStars = (userKarma, stories) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Object.values(userKarma)
      .filter(user => user.joinDate > thirtyDaysAgo && user.totalStories >= 1)
      .sort((a, b) => b.totalKarma - a.totalKarma)
      .slice(0, 10);
  };

  const getMostActive = (userKarma) => {
    return Object.values(userKarma)
      .sort((a, b) => {
        // Ordenar por actividad: concursos > historias > votos dados
        if (b.contestsParticipated !== a.contestsParticipated) {
          return b.contestsParticipated - a.contestsParticipated;
        }
        if (b.totalStories !== a.totalStories) {
          return b.totalStories - a.totalStories;
        }
        return b.votesGiven - a.votesGiven;
      })
      .slice(0, 10);
  };

  const tabs = [
    {
      id: 'allTime',
      label: 'Hall of Fame',
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      description: 'Los escritores con más karma de todos los tiempos'
    },
    {
      id: 'thisMonth',
      label: 'Este Mes',
      icon: Flame,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      description: 'Quienes más karma han ganado este mes'
    },
    {
      id: 'risingStars',
      label: 'Estrellas Emergentes',
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Nuevos escritores que destacan'
    },
    {
      id: 'mostActive',
      label: 'Más Activos',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Los más participativos de la comunidad'
    }
  ];

  const KarmaCard = ({ user, position, type }) => {
    const { userBadges, loading: badgesLoading } = useBadgesCache(user.userId);
    
    const getMedalIcon = (pos) => {
      if (pos === 1) return '🥇';
      if (pos === 2) return '🥈';
      if (pos === 3) return '🥉';
      return `#${pos}`;
    };

    const getPrimaryMetric = () => {
      switch (type) {
        case 'allTime':
          return `${user.totalKarma} karma`;
        case 'thisMonth':
          return `${user.monthlyKarma} karma`;
        case 'risingStars':
          return `${user.totalKarma} karma`;
        case 'mostActive':
          return `${user.contestsParticipated} concursos`;
        default:
          return `${user.totalKarma} karma`;
      }
    };

    const getSecondaryMetric = () => {
      switch (type) {
        case 'allTime':
          return `${user.contestWins} victorias • ${user.totalStories} historias`;
        case 'thisMonth':
          return `${user.totalStories} historias • ${user.votesGiven} votos dados`;
        case 'risingStars':
          return `${user.totalStories} historias • ${user.totalLikes} likes`;
        case 'mostActive':
          return `${user.totalStories} historias • ${user.votesGiven} votos`;
        default:
          return `${user.totalStories} historias`;
      }
    };

    return (
      <div className={`
        relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg
        ${position <= 3 
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-600' 
          : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600'
        }
      `}>
        {/* Badge de posición */}
        <div className="absolute -top-3 -left-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg
            ${position <= 3 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
              : 'bg-gray-500 text-white'
            }
          `}>
            {getMedalIcon(position)}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          {/* Avatar */}
          <UserAvatar 
            user={{ name: user.author, email: `${user.author}@mock.com` }}
            size="lg"
          />

          {/* Info del usuario */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-dark-100 truncate">
                {user.author}
              </h3>
              {/* Mostrar mejor badge del usuario */}
              {!badgesLoading && userBadges.length > 0 && (
                <Badge badge={userBadges[0]} size="xs" />
              )}
            </div>
            
            {/* Métrica principal */}
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {getPrimaryMetric()}
              </div>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            
            {/* Métricas secundarias */}
            <div className="text-sm text-gray-600 dark:text-dark-300">
              {getSecondaryMetric()}
            </div>
          </div>

          {/* Indicadores especiales */}
          <div className="text-right">
            {user.contestWins > 0 && (
              <div className="flex items-center gap-1 text-yellow-600 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-semibold">{user.contestWins}</span>
              </div>
            )}
            {type === 'risingStars' && (
              <div className="text-purple-500">
                <Star className="h-5 w-5" />
              </div>
            )}
            {type === 'mostActive' && user.recentActivity > 0 && (
              <div className="text-green-500">
                <TrendingUp className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-300">Calculando karma...</p>
        </div>
      </div>
    );
  }

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const currentRanking = rankings[activeTab] || [];

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-b border-gray-200 dark:border-dark-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100">
              Karma Rankings
            </h2>
            <p className="text-gray-600 dark:text-dark-300">
              Los escritores que más contribuyen a la comunidad
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${isActive 
                    ? `${tab.bgColor} ${tab.color} shadow-md` 
                    : 'bg-white dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-600'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tab description */}
        <p className="text-gray-600 dark:text-dark-300 mb-6 text-center">
          {currentTab?.description}
        </p>

        {/* Karma explanation - solo mostrar en primera carga */}
        {activeTab === 'allTime' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              ¿Cómo se gana karma?
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <div>📝 Publicar historia: <strong>+15 karma</strong></div>
              <div>❤️ Recibir like: <strong>+2 karma</strong></div>
              <div>🗳️ Votar por historias: <strong>+1 karma</strong></div>
              <div>🏆 Ganar concurso: <strong>+75 karma</strong></div>
              <div>🥉 Ser finalista (top 3): <strong>+30 karma</strong></div>
              <div>🔥 Participar meses consecutivos: <strong>+10 karma/mes</strong></div>
            </div>
          </div>
        )}

        {/* Rankings */}
        <div className="space-y-4">
          {currentRanking.length > 0 ? (
            currentRanking.map((user, index) => (
              <KarmaCard 
                key={user.userId} 
                user={user} 
                position={index + 1}
                type={activeTab}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-gray-300 dark:text-dark-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-dark-400 text-lg">
                {activeTab === 'thisMonth' 
                  ? 'Nadie ha ganado karma este mes aún'
                  : 'No hay datos suficientes para este ranking aún'
                }
              </p>
              <p className="text-gray-400 dark:text-dark-500 text-sm mt-2">
                ¡Sigue participando y contribuyendo para ganar karma!
              </p>
            </div>
          )}
        </div>

        {/* Footer motivacional */}
        <div className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl text-center">
          <p className="text-gray-700 dark:text-dark-300 font-medium">
            ⚡ <strong>¡Gana más karma!</strong> Participa activamente: escribe, vota, comenta y ayuda a que la comunidad crezca
          </p>
        </div>
      </div>
    </div>
  );
};

export default KarmaRankings;