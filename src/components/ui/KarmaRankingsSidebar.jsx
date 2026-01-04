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
  Calendar,
  BookOpen,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useGlobalApp } from "../../contexts/GlobalAppContext";

// 💾 Cache en localStorage para rankings (persiste entre sesiones)
// Los rankings se actualizan manualmente ~1 vez al mes después de cerrar retos
// Usamos el timestamp de last_updated de BD como "versión" del cache
const CACHE_KEY = "letranido_rankings_cache";
const CACHE_VERSION_KEY = "letranido_rankings_version";

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
  const { currentContestPhase, contests, getStoriesByContest } = useGlobalApp();
  const [allUsers, setAllUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const USERS_PER_BATCH = 5; // Cargar 5 usuarios cada vez para garantizar scroll

  // 🆕 Estados para nuevas secciones
  const [recentWinners, setRecentWinners] = useState([]);
  const [recentContests, setRecentContests] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCompactRankings();
      loadDiscoveryContent();
      // 📱 Bloquear scroll del body cuando el sidebar está abierto (mobile fix)
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";
    } else {
      // Restaurar scroll cuando se cierra
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [isOpen, currentContestPhase]);

  // 🖱️ Cerrar al hacer click fuera del sidebar (desktop)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Verificar si el click fue fuera del sidebar
      const sidebar = document.getElementById("karma-sidebar");
      if (sidebar && !sidebar.contains(event.target)) {
        onClose();
      }
    };

    // Agregar listener después de un pequeño delay para evitar que se cierre inmediatamente
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  // 🆕 Función para cargar contenido de descubrimiento (ganadores y retos recientes)
  const loadDiscoveryContent = async () => {
    setLoadingDiscovery(true);
    try {
      // 1️⃣ Obtener últimos 5 retos finalizados
      const finishedContests = contests
        .filter((contest) => contest.status === "results")
        .sort(
          (a, b) =>
            new Date(b.finalized_at || b.voting_deadline) -
            new Date(a.finalized_at || a.voting_deadline)
        )
        .slice(0, 5);

      setRecentContests(finishedContests);

      // 2️⃣ Obtener ganador (1er lugar) de cada reto reciente
      const winnersPromises = finishedContests.map(async (contest) => {
        try {
          const result = await getStoriesByContest(contest.id);

          if (result.success && result.stories.length > 0) {
            // Ordenar por votos y fecha (mismo criterio que landing)
            const sortedStories = result.stories.sort((a, b) => {
              const likesA = a.likes_count || 0;
              const likesB = b.likes_count || 0;
              if (likesB !== likesA) return likesB - likesA;

              // En empate, por fecha (más antigua primero)
              return new Date(a.created_at) - new Date(b.created_at);
            });

            const winner = sortedStories[0];
            return {
              contestId: contest.id,
              contestMonth: contest.month,
              contestTitle: contest.title,
              storyId: winner.id,
              storyTitle: winner.title,
              author: winner.author,
              userId: winner.user_id,
              likesCount: winner.likes_count || 0,
            };
          }
          return null;
        } catch (error) {
          console.error(
            `Error loading winner for contest ${contest.id}:`,
            error
          );
          return null;
        }
      });

      const winners = (await Promise.all(winnersPromises)).filter(Boolean);
      setRecentWinners(winners);
    } catch (error) {
      console.error("Error loading discovery content:", error);
      setRecentContests([]);
      setRecentWinners([]);
    } finally {
      setLoadingDiscovery(false);
    }
  };

  const loadCompactRankings = async () => {
    setLoading(true);
    try {
      // 1️⃣ Verificar versión actual en BD (solo metadata, query muy rápida)
      const { data: metadata } = await supabase
        .from("ranking_metadata")
        .select("last_updated")
        .eq("updated_by_admin", true)
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentVersion = metadata?.last_updated;

      // 2️⃣ Verificar cache en localStorage
      const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);

      // 3️⃣ Si la versión coincide y hay datos, usar cache (SIN llamadas a BD)
      if (currentVersion && cachedVersion === currentVersion && cachedData) {
        console.log(
          "⚡ Usando cache localStorage (versión válida, sin llamadas a BD)"
        );
        const parsed = JSON.parse(cachedData);
        setAllUsers(parsed.users);
        setDisplayedUsers(parsed.users.slice(0, USERS_PER_BATCH));
        setLastUpdated(currentVersion);
        setIsUsingCache(true);
        setLoading(false);
        return;
      }

      // 4️⃣ Cache inválido o no existe: cargar desde BD
      console.log("🔄 Cache inválido o inexistente, cargando desde BD...");

      // 🚀 Queries en paralelo
      const [rankingsResult, badgesResult] = await Promise.all([
        // Rankings
        supabase
          .from("cached_rankings")
          .select("*")
          .order("position", { ascending: true }),

        // Ko-fi badges
        supabase
          .from("user_badges")
          .select("user_id")
          .eq("badge_id", "kofi_supporter"),
      ]);

      const { data: cachedRankings, error: cacheError } = rankingsResult;

      // Fallback si hay error
      if (cacheError || !cachedRankings || cachedRankings.length === 0) {
        console.warn("⚠️ Error o cache vacío, usando fallback");
        await loadRealTimeRankings();
        return;
      }

      console.log(
        "✅ Datos cargados desde BD:",
        cachedRankings.length,
        "usuarios"
      );

      // Ko-fi supporters
      const supporterIds = new Set(
        (badgesResult.data || []).map((b) => b.user_id)
      );

      // Formatear rankings
      const formattedRankings = cachedRankings.map((ranking) => ({
        userId: ranking.user_id,
        author: ranking.user_name,
        totalKarma: ranking.total_karma,
        totalStories: ranking.total_stories,
        contestWins: ranking.contest_wins,
        votesGiven: ranking.votes_given,
        commentsGiven: ranking.comments_given,
        commentsReceived: ranking.comments_received,
        monthlyKarma: 0,
        isKofiSupporter: supporterIds.has(ranking.user_id),
      }));

      // 5️⃣ Guardar en localStorage con nueva versión
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ users: formattedRankings })
        );
        localStorage.setItem(CACHE_VERSION_KEY, currentVersion || "v1");
        console.log(
          "💾 Cache guardado en localStorage (versión:",
          currentVersion || "v1",
          ")"
        );
      } catch (e) {
        console.warn("⚠️ No se pudo guardar en localStorage:", e);
      }

      // Establecer datos
      setAllUsers(formattedRankings);
      setDisplayedUsers(formattedRankings.slice(0, USERS_PER_BATCH));
      setLastUpdated(currentVersion);
      setIsUsingCache(true);
    } catch (error) {
      console.error("❌ Error loading rankings:", error);
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

      // Karma para quien da el comentario (solo si NO es auto-comentario)
      if (commentAuthorId && commentAuthorId !== storyAuthorId) {
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

  // 🆕 Componente para mostrar ganador reciente
  const RecentWinnerCard = ({ winner }) => {
    return (
      <div className="group">
        <Link
          to={`/story/${winner.storyId}`}
          className="block p-3 rounded-lg bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200/50 dark:border-yellow-800/30 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-md transition-all duration-200"
        >
          {/* Título de la historia */}
          <h4 className="text-sm font-bold text-gray-900 dark:text-dark-100 mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {winner.storyTitle}
          </h4>

          {/* Autor y votos */}
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-dark-400">
            <span className="truncate">{winner.author}</span>
            <div className="flex items-center gap-1 shrink-0">
              <Heart className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                {winner.likesCount}
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // 🆕 Componente para mostrar reto reciente
  const RecentContestCard = ({ contest }) => {
    return (
      <Link
        to={`/contest/${contest.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors duration-200 group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-800 dark:to-indigo-800 flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {contest.month}
          </div>
          <div className="text-xs text-gray-600 dark:text-dark-400 truncate group-hover:text-gray-900 dark:group-hover:text-dark-200 transition-colors">
            {contest.title}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
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
      {/* Overlay - Click afuera cierra el sidebar (solo mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        id="karma-sidebar"
        className={`
        fixed left-0 top-0 h-full w-80 bg-white dark:bg-dark-800 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        border-r border-gray-200 dark:border-dark-600
        flex flex-col overflow-hidden
      `}
      >
        {/* Header - compacto en mobile */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-600 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-100">
                Descubrir
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-dark-400" />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-300">
            Historias destacadas, retos y rankings
          </p>
        </div>

        {/* Content - scroll solo en esta área */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
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
              {/* 🆕 SECCIÓN: RECENT WINNERS */}
              {!loadingDiscovery && recentWinners.length > 0 && (
                <div className="pb-4 border-b border-gray-200 dark:border-dark-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100">
                      Historias Destacadas
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {recentWinners.slice(0, 4).map((winner) => (
                      <RecentWinnerCard key={winner.storyId} winner={winner} />
                    ))}
                  </div>
                </div>
              )}

              {/* 🆕 SECCIÓN: RECENT CONTESTS */}
              {!loadingDiscovery && recentContests.length > 0 && (
                <div className="pb-4 border-b border-gray-200 dark:border-dark-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100">
                      Retos Recientes
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {recentContests.map((contest) => (
                      <RecentContestCard key={contest.id} contest={contest} />
                    ))}
                  </div>
                  <Link
                    to="/contest-history"
                    className="mt-3 flex items-center justify-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Ver todos los retos
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* 🏆 SECCIÓN: KARMA RANKINGS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary-600 dark:text-primary-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100">
                    Ranking de Karma
                  </h3>
                </div>
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
                      Recibir voto: <strong>+2</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vote className="h-3 w-3" />
                    <span>
                      Dar voto: <strong>+1</strong>
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
