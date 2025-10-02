// pages/StoryPage.jsx - COMPLETAMENTE REFACTORIZADO
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Eye,
  Clock,
  User,
  Calendar,
  PenTool,
  Trophy,
  Star,
  ChevronLeft,
  BookOpen,
  Award,
  Loader,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  useGoogleAnalytics,
  AnalyticsEvents,
} from "../hooks/useGoogleAnalytics";
// ✅ REMOVED: AuthModal ahora se maneja globalmente
import SimpleComments from "../components/comments/SimpleComments";
import CommentGuideModal from "../components/modals/CommentGuideModal";
import EnhancedVoteButton from "../components/voting/EnhancedVoteButton";
import VoteCounter from "../components/voting/VoteCounter";
import UserAvatar from "../components/ui/UserAvatar";
import { UserWithTopBadge } from "../components/ui/UserNameWithBadges";
import ProfileButton from "../components/ui/ProfileButton";
import SocialShareDropdown from "../components/ui/SocialShareDropdown";
import SEOHead from "../components/SEO/SEOHead";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { trackEvent } = useGoogleAnalytics();

  // ✅ TODO DESDE EL CONTEXTO GLOBAL
  const {
    // Auth state
    user,
    isAuthenticated,

    // App state
    initialized,
    globalLoading,
    galleryStories,
    currentContest,
    contests,

    // Auth Modal functions
    openAuthModal,

    // Functions
    getStoryById,
    recordStoryView,
    checkUserLike,
    canVoteInStory,
    toggleLike,
    getContestPhase,
  } = useGlobalApp();

  // ✅ LOCAL STATE SIMPLIFICADO
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [votingInfo, setVotingInfo] = useState({});
  // ✅ REMOVED: Modal local reemplazado por modal global del contexto
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showCommentGuide, setShowCommentGuide] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // Refs para control
  const loadingRef = useRef(false);
  const storyContentRef = useRef(null);


  // ✅ CARGAR HISTORIA Y DATOS RELACIONADOS
  useEffect(() => {
    const loadStoryData = async () => {
      if (!id || !initialized || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log("📖 Cargando historia:", id);

        // 1. Obtener la historia
        const storyResult = await getStoryById(id);

        if (!storyResult.success) {
          setError(storyResult.error);
          setStory(null);
          return;
        }

        const storyData = storyResult.story;
        
        // ✅ VERIFICAR ACCESO SEGÚN FASE DEL CONCURSO
        if (storyData.contest && storyData.contest_id && contests) {
          // Buscar el concurso específico de esta historia
          const storyContest = contests.find(c => c.id === storyData.contest_id);
          if (storyContest) {
            const contestPhase = getContestPhase(storyContest);
            console.log(`🔒 Verificando acceso - Historia: "${storyData.title}" - Concurso: ${storyContest.title} - Fase: ${contestPhase}`);
            
            // Bloquear acceso durante fase de envíos SOLO para usuarios que no son el autor
            if (contestPhase === 'submission' && storyData.user_id !== user?.id) {
              setError('Esta historia está en concurso activo y no se puede ver durante la fase de envíos.');
              setStory(null);
              return;
            }
          }
        }
        
        setStory(storyData);
        setLikesCount(storyData.likes_count || 0);

        console.log("✅ Historia cargada:", storyData.title);

        // 2. Verificar si el usuario ya votó por esta historia (solo si está autenticado)
        if (isAuthenticated && user?.id) {
          try {
            const likeResult = await checkUserLike(id);
            if (likeResult.success) {
              setIsLiked(likeResult.liked);
            }
          } catch (err) {
            console.warn("⚠️ Error verificando like:", err);
          }
        }

        // 3. Obtener información de votación (permisos)
        try {
          const votingResult = await canVoteInStory(id);
          console.log("🗳️ VotingInfo recibido:", votingResult);
          setVotingInfo(votingResult);
        } catch (err) {
          console.warn("⚠️ Error verificando permisos de votación:", err);
          setVotingInfo({
            canVote: false,
            reason: "Error verificando permisos",
          });
        }

        // 4. Registrar vista (después de un momento para asegurar que se cargó)
        if (!viewRecorded) {
          setTimeout(async () => {
            try {
              await recordStoryView(id);
              setViewRecorded(true);
              console.log("👁️ Vista registrada para historia:", id);
            } catch (err) {
              console.warn("⚠️ Error registrando vista:", err);
            }
          }, 2000); // 2 segundos para asegurar que leyó algo
        }
      } catch (err) {
        console.error("💥 Error general cargando historia:", err);
        setError("Error inesperado: " + err.message);
        setStory(null);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadStoryData();
  }, [
    id,
    initialized,
    getStoryById,
    checkUserLike,
    canVoteInStory,
    recordStoryView,
    // ✅ REMOVED isAuthenticated y user?.id - CAUSABAN RELOAD DURANTE ERRORES DE AUTH
    // La verificación de autenticación se hace dentro del useEffect condicionalmente
  ]);

  // ✅ USEEFFECT SEPARADO PARA CAMBIOS EN AUTENTICACIÓN (evita reload completo)
  useEffect(() => {
    const updateAuthData = async () => {
      if (!story || !initialized) return;

      // Solo actualizar datos de autenticación si la historia ya está cargada
      if (isAuthenticated && user?.id) {
        try {
          const likeResult = await checkUserLike(story.id);
          if (likeResult.success) {
            console.log(
              "🔄 Actualizando isLiked en StoryPage:",
              likeResult.liked
            );
            setIsLiked(likeResult.liked);
          }
        } catch (error) {
          console.error("Error checking user like:", error);
        }
      } else {
        setIsLiked(false);
      }
    };

    updateAuthData();
  }, [isAuthenticated, user?.id, story?.id, checkUserLike, initialized]);

  // ✅ ACTUALIZAR STORY LOCAL CUANDO CAMBIE GALLERYSTORIES (para views_count)
  useEffect(() => {
    if (story && galleryStories.length > 0) {
      const updatedStory = galleryStories.find((s) => s.id === story.id);
      if (updatedStory && updatedStory.views_count !== story.views_count) {
        console.log(
          `🔄 Actualizando views_count en StoryPage: ${story.views_count} → ${updatedStory.views_count}`
        );
        setStory((prev) => ({
          ...prev,
          views_count: updatedStory.views_count,
        }));
      }
    }
  }, [galleryStories, story?.id, story?.views_count]);

  // ✅ HANDLE VOTE
  const handleVote = async () => {
    if (!isAuthenticated) {
      openAuthModal("register");
      return;
    }

    if (!votingInfo.canVote) {
      console.log("❌ No se puede votar:", votingInfo.reason);
      return;
    }

    try {
      const result = await toggleLike(id);

      if (result.success) {
        // Actualizar estado local inmediatamente
        setIsLiked(result.liked);
        setLikesCount((prev) => {
          const newCount = prev + (result.liked ? 1 : -1);
          return Math.max(0, newCount);
        });

        // Track analytics del like
        trackEvent(AnalyticsEvents.STORY_LIKED, {
          story_id: id,
          contest_id: story?.contest_id,
          story_title: story?.title,
          author_id: story?.user_id,
          liked: result.liked,
          total_likes: likesCount + (result.liked ? 1 : -1),
        });

        console.log(
          `${result.liked ? "❤️" : "💔"} Like ${
            result.liked ? "agregado" : "removido"
          }`
        );
      } else {
        console.error("❌ Error voting:", result.error);
        // Si es error de sesión, mostrar mensaje específico
        if (result.error.includes("Sesión expirada")) {
          alert(result.error);
        } else {
          alert("Error al procesar el voto: " + result.error);
        }
      }
    } catch (err) {
      console.error("💥 Error inesperado al votar:", err);
      alert("Error inesperado al votar");
    }
  };

  // ✅ SHARE FUNCTIONALITY
  // Generar datos para compartir la historia específica
  const getShareData = () => {
    if (!story) return null;

    // No permitir compartir historias en fase de submission (aún ocultas)
    if (story.contest_id) {
      const contestPhase = currentContest
        ? getContestPhase(currentContest)
        : null;
      if (contestPhase === "submission") {
        return null; // Historia aún no es pública
      }
    }

    // URL de la historia específica
    const storyUrl = `${window.location.origin}/story/${story.id}`;

    // Mensaje genérico y limpio
    return {
      title: `"${story.title}" - Letranido`,
      text: `📖 "${story.title}" por ${story.author?.display_name || story.author?.name}\n\n✨ Lee esta historia en Letranido:`,
      url: storyUrl,
    };
  };

  // ✅ UTILITY FUNCTIONS
  const getReadingTime = (wordCount) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const formatStoryContent = (content) => {
    if (!content) return "";

    // Si el contenido ya tiene HTML (de Quill), devolverlo directamente
    if (content.includes("<p>") || content.includes("<div>")) {
      return content;
    }

    // Si contiene otros tags HTML o markdown, procesarlo
    if (content.includes("<") || content.includes("*")) {
      return content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .split("\n\n")
        .filter((paragraph) => paragraph.trim())
        .map((paragraph) => `<p>${paragraph.trim().replace(/\n/g, "<br>")}</p>`)
        .join("");
    }

    // Si es texto plano (formato anterior), convertir a párrafos
    return content
      .split("\n\n")
      .filter((paragraph) => paragraph.trim())
      .map((paragraph) => `<p>${paragraph.trim().replace(/\n/g, "<br>")}</p>`)
      .join("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
    });
  };

  // ✅ LOADING STATE
  if (!initialized || globalLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600 dark:text-dark-300">
            Cargando historia...
          </p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">
            Historia no encontrada
          </h2>
          <p className="text-gray-600 dark:text-dark-300 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/contest/current")}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </button>
            <Link to="/gallery" className="btn-primary">
              <BookOpen className="h-4 w-4 mr-2" />
              Explorar historias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NO STORY STATE
  if (!story) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">
            Historia no disponible
          </h2>
          <p className="text-gray-600 dark:text-dark-300 mb-6">
            Esta historia puede haber sido eliminada o no está disponible.
          </p>
          <Link to="/gallery" className="btn-primary">
            Explorar otras historias
          </Link>
        </div>
      </div>
    );
  }

  // ✅ RENDER PRINCIPAL
  return (
    <>
      <SEOHead
        title={story?.title || "Historia"}
        description={
          story?.story
            ? `"${story.story.replace(/<[^>]*>/g, "").substring(0, 140)}..." - Historia de ${story.author?.display_name || "un escritor"} para el reto "${story.contest?.title || "creativo"}" en Letranido.`
            : "Lee esta historia creativa de nuestra comunidad de escritores en Letranido. Descubre nuevas voces y talentos literarios."
        }
        keywords={`${story?.title?.split(" ").slice(0, 3).join(", ") || "historia"}, ${story?.contest?.title || "escritura creativa"}, ${story?.author?.display_name || "autor"}, reto literario, ficción, letranido`}
        url={`/story/${id}`}
        canonicalUrl={`https://letranido.com/story/${id}`}
        type="article"
        author={story?.author?.display_name}
        publishedTime={story?.created_at}
        modifiedTime={story?.updated_at}
      />

      {/* Structured Data for Story */}
      {story && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: story.title,
            author: {
              "@type": "Person",
              name: story.author?.display_name || story.author,
              url: `https://letranido.com/profile/${story.user_id}`,
            },
            publisher: {
              "@type": "Organization",
              name: "Letranido",
              logo: {
                "@type": "ImageObject",
                url: "https://letranido.com/letranido-logo.png",
              },
            },
            description:
              story.story?.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
            text: story.story?.replace(/<[^>]*>/g, ""),
            wordCount: story.word_count,
            datePublished: story.created_at,
            dateModified: story.updated_at || story.created_at,
            genre: "Fiction",
            inLanguage: "es",
            isPartOf: {
              "@type": "Contest",
              name: story.contest?.title,
              description: story.contest?.description,
            },
            interactionStatistic: [
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/LikeAction",
                userInteractionCount: story.likes_count || 0,
              },
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/ViewAction",
                userInteractionCount: story.views || 0,
              },
            ],
            url: `https://letranido.com/story/${story.id}`,
            mainEntityOfPage: `https://letranido.com/story/${story.id}`,
          })}
        </script>
      )}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              // Usar historial del navegador para volver a la página anterior
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                // Fallback solo si no hay historial (usuario llegó directo por URL)
                navigate("/");
              }
            }}
            className="flex items-center text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver
          </button>

          <div className="flex items-center gap-2">
            {/* Botón compartir se movió al lado de likes y vistas */}
          </div>
        </div>

        {/* Story Header */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden">
          {/* Contest Banner */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  Reto de {story.contest.month} - {story.contest.category}
                </span>
              </div>

              <Link
                to={`/contest/${story.contest_id}`}
                className="text-primary-100 hover:text-white dark:text-primary-200 dark:hover:text-white text-sm flex items-center"
              >
                Ver reto
                <ExternalLink className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Winner Banner - Solo para historias ganadoras de retos finalizados */}
          {story.is_winner && story.winner_position && (
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 dark:from-yellow-600 dark:via-yellow-700 dark:to-amber-700 p-6 text-center shadow-lg">
              <div className="flex items-center justify-center gap-3 text-white">
                {story.winner_position === 1 && (
                  <>
                    <Trophy className="h-6 w-6" />
                    <span className="text-lg font-bold drop-shadow-sm">
                      🏆 Historia Ganadora del Reto de {story.contest.month}
                    </span>
                    <Trophy className="h-6 w-6" />
                  </>
                )}
                {story.winner_position === 2 && (
                  <>
                    <Award className="h-6 w-6" />
                    <span className="text-lg font-bold drop-shadow-sm">
                      🥈 Segundo Lugar - Reto de {story.contest.month}
                    </span>
                    <Award className="h-6 w-6" />
                  </>
                )}
                {story.winner_position === 3 && (
                  <>
                    <Star className="h-6 w-6" />
                    <span className="text-lg font-bold drop-shadow-sm">
                      🥉 Tercer Lugar - Reto de {story.contest.month}
                    </span>
                    <Star className="h-6 w-6" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main Header */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-6 leading-tight">
              {story.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="mr-4">
                  <UserAvatar user={story.author} size="lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-dark-100 text-lg">
                    <UserWithTopBadge
                      userId={story.user_id}
                      userName={story.author.name}
                    />
                  </h3>
                </div>
              </div>
              <ProfileButton 
                userId={story.user_id} 
                size="md" 
                variant="primary" 
                showText={true} 
                className="flex-shrink-0"
              />
            </div>

            {/* Story Stats - Debajo del usuario, victorias y votos primero */}
            {(() => {
              // Determinar fase del reto para mostrar/ocultar estadísticas
              const isCurrentContest = story.contest_id === currentContest?.id;
              const contestToCheck = isCurrentContest ? currentContest : story.contest;
              const contestPhase = contestToCheck ? getContestPhase(contestToCheck) : null;
              const isVotingOrCounting = contestPhase === "voting" || contestPhase === "counting";

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-sm mb-6">
                  {/* Victorias del autor - PRIMERO, oculto durante votación */}
                  {!isVotingOrCounting && story.author?.wins > 0 && (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 px-3 py-2 rounded-lg">
                      <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-dark-200 font-medium">
                        {story.author.wins} victorias
                      </span>
                    </div>
                  )}
                  
                  {/* Votos - SEGUNDO, oculto durante votación */}
                  {!isVotingOrCounting && (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 px-3 py-2 rounded-lg">
                      <Heart className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-dark-200 font-medium">
                        {likesCount} votos
                      </span>
                    </div>
                  )}
                  
                  {/* Tiempo de lectura - siempre visible */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 px-3 py-2 rounded-lg">
                    <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-dark-200 font-medium">
                      {getReadingTime(story.word_count)} min
                    </span>
                  </div>
                  
                  {/* Palabras - siempre visible */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 px-3 py-2 rounded-lg">
                    <PenTool className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-dark-200 font-medium">
                      {story.word_count.toLocaleString()} palabras
                    </span>
                  </div>
                  
                  {/* Fecha - siempre visible */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 px-3 py-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-dark-200 font-medium">
                      {formatDate(story.created_at)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Mature Content Warning */}
            {story.is_mature && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-300 mb-1">
                      Contenido para adultos (18+)
                    </h4>
                    <p className="text-red-700 dark:text-red-400 text-sm">
                      Esta historia contiene temas maduros. La discreción del
                      lector es aconsejada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Voting Section */}
            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="space-y-3">
                {/* Determinar si estamos en fase de votación */}
                {(() => {
                  // Usar currentContest si es el reto actual, sino usar story.contest
                  const isCurrentContest = story.contest_id === currentContest?.id;
                  const contestToCheck = isCurrentContest ? currentContest : story.contest;
                  const contestPhase = contestToCheck ? getContestPhase(contestToCheck) : null;
                  const isVotingOrCounting = contestPhase === "voting" || contestPhase === "counting";

                  if (isVotingOrCounting) {
                    // Durante votación: ocultar votos y vistas
                    return (
                      <>
                        {/* Botón de voto - full width */}
                        <EnhancedVoteButton
                          isLiked={isLiked}
                          likesCount={0} // Ocultar conteo durante votación
                          canVote={votingInfo.canVote}
                          votingInfo={votingInfo}
                          isAuthenticated={isAuthenticated}
                          onVote={handleVote}
                          onAuthRequired={() => openAuthModal("register")}
                          size="default"
                          hideCount={true} // Ocultar el número durante votación y counting
                          isPortfolioStory={!story?.contest_id} // Historia libre si no tiene contest_id
                          fullWidth={true} // Full width para más prominencia
                        />

                        {/* Texto explicativo */}
                        <div className="text-center sm:text-left text-green-600 dark:text-green-400 text-sm">
                          <span>
                            🗳️ Tu voto es privado - solo tú puedes verlo
                          </span>
                        </div>

                        {/* Contador de votos y compartir */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {/* Contador de votos restantes */}
                          <VoteCounter
                            contestId={story.contest_id}
                            className=""
                          />

                          {/* Compartir - Forzado a la derecha */}
                          {getShareData() && (
                            <div className="sm:ml-auto">
                              <SocialShareDropdown
                                shareData={getShareData()}
                                size="default"
                                variant="story"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    );
                  } else {
                    // Solo en resultados: mostrar votos y vistas normalmente
                    return (
                      <>
                        {/* Botón de voto - full width */}
                        <EnhancedVoteButton
                          isLiked={isLiked}
                          likesCount={likesCount}
                          canVote={votingInfo.canVote}
                          votingInfo={votingInfo}
                          isAuthenticated={isAuthenticated}
                          onVote={handleVote}
                          onAuthRequired={() => openAuthModal("register")}
                          size="default"
                          isPortfolioStory={!story?.contest_id} // Historia libre si no tiene contest_id
                          fullWidth={true} // Full width para más prominencia
                        />

                        {/* Información de vistas y compartir - Solo mostrar en resultados */}
                        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                          {contestPhase === "results" && (
                            <div className="text-center sm:text-left text-gray-600 dark:text-dark-300 text-xs flex items-center">
                              <Eye className="h-5 w-5 mr-2" />
                              <span>{story.views_count || 0} vistas</span>
                            </div>
                          )}

                          {/* Compartir - Forzado a la derecha en desktop */}
                          {getShareData() && (
                            <div className="sm:ml-auto">
                              <SocialShareDropdown
                                shareData={getShareData()}
                                size="default"
                                variant="story"
                              />
                            </div>
                          )}
                        </div>

                        {/* Contador de votos - Solo si aplica */}
                        <VoteCounter
                          contestId={story.contest_id}
                          className=""
                        />
                      </>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-8">
          <div
            ref={storyContentRef}
            className="prose prose-lg max-w-none story-content"
            style={{
              fontSize: "18px",
              lineHeight: "1.7",
              fontFamily: '"Crimson Text", "Times New Roman", serif',
            }}
            dangerouslySetInnerHTML={{
              __html: formatStoryContent(story.content),
            }}
          />

          <style
            dangerouslySetInnerHTML={{
              __html: `
            .story-content p {
              margin: 0;
              color: ${isDark ? "#d1d5db" : "#374151"};
              text-align: justify;
              line-height: 1.7;
            }

            .story-content p:empty {
              height: 1.7em;
            }

            .story-content em {
              font-style: italic;
              color: ${isDark ? "#9ca3af" : "#4b5563"};
            }

            .story-content strong {
              font-weight: 600;
              color: ${isDark ? "#f9fafb" : "#1f2937"};
            }
          `,
            }}
          />

          {/* Story Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-600">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600 dark:text-dark-300 text-sm mb-2">
                  Esta historia participó en el reto{" "}
                  <strong>"{story.contest.title}"</strong>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-dark-400">
                  <span>{formatDate(story.created_at)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{story.word_count.toLocaleString()} palabras</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{getReadingTime(story.word_count)} min lectura</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botón de voto en el footer - también ocultar conteo durante votación */}
                {(() => {
                  // Usar currentContest si es el reto actual, sino usar story.contest
                  const isCurrentContest = story.contest_id === currentContest?.id;
                  const contestToCheck = isCurrentContest ? currentContest : story.contest;
                  const contestPhase = contestToCheck ? getContestPhase(contestToCheck) : null;
                  const isVotingOrCounting = contestPhase === "voting" || contestPhase === "counting";

                  return (
                    <EnhancedVoteButton
                      isLiked={isLiked}
                      likesCount={isVotingOrCounting ? 0 : likesCount} // Ocultar conteo durante votación y counting
                      canVote={votingInfo.canVote}
                      votingInfo={votingInfo}
                      isAuthenticated={isAuthenticated}
                      onVote={handleVote}
                      onAuthRequired={() => openAuthModal("register")}
                      size="large"
                      showTooltip={false}
                      hideCount={isVotingOrCounting} // Prop para ocultar el número durante votación y counting
                      isPortfolioStory={!story?.contest_id} // Historia libre si no tiene contest_id
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-600 dark:text-dark-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                Comentarios ({commentsCount})
              </h3>
            </div>

            <button
              onClick={() => setShowCommentGuide(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
              title="Ver guía para comentarios constructivos"
            >
              <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
              Guía de comentarios
            </button>
          </div>

          <SimpleComments
            storyId={story.id}
            storyTitle={story.title}
            contestId={story.contest_id}
            onCommentsCountChange={setCommentsCount}
          />
        </div>

        {/* Related Actions */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4">
            ¿Qué hacer ahora?
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to={`/contest/${story.contest.id}`}
              className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
            >
              <div className="flex items-center mb-2">
                <Trophy className="h-5 w-5 text-primary-600 mr-2" />
                <span className="font-medium text-primary-900 dark:text-primary-300">
                  Ver más historias del reto
                </span>
              </div>
              <p className="text-primary-700 dark:text-primary-400 text-sm">
                Descubre más historias del reto de {story.contest.month}
              </p>
            </Link>

            <Link
              to="/gallery"
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
            >
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900 dark:text-green-300">
                  Explorar galería
                </span>
              </div>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Lee más historias increíbles de nuestra comunidad
              </p>
            </Link>

            {/* Enlace al reto actual si esta historia es de un reto cerrado */}
            {story?.contest?.status === "results" && (
              <Link
                to="/contest/current"
                className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
              >
                <div className="flex items-center mb-2">
                  <Trophy className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-900 dark:text-purple-300">
                    Ver reto actual
                  </span>
                </div>
                <p className="text-purple-700 dark:text-purple-400 text-sm">
                  Participa en el reto activo de este mes
                </p>
              </Link>
            )}

            {isAuthenticated &&
              story?.contest?.submission_deadline &&
              new Date() <= new Date(story.contest.submission_deadline) && (
                <Link
                  to="/write"
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                >
                  <div className="flex items-center mb-2">
                    <PenTool className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900 dark:text-blue-300">
                      Escribir mi historia
                    </span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    ¿Te inspiraste? Crea tu propia historia
                  </p>
                </Link>
              )}
          </div>
        </div>

        {/* Comment Guide Modal */}
        <CommentGuideModal
          isOpen={showCommentGuide}
          onClose={() => setShowCommentGuide(false)}
        />

        {/* ✅ Auth Modal ahora se maneja globalmente en Layout.jsx */}
      </div>
    </>
  );
};

export default StoryPage;
