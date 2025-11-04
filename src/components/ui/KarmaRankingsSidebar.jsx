import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Trophy,
  Zap,
  ChevronRight,
  PenTool,
  MessageCircle,
  MessageSquare,
  Heart,
  Vote,
  Crown,
  Medal,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useGlobalApp } from "../../contexts/GlobalAppContext";

// Sistema de karma adaptado para Letranido (mismo que KarmaRankings.jsx)
const KARMA_POINTS = {
  STORY_PUBLISHED: 15,
  LIKE_RECEIVED: 2,
  COMMENT_RECEIVED: 3, // Aumentado: recibir comentario vale más porque es más valioso
  COMMENT_GIVEN: 2, // Nuevo: dar comentario constructivo
  CONTEST_WIN: 75,
  CONTEST_FINALIST: 30,
  VOTE_GIVEN: 1,
  CONSECUTIVE_MONTHS: 10,
};

const KarmaRankingsSidebar = ({ isOpen, onClose }) => {
  const { currentContest, currentContestPhase } = useGlobalApp();
  const [allUsers, setAllUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const USERS_PER_BATCH = 5; // Cargar 5 usuarios cada vez para garantizar scroll

  useEffect(() => {
    if (isOpen) {
      loadCompactRankings();
    }
  }, [isOpen, currentContestPhase]);

  // Función para cargar más usuarios
  const loadMoreUsers = () => {
    if (loadingMore || displayedUsers.length >= allUsers.length) return;

    setLoadingMore(true);

    // Simular pequeño delay para UX suave
    setTimeout(() => {
      const currentCount = displayedUsers.length;
      const nextBatch = allUsers.slice(
        currentCount,
        currentCount + USERS_PER_BATCH
      );
      setDisplayedUsers((prev) => [...prev, ...nextBatch]);
      setLoadingMore(false);
    }, 300);
  };

  // Función para mostrar menos usuarios (volver a los primeros 5)
  const showLessUsers = () => {
    setDisplayedUsers(allUsers.slice(0, USERS_PER_BATCH));
  };

  const loadCompactRankings = async () => {
    setLoading(true);
    try {
      console.log("🔄 Cargando rankings desde cache...");

      // Intentar cargar desde cache primero
      const { data: cachedRankings, error: cacheError } = await supabase
        .from("cached_rankings")
        .select("*")
        .order("position", { ascending: true });

      if (cacheError) {
        console.warn(
          "⚠️ Error cargando rankings cached, fallback a cálculo en tiempo real:",
          cacheError
        );
        await loadRealTimeRankings();
        return;
      }

      if (cachedRankings && cachedRankings.length > 0) {
        console.log(
          "✅ Rankings cargados desde cache:",
          cachedRankings.length,
          "usuarios"
        );

        // Obtener metadata de la última actualización
        const { data: metadata, error: metadataError } = await supabase
          .from("ranking_metadata")
          .select("last_updated, contest_period, total_users")
          .eq("updated_by_admin", true)
          .order("last_updated", { ascending: false })
          .limit(1)
          .single();

        if (!metadataError && metadata) {
          setLastUpdated(metadata.last_updated);
          console.log("📅 Última actualización:", metadata.last_updated);
        }

        // 🎖️ Cargar badges de Ko-fi supporters
        // Filtrar IDs válidos (no null, no undefined, no strings "null")
        const userIds = cachedRankings
          .map((r) => r.user_id)
          .filter((id) => id && id !== "null" && id !== "undefined");

        console.log(
          "🔍 Cargando badges para",
          userIds.length,
          "usuarios válidos del ranking"
        );

        let badges = [];
        let badgesError = null;

        if (userIds.length > 0) {
          const result = await supabase
            .from("user_badges")
            .select("user_id, badge_id")
            .in("user_id", userIds)
            .eq("badge_id", "kofi_supporter");

          badges = result.data;
          badgesError = result.error;
        }

        if (badgesError) {
          console.warn("❌ Error loading badges:", badgesError);
        } else {
          console.log(
            "✅ Ko-fi supporters encontrados:",
            badges?.length || 0,
            badges
          );
        }

        const supporterIds = new Set(badges?.map((b) => b.user_id) || []);

        // Convertir formato de cache a formato del sidebar
        const formattedRankings = cachedRankings.map((ranking) => ({
          userId: ranking.user_id,
          author: ranking.user_name,
          totalKarma: ranking.total_karma,
          totalStories: ranking.total_stories,
          contestWins: ranking.contest_wins,
          votesGiven: ranking.votes_given,
          commentsGiven: ranking.comments_given,
          commentsReceived: ranking.comments_received,
          monthlyKarma: 0, // No calculamos karma mensual en cache por ahora
          isKofiSupporter: supporterIds.has(ranking.user_id), // 🎖️ Flag de supporter
        }));

        console.log(
          "👥 Usuarios con supporter flag:",
          formattedRankings
            .filter((u) => u.isKofiSupporter)
            .map((u) => u.author)
        );

        // Establecer todos los usuarios y mostrar los primeros
        setAllUsers(formattedRankings);
        setDisplayedUsers(formattedRankings.slice(0, USERS_PER_BATCH));
        setIsUsingCache(true);
      } else {
        console.log("📊 No hay rankings cached, calculando en tiempo real...");
        setIsUsingCache(false);
        await loadRealTimeRankings();
      }
    } catch (error) {
      console.error("❌ Error loading rankings:", error);
      // Fallback a cálculo en tiempo real
      await loadRealTimeRankings();
    } finally {
      setLoading(false);
    }
  };

  // Función fallback para cálculo en tiempo real (versión original)
  const loadRealTimeRankings = async () => {
    try {
      console.log("📊 Cargando rankings (fallback)...");

      // Obtener historias básicas
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select(
          `
          id,
          user_id,
          likes_count,
          contest_id,
          published_at
        `
        )
        .not("published_at", "is", null);

      if (storiesError) {
        console.error("Error loading stories for sidebar:", storiesError);
        throw storiesError;
      }

      // Obtener votos dados por usuarios PRIMERO - con bypass RLS para rankings
      let votes = null;
      let votesError = null;

      // Intentar usar función RPC que bypasea RLS
      try {
        const { data: rpcVotes, error: rpcError } = await supabase.rpc(
          "get_all_votes_for_rankings"
        );

        if (rpcError) {
          console.warn(
            "🔧 RPC function not available, using direct query (limited by RLS):",
            rpcError.code
          );
          // Fallback a consulta directa (limitada por RLS)
          const { data: directVotes, error: directError } = await supabase
            .from("votes")
            .select("user_id, created_at");
          votes = directVotes;
          votesError = directError;
        } else {
          votes = rpcVotes;
          votesError = null;
        }
      } catch (error) {
        console.warn("🔧 Error calling RPC function, using fallback:", error);
        const { data: directVotes, error: directError } = await supabase
          .from("votes")
          .select("user_id, created_at");
        votes = directVotes;
        votesError = directError;
      }

      if (votesError)
        console.warn("Error loading votes for sidebar:", votesError);

      // Obtener comentarios para karma de feedback
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("user_id, story_id, created_at")
        .not("user_id", "is", null)
        .not("story_id", "is", null);

      if (commentsError)
        console.warn("Error loading comments for sidebar:", commentsError);

      // Obtener información de usuarios para los nombres (incluye votantes, escritores y comentaristas)
      let usersData = [];
      if (
        (stories && stories.length > 0) ||
        (votes && votes.length > 0) ||
        (comments && comments.length > 0)
      ) {
        const storyUserIds = stories ? stories.map((s) => s.user_id) : [];
        const voteUserIds = votes ? votes.map((v) => v.user_id) : [];
        const commentUserIds = comments ? comments.map((c) => c.user_id) : [];
        const uniqueUserIds = [
          ...new Set([...storyUserIds, ...voteUserIds, ...commentUserIds]),
        ];

        // Cargar perfiles de usuario públicos
        let users = [];
        let usersError = null;

        // Intentar cargar los perfiles de múltiples formas
        try {
          // Intentar RPC function para bypass RLS
          const { data: rpcUsers, error: rpcError } = await supabase.rpc(
            "get_public_user_profiles",
            { user_ids: uniqueUserIds }
          );

          if (rpcError) {
            // Fallback 1: Consulta directa simple
            const { data: directUsers, error: directError } = await supabase
              .from("user_profiles")
              .select("id, display_name")
              .in("id", uniqueUserIds);

            if (directError) {
              // Fallback 2: Cargar todos los perfiles públicos (sin filtro)
              const { data: allUsers, error: allError } = await supabase
                .from("user_profiles")
                .select("id, display_name")
                .not("display_name", "is", null)
                .limit(1000);

              if (allError) {
                users = [];
                usersError = allError;
              } else {
                // Filtrar solo los usuarios que necesitamos
                users = (allUsers || []).filter((user) =>
                  uniqueUserIds.includes(user.id)
                );
              }
            } else {
              users = directUsers || [];
            }
          } else {
            users = rpcUsers || [];
          }
        } catch (error) {
          users = [];
          usersError = error;
        }

        if (usersError) {
          console.warn("Error loading user_profiles for sidebar:", usersError);
        } else {
          usersData = users || [];
        }
      }

      // Obtener información de retos por separado
      let contestsData = [];
      if (stories && stories.length > 0) {
        const { data: contests, error: contestsError } = await supabase
          .from("contests")
          .select("id, title, month, status, finalized_at, voting_deadline");

        if (!contestsError) {
          contestsData = contests || [];
        }
      }

      // Debug: verificar datos antes del cálculo
      console.log("🔍 Debug - Stories:", stories?.length || 0);
      console.log("🔍 Debug - Votes:", (votes || []).length);
      console.log("🔍 Debug - Comments:", (comments || []).length);
      console.log("🔍 Debug - UsersData:", usersData?.length || 0, usersData);

      // Calcular karma (versión simplificada)
      const userKarma = calculateUserKarmaCompact(
        stories,
        votes || [],
        comments || [],
        contestsData,
        usersData
      );

      // 🎖️ Cargar badges de Ko-fi supporters
      // Filtrar IDs válidos (no null, no undefined, no strings "null")
      const userIds = Object.keys(userKarma).filter(
        (id) => id && id !== "null" && id !== "undefined"
      );

      console.log(
        "🔍 [Fallback] Cargando badges para",
        userIds.length,
        "usuarios válidos del ranking"
      );

      let badges = [];
      let badgesError = null;

      if (userIds.length > 0) {
        const result = await supabase
          .from("user_badges")
          .select("user_id, badge_id")
          .in("user_id", userIds)
          .eq("badge_id", "kofi_supporter");

        badges = result.data;
        badgesError = result.error;
      }

      if (badgesError) {
        console.warn("❌ [Fallback] Error loading badges:", badgesError);
      } else {
        console.log(
          "✅ [Fallback] Ko-fi supporters encontrados:",
          badges?.length || 0,
          badges
        );
      }

      const supporterIds = new Set(badges?.map((b) => b.user_id) || []);

      // Ranking completo ordenado por karma
      const completeRanking = Object.values(userKarma)
        .filter((user) => user.totalKarma > 0) // Cualquier karma, no solo historias
        .map((user) => ({
          ...user,
          isKofiSupporter: supporterIds.has(user.userId), // 🎖️ Flag de supporter
        }))
        .sort((a, b) => b.totalKarma - a.totalKarma);

      console.log(
        "👥 [Fallback] Usuarios con supporter flag:",
        completeRanking.filter((u) => u.isKofiSupporter).map((u) => u.author)
      );

      // Establecer todos los usuarios y mostrar los primeros
      setAllUsers(completeRanking);
      setDisplayedUsers(completeRanking.slice(0, USERS_PER_BATCH));
      setIsUsingCache(false);
      setLastUpdated(null);
    } catch (error) {
      console.error("Error loading real-time rankings:", error);
      // En caso de error total, mostrar array vacío
      setAllUsers([]);
      setDisplayedUsers([]);
      setIsUsingCache(false);
      setLastUpdated(null);
    }
  };

  const calculateUserKarmaCompact = (
    stories,
    votes,
    comments,
    contests,
    users
  ) => {
    const userKarma = {};

    // Función para inicializar usuario
    const initializeUser = (userId) => {
      if (!userKarma[userId]) {
        const userProfile = users.find((u) => u.id === userId);
        const author = userProfile?.display_name || "Usuario Anónimo";

        userKarma[userId] = {
          userId,
          author,
          totalKarma: 0,
          monthlyKarma: 0,
          totalStories: 0,
          contestWins: 0,
          votesGiven: 0,
          commentsGiven: 0,
          commentsReceived: 0,
        };
      }
    };

    // PRIMERO: Procesar votos para crear usuarios que solo votan
    votes.forEach((vote) => {
      initializeUser(vote.user_id);
      userKarma[vote.user_id].votesGiven++;
      userKarma[vote.user_id].totalKarma += KARMA_POINTS.VOTE_GIVEN;

      // Karma mensual por votos
      const voteDate = new Date(vote.created_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (
        voteDate.getMonth() === currentMonth &&
        voteDate.getFullYear() === currentYear
      ) {
        userKarma[vote.user_id].monthlyKarma += KARMA_POINTS.VOTE_GIVEN;
      }
    });

    // SEGUNDO: Procesar comentarios para karma de feedback
    comments.forEach((comment) => {
      const commentAuthorId = comment.user_id;
      const storyAuthorId = stories.find(
        (s) => s.id === comment.story_id
      )?.user_id;

      // Karma para quien da el comentario
      if (commentAuthorId) {
        initializeUser(commentAuthorId);
        userKarma[commentAuthorId].commentsGiven++;
        userKarma[commentAuthorId].totalKarma += KARMA_POINTS.COMMENT_GIVEN;

        // Karma mensual por comentario dado
        const commentDate = new Date(comment.created_at);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        if (
          commentDate.getMonth() === currentMonth &&
          commentDate.getFullYear() === currentYear
        ) {
          userKarma[commentAuthorId].monthlyKarma += KARMA_POINTS.COMMENT_GIVEN;
        }
      }

      // Karma para quien recibe el comentario (autor de la historia)
      if (storyAuthorId && storyAuthorId !== commentAuthorId) {
        initializeUser(storyAuthorId);
        userKarma[storyAuthorId].commentsReceived++;
        userKarma[storyAuthorId].totalKarma += KARMA_POINTS.COMMENT_RECEIVED;

        // Karma mensual por comentario recibido
        const commentDate = new Date(comment.created_at);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        if (
          commentDate.getMonth() === currentMonth &&
          commentDate.getFullYear() === currentYear
        ) {
          userKarma[storyAuthorId].monthlyKarma +=
            KARMA_POINTS.COMMENT_RECEIVED;
        }
      }
    });

    // DESPUÉS: Procesar historias
    stories.forEach((story) => {
      const userId = story.user_id;
      initializeUser(userId);

      const userStats = userKarma[userId];

      // Karma básico por historia
      userStats.totalKarma += KARMA_POINTS.STORY_PUBLISHED;
      userStats.totalStories++;

      // Buscar información del reto
      const contest = contests.find((c) => c.id === story.contest_id);
      const canShowVotes =
        contest &&
        (contest.status === "results" ||
          (contest.status === "voting" && currentContestPhase === "voting"));

      if (canShowVotes && story.likes_count) {
        userStats.totalKarma += story.likes_count * KARMA_POINTS.LIKE_RECEIVED;
      }

      // Detectar ganadores
      if (contest?.status === "results") {
        const allContestStories = stories.filter(
          (s) => s.contest_id === story.contest_id
        );
        const sortedByVotes = allContestStories.sort(
          (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
        );
        const position = sortedByVotes.findIndex((s) => s.id === story.id) + 1;

        if (position === 1) {
          userStats.contestWins++;
          userStats.totalKarma += KARMA_POINTS.CONTEST_WIN;
        } else if (position <= 3) {
          userStats.totalKarma += KARMA_POINTS.CONTEST_FINALIST;
        }
      }

      // Karma mensual
      const storyDate = new Date(story.published_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (
        storyDate.getMonth() === currentMonth &&
        storyDate.getFullYear() === currentYear
      ) {
        userStats.monthlyKarma += KARMA_POINTS.STORY_PUBLISHED;
        if (canShowVotes && story.likes_count) {
          userStats.monthlyKarma +=
            story.likes_count * KARMA_POINTS.LIKE_RECEIVED;
        }
      }
    });

    return userKarma;
  };

  const CompactUserCard = ({ user, position }) => {
    const getMedalIcon = (pos) => {
      if (pos === 1) return "🥇";
      if (pos === 2) return "🥈";
      if (pos === 3) return "🥉";
      return pos;
    };

    return (
      <Link
        to={`/author/${user.userId}`}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer
          ${
            user.isKofiSupporter
              ? "bg-gradient-to-r from-pink-50/50 via-rose-50/30 to-red-50/50 dark:from-pink-900/10 dark:via-rose-900/10 dark:to-red-900/10 border border-pink-200/50 dark:border-pink-800/30 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md"
              : "hover:bg-gray-50 dark:hover:bg-dark-700"
          }
        `}
      >
        {/* Posición con medalla */}
        <div
          className={`
          w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
          ${
            position <= 3
              ? "bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-lg"
              : user.isKofiSupporter
                ? "bg-gradient-to-r from-pink-400 via-rose-500 to-red-500 text-white shadow-lg"
                : "bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-dark-300"
          }
        `}
        >
          {getMedalIcon(position)}
        </div>

        {/* Info del usuario - más limpia */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`
                font-semibold text-sm truncate transition-colors
                ${
                  user.isKofiSupporter
                    ? "text-pink-700 dark:text-pink-300 group-hover:text-pink-800 dark:group-hover:text-pink-200"
                    : "text-gray-900 dark:text-dark-100 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                }
              `}
              >
                {user.author}
              </span>
              {user.isKofiSupporter && (
                <span
                  className="text-xs inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700"
                  title="Ko-fi Supporter - Apoya a Letranido"
                >
                  ❤️
                </span>
              )}
              {user.contestWins > 0 && (
                <Trophy className="h-3 w-3 text-primary-500 dark:text-primary-400 flex-shrink-0" />
              )}
            </div>
            {/* Indicador visual de que es clickeable */}
            <ChevronRight
              className={`
              w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200
              ${user.isKofiSupporter ? "text-pink-500" : "text-gray-400 group-hover:text-primary-500"}
            `}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-dark-400 mt-1">
            <div className="flex items-center gap-1">
              <Zap
                className={`h-3 w-3 ${user.isKofiSupporter ? "text-pink-500 dark:text-pink-400" : "text-primary-500 dark:text-primary-400"}`}
              />
              <span
                className={`font-bold ${user.isKofiSupporter ? "text-pink-600 dark:text-pink-400" : "text-primary-600 dark:text-primary-400"}`}
              >
                {user.totalKarma}
              </span>
            </div>
            <span>
              {user.totalStories > 0
                ? `${user.totalStories} historias`
                : user.commentsGiven > 0
                  ? `${user.commentsGiven} comentarios`
                  : `${user.votesGiven || 0} votos`}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed left-0 top-0 h-full w-80 bg-white dark:bg-dark-800 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        border-r border-gray-200 dark:border-dark-600
      `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-600 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg shadow-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100">
                Karma Rankings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-dark-400" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300">
            Los escritores que más contribuyen a la comunidad
          </p>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600 dark:text-dark-300">
                Calculando karma...
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Header con contador total */}
              <div className="text-center pb-2 border-b border-gray-200 dark:border-dark-600">
                <p className="text-sm text-gray-600 dark:text-dark-300">
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {displayedUsers.length}
                  </span>
                  {displayedUsers.length < allUsers.length &&
                    ` de ${allUsers.length}`}{" "}
                  escritores
                </p>
                {/* Mostrar información de actualización */}
                {isUsingCache && lastUpdated && (
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                    🏆 Rankings actualizados al finalizar retos
                  </p>
                )}
                {!isUsingCache && (
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                    🏆 Rankings se actualizan al finalizar retos
                  </p>
                )}
              </div>

              {/* Ranking con scroll infinito */}
              <div className="space-y-1">
                {displayedUsers.length > 0 ? (
                  <>
                    {displayedUsers.map((user, index) => (
                      <CompactUserCard
                        key={user.userId}
                        user={user}
                        position={index + 1}
                      />
                    ))}

                    {/* Loading más usuarios */}
                    {loadingMore && (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500 dark:text-dark-400">
                          Cargando más escritores...
                        </p>
                      </div>
                    )}

                    {/* Botón Ver más/menos */}
                    {!loadingMore && (
                      <div className="p-4 text-center space-y-2">
                        {/* Botón Ver más */}
                        {displayedUsers.length < allUsers.length && (
                          <button
                            onClick={loadMoreUsers}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                          >
                            Ver más escritores
                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                              +
                              {Math.min(
                                USERS_PER_BATCH,
                                allUsers.length - displayedUsers.length
                              )}
                            </span>
                          </button>
                        )}

                        {/* Botón Ver menos (solo si hay más de los iniciales) */}
                        {displayedUsers.length > USERS_PER_BATCH && (
                          <button
                            onClick={showLessUsers}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                          >
                            Ver menos escritores
                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                              -{displayedUsers.length - USERS_PER_BATCH}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Mensaje cuando se cargaron todos */}
                    {!loadingMore &&
                      displayedUsers.length >= allUsers.length &&
                      allUsers.length > USERS_PER_BATCH && (
                        <div className="p-4 text-center border-t border-gray-200 dark:border-dark-600 mt-4">
                          <p className="text-xs text-gray-500 dark:text-dark-400">
                            🏆 ¡Has visto todos los escritores con karma!
                          </p>
                        </div>
                      )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-dark-400 text-center py-8">
                    ¡Sé el primero en aparecer aquí!
                  </p>
                )}
              </div>

              {/* Karma explanation */}
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                <h4 className="font-semibold text-primary-900 dark:text-primary-300 mb-2 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  ¿Cómo ganar karma?
                </h4>
                <div className="text-xs text-primary-800 dark:text-primary-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-3 w-3" />
                    <span>
                      Publicar historia: <strong>+15</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3 w-3" />
                    <span>
                      Dar comentario: <strong>+2</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    <span>
                      Recibir comentario: <strong>+3</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3 w-3" />
                    <span>
                      Recibir like: <strong>+2</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vote className="h-3 w-3" />
                    <span>
                      Votar: <strong>+1</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="h-3 w-3" />
                    <span>
                      Ganar reto: <strong>+75</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Medal className="h-3 w-3" />
                    <span>
                      Ser finalista: <strong>+30</strong>
                    </span>
                  </div>

                  {/* Ko-fi Supporter - Expandido con detalles */}
                  <div className="pt-2 mt-2 border-t border-primary-200 dark:border-primary-700">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 p-3 rounded-lg border border-pink-200 dark:border-pink-800">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700 flex-shrink-0 mt-0.5 text-xs">
                          ❤️
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-pink-700 dark:text-pink-300 mb-1">
                            Apoyar en Ko-fi: <strong>+50 karma</strong>
                          </div>
                        </div>
                      </div>
                      <p className="text-pink-800 dark:text-pink-200 leading-relaxed mb-3">
                        Los Ko-fi Supporters reciben un badge especial ❤️ junto
                        a su nombre en todo el sitio.
                      </p>

                      {/* CTA de donación */}
                      <a
                        href="https://ko-fi.com/letranido"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white text-xs font-semibold rounded-lg hover:from-pink-600 hover:via-rose-600 hover:to-red-600 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        <Heart className="h-3 w-3" />
                        <span>Apoyar a Letranido</span>
                      </a>
                      <p className="text-[10px] text-pink-700 dark:text-pink-400 mt-2 leading-tight">
                        Tu aporte ayuda a mantener el sitio en línea y mejorarlo
                        cada día
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default KarmaRankingsSidebar;
