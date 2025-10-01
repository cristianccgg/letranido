// components/profile/UserKarmaSection.jsx - Sección de karma y estadísticas para perfiles

import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Crown, Medal, PenTool, MessageCircle, Heart, Vote, TrendingUp, Award } from 'lucide-react';
import { calculateUserKarma, getUserRanking, KARMA_POINTS } from '../../utils/karmaCalculator';
import { useGlobalApp } from '../../contexts/GlobalAppContext';

const UserKarmaSection = ({ userId, userName = "Usuario", compact = false }) => {
  const [userKarma, setUserKarma] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentContestPhase, contests } = useGlobalApp();

  useEffect(() => {
    if (userId) {
      loadUserKarma();
    }
  }, [userId, currentContestPhase]);

  const loadUserKarma = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular karma del usuario
      const karmaData = await calculateUserKarma(userId, { 
        currentContestPhase, 
        contests 
      });
      
      setUserKarma(karmaData);

      // Obtener ranking si tiene karma
      if (karmaData.totalKarma > 0) {
        const ranking = await getUserRanking(userId, karmaData.totalKarma);
        setUserRanking(ranking);
      }

    } catch (err) {
      console.error('Error loading user karma:', err);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-dark-600 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-300 dark:bg-dark-600 rounded"></div>
            <div className="h-16 bg-gray-300 dark:bg-dark-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-red-200 dark:border-red-800 shadow-sm p-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Zap className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!userKarma) {
    return null;
  }

  // Componente compacto para perfil público
  if (compact) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg shadow-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-100">
                Karma de {userName}
              </h3>
              {userKarma.isFromCache && (
                <p className="text-xs text-gray-500 dark:text-dark-400">
                  🏆 Actualizado al cerrar retos
                </p>
              )}
            </div>
          </div>
          {userRanking && (
            <div className="flex items-center gap-1 text-xs bg-white dark:bg-dark-700 px-2 py-1 rounded-full">
              <Trophy className="h-3 w-3 text-primary-500" />
              <span className="font-bold text-primary-600 dark:text-primary-400">
                #{userRanking.position}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-primary-600 dark:text-primary-400">
              {userKarma.totalKarma}
            </div>
            <div className="text-gray-600 dark:text-dark-400 text-xs">Karma Total</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900 dark:text-dark-100">
              {userKarma.totalStories}
            </div>
            <div className="text-gray-600 dark:text-dark-400 text-xs">Historias</div>
          </div>
        </div>

{(userKarma.contestWins > 0 || userKarma.contestFinals > 0) && (
          <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700 flex items-center justify-center gap-1 text-xs">
            {userKarma.contestWins > 0 ? (
              <>
                <Crown className="h-3 w-3 text-yellow-500" />
                <span className="text-gray-700 dark:text-dark-300">
                  {userKarma.contestWins} {userKarma.contestWins === 1 ? 'victoria' : 'victorias'}
                </span>
              </>
            ) : (
              <>
                <Medal className="h-3 w-3 text-orange-500" />
                <span className="text-gray-700 dark:text-dark-300">
                  {userKarma.contestFinals} {userKarma.contestFinals === 1 ? 'vez finalista' : 'veces finalista'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa para perfil privado
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-dark-700 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                Tu Karma: <span className="text-primary-600 dark:text-primary-400">{userKarma.totalKarma}</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-300">
                Puntuación de participación en la comunidad
                {userKarma.isFromCache && (
                  <span className="block text-xs text-primary-600 dark:text-primary-400 mt-1">
                    🏆 Rankings se actualizan al finalizar retos
                  </span>
                )}
              </p>
            </div>
          </div>
          {userRanking && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400">
                <Trophy className="h-4 w-4" />
                Puesto #{userRanking.position}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-400">
                Top {userRanking.percentile}% de {userRanking.totalUsers} usuarios
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">

        {/* Desglose de actividades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Actividades principales */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-3 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-primary-500" />
              Actividades Principales
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Historias publicadas</span>
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {userKarma.totalStories} (+{userKarma.totalStories * KARMA_POINTS.STORY_PUBLISHED})
                </div>
              </div>

              {userKarma.contestWins > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Victorias en concursos</span>
                  </div>
                  <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {userKarma.contestWins} (+{userKarma.contestWins * KARMA_POINTS.CONTEST_WIN})
                  </div>
                </div>
              )}

              {userKarma.contestFinals > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Finales alcanzadas</span>
                  </div>
                  <div className="font-semibold text-orange-600 dark:text-orange-400">
                    {userKarma.contestFinals} (+{userKarma.contestFinals * KARMA_POINTS.CONTEST_FINALIST})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interacción comunitaria */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              Interacción Comunitaria
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Comentarios dados</span>
                </div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {userKarma.commentsGiven} (+{userKarma.commentsGiven * KARMA_POINTS.COMMENT_GIVEN})
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm">Comentarios recibidos</span>
                </div>
                <div className="font-semibold text-pink-600 dark:text-pink-400">
                  {userKarma.commentsReceived} (+{userKarma.commentsReceived * KARMA_POINTS.COMMENT_RECEIVED})
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Votos dados</span>
                </div>
                <div className="font-semibold text-purple-600 dark:text-purple-400">
                  {userKarma.votesGiven} (+{userKarma.votesGiven * KARMA_POINTS.VOTE_GIVEN})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consejos para mejorar karma */}
        {userKarma.totalKarma < 100 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Consejos para aumentar tu karma
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p>• Publica más historias para ganar +15 puntos cada una</p>
              <p>• Comenta las historias de otros (+2 puntos por comentario)</p>
              <p>• Participa votando en los concursos (+1 punto por voto)</p>
              <p>• ¡Intenta ganar un concurso para +75 puntos!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserKarmaSection;