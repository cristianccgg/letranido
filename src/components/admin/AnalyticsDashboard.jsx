import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  RefreshCw,
  Download,
  Vote,
  Trophy,
  Zap,
  Star,
  Activity,
  PenTool,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useGlobalApp } from "../../contexts/GlobalAppContext";

const AnalyticsDashboard = () => {
  const { currentContest, votingStats } = useGlobalApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("30"); // días

  // Datos de analytics
  const [contestStats, setContestStats] = useState([]);
  const [userEngagement, setUserEngagement] = useState({});
  const [premiumReadiness, setPremiumReadiness] = useState({});
  const [currentContestStats, setCurrentContestStats] = useState({});

  const timeRanges = [
    { value: "7", label: "7 días" },
    { value: "30", label: "30 días" },
    { value: "90", label: "90 días" },
    { value: "365", label: "1 año" },
  ];

  // Cargar analytics principales
  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      // Cargar contest analytics primero (otros lo necesitan)
      await loadContestAnalytics();
      
      // Luego cargar el resto en paralelo
      await Promise.all([
        loadUserEngagementAnalytics(),
        loadPremiumReadinessMetrics(),
        loadCurrentContestStats(),
      ]);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, currentContest]);


  // Cargar stats del concurso actual específicamente
  const loadCurrentContestStats = async () => {
    try {
      // Usar el currentContest del GlobalAppContext que ya está correcto
      if (!currentContest) {
        console.log('❌ No hay currentContest disponible');
        setCurrentContestStats({});
        return;
      }


      const now = new Date();
      const submissionDeadline = new Date(currentContest.submission_deadline);
      const votingDeadline = new Date(currentContest.voting_deadline);
      
      let contestPhase = 'unknown';
      if (currentContest.finalized_at) {
        contestPhase = 'finalized';
      } else if (now <= submissionDeadline) {
        contestPhase = 'submission';
      } else if (now <= votingDeadline) {
        contestPhase = 'voting';
      } else {
        contestPhase = 'ended';
      }


      // Obtener historias del concurso actual
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('id, user_id, likes_count, views_count, word_count')
        .eq('contest_id', currentContest.id);

      if (storiesError) {
        console.error('❌ Error obteniendo historias:', storiesError);
        throw storiesError;
      }

      // Obtener TODOS los votos y comentarios del concurso (no filtrar por fecha)
      const storyIds = stories?.map(s => s.id) || [];
      
      
      let votes = [];
      let comments = [];
      
      // Usar función admin para obtener stats con permisos completos
      const { data: adminStats, error: adminError } = await supabase
        .rpc('get_contest_stats_admin', { contest_uuid: currentContest.id });

      if (adminError) {
        console.warn('⚠️ Función admin no disponible, usando método fallback:', adminError);
        
        // Fallback: obtener datos con limitaciones RLS
        if (storyIds.length > 0) {
          const commentsRes = await supabase
            .from('comments')
            .select(`
              user_id, 
              story_id, 
              created_at,
              stories!inner(id, contest_id)
            `)
            .eq('stories.contest_id', currentContest.id);

          comments = commentsRes.data || [];
          votes = []; // No podemos obtener votos con RLS
          
          }
      } else if (adminStats && adminStats.length > 0) {
        const stats = adminStats[0];
        
        // Simular estructura de datos para compatibilidad
        votes = Array(stats.total_votes).fill().map((_, i) => ({ 
          user_id: `user_${i}`, 
          story_id: storyIds[i % storyIds.length],
          created_at: new Date().toISOString()
        }));
        
        comments = Array(stats.total_comments).fill().map((_, i) => ({ 
          user_id: `user_${i}`, 
          story_id: storyIds[i % storyIds.length]
        }));
      }
        

      // Calcular métricas del concurso actual
      if (stories && stories.length >= 0) {
        let uniqueParticipants, uniqueVoters, uniqueCommenters, totalVotes, totalComments, recentVotes;
        
        if (adminStats && adminStats.length > 0) {
          // Usar datos de función admin (más precisos)
          const stats = adminStats[0];
          uniqueParticipants = stats.unique_participants;
          uniqueVoters = stats.unique_voters;
          uniqueCommenters = stats.unique_commenters;
          totalVotes = stats.total_votes;
          totalComments = stats.total_comments;
          recentVotes = stats.recent_votes_24h;
        } else {
          // Fallback con datos limitados por RLS
          uniqueParticipants = new Set(stories.map(s => s.user_id)).size;
          uniqueVoters = new Set(votes.map(v => v.user_id)).size;
          uniqueCommenters = new Set(comments.map(c => c.user_id)).size;
          totalVotes = votes.length;
          totalComments = comments.length;
          
          const last24h = new Date();
          last24h.setDate(last24h.getDate() - 1);
          recentVotes = votes.filter(v => new Date(v.created_at) > last24h).length;
        }

        setCurrentContestStats({
          contest: { ...currentContest, phase: contestPhase },
          totalStories: stories.length,
          uniqueParticipants,
          uniqueVoters,
          uniqueCommenters,
          totalVotes,
          totalComments,
          recentVotes,
          votingRate: uniqueParticipants > 0 ? (uniqueVoters / uniqueParticipants * 100) : 0,
          commentRate: uniqueParticipants > 0 ? (uniqueCommenters / uniqueParticipants * 100) : 0,
          avgLikesPerStory: stories.length > 0 ? 
            (stories.reduce((sum, s) => sum + (s.likes_count || 0), 0) / stories.length) : 0,
        });
      }
    } catch (error) {
      console.error("Error loading current contest stats:", error);
      setCurrentContestStats({});
    }
  };

  // Analytics de concursos
  const loadContestAnalytics = async () => {
    try {
      // Obtener concursos recientes (activos y finalizados recientes)
      const { data: contests, error: contestsError } = await supabase
        .from('contests')
        .select(`
          id, title, month, status, created_at, finalized_at,
          submission_deadline, voting_deadline
        `)
        .order('created_at', { ascending: false })
        .limit(8); // Más concursos para filtrar después

      // Determinar fase de cada concurso y reordenar por prioridad
      const now = new Date();
      const contestsWithPhase = (contests || []).map(contest => {
        const submissionDeadline = new Date(contest.submission_deadline);
        const votingDeadline = new Date(contest.voting_deadline);
        
        let phase = 'ended';
        if (contest.finalized_at) {
          phase = 'finalized';
        } else if (now <= submissionDeadline) {
          phase = 'submission';
        } else if (now <= votingDeadline) {
          phase = 'voting';
        }
        
        return { ...contest, phase };
      });

      // Ordenar por prioridad: voting > submission > finalized > ended
      const sortedContests = contestsWithPhase.sort((a, b) => {
        const phasePriority = { voting: 0, submission: 1, finalized: 2, ended: 3 };
        const aPriority = phasePriority[a.phase] ?? 4;
        const bPriority = phasePriority[b.phase] ?? 4;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Si misma fase, ordenar por fecha más reciente
        return new Date(b.created_at) - new Date(a.created_at);
      }).slice(0, 5); // Solo top 5 más relevantes

      if (contestsError) throw contestsError;

      // Para cada concurso, obtener métricas detalladas
      const contestAnalytics = await Promise.all(
        sortedContests.map(async (contest) => {
          
          // Historias del concurso
          const { data: stories, error: storiesError } = await supabase
            .from('stories')
            .select('id, user_id, likes_count, views_count, word_count, created_at')
            .eq('contest_id', contest.id);

          if (storiesError) throw storiesError;

          // Usar función admin para obtener stats reales de cada concurso
          let comments = [];
          let uniqueVoters = 0;
          let uniqueCommenters = 0;
          let totalVotes = 0;
          let totalComments = 0;
          
          // Intentar usar función admin primero
          const { data: adminStats, error: adminError } = await supabase
            .rpc('get_contest_stats_admin', { contest_uuid: contest.id });

          if (!adminError && adminStats && adminStats.length > 0) {
            const stats = adminStats[0];
            uniqueVoters = stats.unique_voters;
            uniqueCommenters = stats.unique_commenters;
            totalVotes = stats.total_votes;
            totalComments = stats.total_comments;
            
          } else {
            // Fallback: solo comentarios (votos bloqueados por RLS)
            
            if (stories && stories.length > 0) {
              const commentsResult = await supabase
                .from('comments')
                .select(`
                  user_id, 
                  story_id, 
                  created_at,
                  stories!inner(id, contest_id)
                `)
                .eq('stories.contest_id', contest.id);

              comments = commentsResult.data || [];
              totalComments = comments.length;
              uniqueCommenters = new Set(comments.map(c => c.user_id)).size;
              
              // Votos permanecen en 0 por RLS
              totalVotes = 0;
              uniqueVoters = 0;
            }
          }

          // Las consultas de votos y comentarios ya se hicieron arriba

          // Calcular métricas usando datos de admin o fallback
          const uniqueParticipants = new Set(stories.map(s => s.user_id)).size;
          const totalLikes = stories.reduce((sum, s) => sum + (s.likes_count || 0), 0);
          const totalViews = stories.reduce((sum, s) => sum + (s.views_count || 0), 0);
          const totalWords = stories.reduce((sum, s) => sum + (s.word_count || 0), 0);

          // Engagement rates usando los valores calculados arriba
          const participationRate = uniqueParticipants > 0 ? (uniqueVoters / uniqueParticipants * 100) : 0;
          const commentRate = uniqueParticipants > 0 ? (uniqueCommenters / uniqueParticipants * 100) : 0;
          
          // Super usuarios - calcular solo si tenemos datos admin
          let superUsers = 0;
          if (adminStats && adminStats.length > 0) {
            // Para admin stats, estimamos super users como mínimo entre votantes y comentaristas
            superUsers = Math.min(uniqueVoters, uniqueCommenters);
          } else {
            // Para fallback, solo podemos calcular con comentarios
            const participantIds = new Set(stories.map(s => s.user_id));
            const commenterIds = new Set(comments.map(c => c.user_id));
            superUsers = [...participantIds].filter(id => commenterIds.has(id)).length;
          }

          return {
            ...contest,
            metrics: {
              totalStories: stories.length,
              uniqueParticipants,
              uniqueVoters,
              uniqueCommenters,
              superUsers,
              totalVotes,
              totalComments,
              totalLikes,
              totalViews,
              totalWords,
              avgLikesPerStory: stories.length > 0 ? (totalLikes / stories.length) : 0,
              avgWordsPerStory: stories.length > 0 ? (totalWords / stories.length) : 0,
              participationRate,
              commentRate,
              superUserRate: uniqueParticipants > 0 ? (superUsers / uniqueParticipants * 100) : 0,
            }
          };
        })
      );

      setContestStats(contestAnalytics);
    } catch (error) {
      console.error("Error loading contest analytics:", error);
    }
  };

  // Analytics de engagement de usuarios
  const loadUserEngagementAnalytics = async () => {
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // TODOS los usuarios (sin filtro de fecha de creación)
      const { data: activeUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, display_name, created_at');

      if (usersError) throw usersError;

      // Actividad por usuario
      const userActivities = await Promise.all(
        activeUsers.map(async (user) => {
          // Historias del usuario
          const { data: userStories } = await supabase
            .from('stories')
            .select('id, likes_count, views_count')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString());

          // Votos dados por el usuario (sin filtro de fecha por RLS)
          const { data: userVotes } = await supabase
            .from('votes')
            .select('id, created_at')
            .eq('user_id', user.id);

          // Comentarios del usuario
          const { data: userComments } = await supabase
            .from('comments')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString());

          const totalLikesReceived = (userStories || []).reduce((sum, s) => sum + (s.likes_count || 0), 0);
          const totalViews = (userStories || []).reduce((sum, s) => sum + (s.views_count || 0), 0);

          // Filtrar votos por fecha manualmente
          const recentVotes = (userVotes || []).filter(v => new Date(v.created_at) >= startDate);

          return {
            ...user,
            activity: {
              storiesCount: userStories?.length || 0,
              votesGiven: recentVotes.length,
              commentsGiven: userComments?.length || 0,
              likesReceived: totalLikesReceived,
              viewsReceived: totalViews,
              engagementScore: (userStories?.length || 0) * 10 + 
                              recentVotes.length * 2 + 
                              (userComments?.length || 0) * 3,
            }
          };
        })
      );

      // Calcular métricas globales usando datos de contestStats (que tiene números reales)
      const totalUsers = userActivities.length;
      const activeCreators = userActivities.filter(u => u.activity.storiesCount > 0).length;
      
      // Obtener votantes únicos de todos los concursos (datos reales)
      const allUniqueVoters = new Set();
      const allUniqueCommenters = new Set();
      
      // Agregar votantes de todos los concursos (el filtro de fecha se aplica a la actividad, no al concurso)
      contestStats.forEach(contest => {
        // Para concursos activos o recientes, incluir toda su actividad
        const isActiveOrRecent = contest.phase === 'voting' || contest.phase === 'submission' || 
                                 new Date(contest.created_at) >= startDate;
        
        if (isActiveOrRecent || contest.phase === 'finalized') {
          // Simular IDs únicos basados en métricas reales
          for (let i = 0; i < (contest.metrics.uniqueVoters || 0); i++) {
            allUniqueVoters.add(`${contest.id}_voter_${i}`);
          }
          for (let i = 0; i < (contest.metrics.uniqueCommenters || 0); i++) {
            allUniqueCommenters.add(`${contest.id}_commenter_${i}`);
          }
        }
      });
      
      const activeVoters = allUniqueVoters.size;
      const activeCommenters = userActivities.filter(u => u.activity.commentsGiven > 0).length;
      const superActiveUsers = Math.min(activeCreators, activeVoters, activeCommenters);

      // Top usuarios por engagement score
      const topUsers = userActivities
        .sort((a, b) => b.activity.engagementScore - a.activity.engagementScore)
        .slice(0, 10);

      setUserEngagement({
        totalUsers,
        activeCreators,
        activeVoters,
        activeCommenters,
        superActiveUsers,
        creatorRate: totalUsers > 0 ? (activeCreators / totalUsers * 100) : 0,
        voterRate: totalUsers > 0 ? (activeVoters / totalUsers * 100) : 0,
        commenterRate: totalUsers > 0 ? (activeCommenters / totalUsers * 100) : 0,
        superActiveRate: totalUsers > 0 ? (superActiveUsers / totalUsers * 100) : 0,
        topUsers,
        averageEngagementScore: totalUsers > 0 ? 
          (userActivities.reduce((sum, u) => sum + u.activity.engagementScore, 0) / totalUsers) : 0,
      });

    } catch (error) {
      console.error("Error loading user engagement analytics:", error);
    }
  };

  // Métricas de readiness para premium - usar datos ya calculados
  const loadPremiumReadinessMetrics = async () => {
    try {
      // Usar topUsers de userEngagement para calcular premium candidates
      const premiumCandidates = [];
      const topUsers = userEngagement.topUsers || [];

      // Para cada top user, verificar si es candidato premium
      topUsers.forEach((user, index) => {
        // Engagement score base de userActivities (comentarios y historias son precisos)
        let baseEngagementScore = user.activity.storiesCount * 10 + user.activity.commentsGiven * 3;
        
        // Estimar votos basándose en si es super activo
        // Si es super activo (crea + comenta), probablemente también vota
        let estimatedVotes = 0;
        if (user.activity.storiesCount > 0 && user.activity.commentsGiven > 0) {
          // Super usuarios probablemente votan ~ 2-3 veces por concurso activo
          const activeConcursos = contestStats.filter(c => 
            c.phase === 'voting' || c.phase === 'submission' || c.phase === 'finalized'
          ).length;
          estimatedVotes = activeConcursos * 2; // Estimación conservadora
        } else if (user.activity.commentsGiven > 0) {
          // Comentaristas probablemente votan al menos 1 vez
          estimatedVotes = 1;
        }

        const totalEngagementScore = baseEngagementScore + (estimatedVotes * 2);
        const isPremiumCandidate = totalEngagementScore >= 40 && 
          (user.activity.storiesCount >= 2 || 
           (user.activity.storiesCount >= 1 && user.activity.commentsGiven >= 5));


        if (isPremiumCandidate) {
          premiumCandidates.push({
            ...user,
            engagementScore: totalEngagementScore,
            storiesCount: user.activity.storiesCount,
            votesCount: estimatedVotes,
            commentsCount: user.activity.commentsGiven,
          });
        }
      });

      
      setPremiumReadiness({
        totalUsers: userEngagement.totalUsers || 0,
        premiumCandidates: premiumCandidates.length,
        premiumReadyRate: userEngagement.totalUsers > 0 ? 
          (premiumCandidates.length / userEngagement.totalUsers * 100) : 0,
        topCandidates: premiumCandidates
          .sort((a, b) => b.engagementScore - a.engagementScore)
          .slice(0, 10),
        averageEngagement: premiumCandidates.length > 0 ?
          (premiumCandidates.reduce((sum, u) => sum + u.engagementScore, 0) / premiumCandidates.length) : 0,
      });

    } catch (error) {
      console.error("Error loading premium readiness metrics:", error);
      // Set empty data on error
      setPremiumReadiness({
        totalUsers: 0,
        premiumCandidates: 0,
        premiumReadyRate: 0,
        topCandidates: [],
        averageEngagement: 0,
      });
    }
  };

  // Refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Exportar datos
  const exportData = () => {
    const dataToExport = {
      timeRange: `${timeRange} días`,
      generatedAt: new Date().toISOString(),
      contestStats,
      userEngagement,
      premiumReadiness,
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `literatura-analytics-${timeRange}d-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Solo cargar analytics si currentContest está disponible
    if (currentContest) {
      loadAnalytics();
    }
  }, [loadAnalytics, currentContest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-600">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-blue-600 dark:text-blue-400" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-dark-300 mt-1">
            Métricas de engagement y readiness para premium
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-dark-100"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 text-sm transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 text-sm transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Usuarios Activos"
          value={userEngagement.totalUsers || 0}
          change={`${userEngagement.superActiveRate?.toFixed(1) || 0}% super activos`}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Tasa de Participación"
          value={`${userEngagement.creatorRate?.toFixed(1) || 0}%`}
          change={`${userEngagement.activeCreators || 0} usuarios crean contenido`}
          icon={PenTool}
          color="green"
        />
        <MetricCard
          title="Engagement de Votación"
          value={`${userEngagement.voterRate?.toFixed(1) || 0}%`}
          change={`${userEngagement.activeVoters || 0} usuarios votan`}
          icon={Vote}
          color="purple"
        />
        <MetricCard
          title="Premium Ready"
          value={premiumReadiness.premiumCandidates || 0}
          change={`${premiumReadiness.premiumReadyRate?.toFixed(1) || 0}% del total`}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Stats del Concurso Actual */}
      {currentContestStats.contest && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            📊 Concurso Actual: {currentContestStats.contest.title}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentContestStats.totalStories || 0}</div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Historias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentContestStats.totalVotes || 0}</div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Votos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{currentContestStats.totalComments || 0}</div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Comentarios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{currentContestStats.recentVotes || 0}</div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Votos 24h</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600">
              <div className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                {currentContestStats.uniqueVoters || 0} / {currentContestStats.uniqueParticipants || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Han votado</div>
              <div className="text-xs text-blue-600 font-medium">
                {currentContestStats.votingRate?.toFixed(1) || 0}% participación en votación
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600">
              <div className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                {currentContestStats.uniqueCommenters || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Han comentado</div>
              <div className="text-xs text-purple-600 font-medium">
                {currentContestStats.commentRate?.toFixed(1) || 0}% dejan comentarios
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600">
              <div className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                {currentContestStats.avgLikesPerStory?.toFixed(1) || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-300">Likes promedio</div>
              <div className="text-xs text-green-600 font-medium">Por historia</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Estado:</strong> {currentContestStats.contest.phase === 'voting' ? '🗳️ En votación' : 
                                        currentContestStats.contest.phase === 'submission' ? '📝 Recibiendo historias' :
                                        '🏆 Finalizado'} • 
              <strong className="ml-2">Mes:</strong> {currentContestStats.contest.month}
            </div>
          </div>
        </div>
      )}


      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Contest Analytics */}
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            Analytics por Concurso
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {contestStats.map((contest, index) => {
              const isActive = contest.phase === 'voting' || contest.phase === 'submission';
              const isCurrentlyActive = index === 0 && isActive;
              
              return (
              <div key={contest.id} className={`bg-white dark:bg-dark-800 rounded-lg p-3 border-2 ${
                isCurrentlyActive ? 'border-green-400 shadow-lg' : 'border-gray-200 dark:border-dark-600'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-dark-100 text-sm">
                      {isCurrentlyActive && '🎯 '}{contest.title}
                    </h4>
                    {isCurrentlyActive && (
                      <div className="text-xs text-green-600 font-medium">CONCURSO ACTIVO</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      contest.phase === 'finalized' ? 'bg-gray-100 text-gray-700' :
                      contest.phase === 'voting' ? 'bg-green-100 text-green-700' :
                      contest.phase === 'submission' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {contest.phase === 'voting' ? '🗳️ Votación' :
                       contest.phase === 'submission' ? '📝 Envíos' :
                       contest.phase === 'finalized' ? '🏆 Finalizado' :
                       '⏰ Terminado'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-dark-400">{contest.month}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-dark-300">
                  <div>
                    <span className="font-medium">Historias:</span> {contest.metrics.totalStories}
                  </div>
                  <div>
                    <span className="font-medium">Votos:</span> {contest.metrics.totalVotes}
                  </div>
                  <div>
                    <span className="font-medium">Comentarios:</span> {contest.metrics.totalComments}
                  </div>
                  <div>
                    <span className="font-medium">Participantes:</span> {contest.metrics.uniqueParticipants}
                  </div>
                  <div>
                    <span className="font-medium">Votantes:</span> {contest.metrics.uniqueVoters}
                  </div>
                  <div>
                    <span className="font-medium">Super users:</span> {contest.metrics.superUsers}
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <div className="bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(contest.metrics.participationRate, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-500 dark:text-dark-400">
                    {contest.metrics.participationRate.toFixed(1)}% engagement
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Top Premium Candidates */}
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Top Candidatos Premium
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(premiumReadiness.topCandidates || []).map((candidate, index) => (
              <div key={candidate.id} className="flex items-center justify-between bg-white dark:bg-dark-800 rounded-lg p-3 border border-gray-200 dark:border-dark-600">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-100 text-sm">
                      {candidate.display_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {candidate.storiesCount || 0} historias • {candidate.votesCount || 0} votos • {candidate.commentsCount || 0} comentarios
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600 text-sm">
                    {candidate.engagementScore || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-dark-400">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Engagement Global
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Creators activos:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">{userEngagement.activeCreators || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Voters activos:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">{userEngagement.activeVoters || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Super activos:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">{userEngagement.superActiveUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Score promedio:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">{userEngagement.averageEngagementScore?.toFixed(1) || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendencias
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-200">Tasa creadores:</span>
              <span className="font-medium text-green-900 dark:text-green-100">{userEngagement.creatorRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-200">Tasa votantes:</span>
              <span className="font-medium text-green-900 dark:text-green-100">{userEngagement.voterRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-200">Tasa comentarios:</span>
              <span className="font-medium text-green-900 dark:text-green-100">{userEngagement.commenterRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-200">Super activos:</span>
              <span className="font-medium text-green-900 dark:text-green-100">{userEngagement.superActiveRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Premium Insights
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-200">Candidatos:</span>
              <span className="font-medium text-yellow-900 dark:text-yellow-100">{premiumReadiness.premiumCandidates || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-200">% Ready:</span>
              <span className="font-medium text-yellow-900 dark:text-yellow-100">{premiumReadiness.premiumReadyRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-200">Avg score:</span>
              <span className="font-medium text-yellow-900 dark:text-yellow-100">{premiumReadiness.averageEngagement?.toFixed(1) || 0}</span>
            </div>
            <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded text-xs">
              <strong className="text-yellow-800 dark:text-yellow-200">Recomendación:</strong>
              <br />
              {premiumReadiness.premiumReadyRate > 15 ? 
                "🟢 Buen momento para lanzar premium" :
                premiumReadiness.premiumReadyRate > 8 ?
                "🟡 Considera lanzar beta premium" :
                "🔴 Necesitas más engagement antes de premium"
              }
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// Componente auxiliar para métricas  
const MetricCard = ({ title, value, change, icon: IconComponent, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-dark-700 rounded-lg p-4 border border-gray-200 dark:border-dark-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-dark-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {React.createElement(IconComponent, { className: "h-6 w-6" })}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-dark-400 mt-2">{change}</p>
    </div>
  );
};

export default AnalyticsDashboard;