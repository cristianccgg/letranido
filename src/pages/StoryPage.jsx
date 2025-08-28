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
import { useReadingAnalytics } from "../hooks/useReadingAnalytics";
import { useGoogleAnalytics, AnalyticsEvents } from "../hooks/useGoogleAnalytics";
// ✅ REMOVED: AuthModal ahora se maneja globalmente
import SimpleComments from "../components/comments/SimpleComments";
import CommentGuideModal from "../components/modals/CommentGuideModal";
import EnhancedVoteButton from "../components/voting/EnhancedVoteButton";
import VoteCounter from "../components/voting/VoteCounter";
import UserAvatar from "../components/ui/UserAvatar";
import { UserWithTopBadge } from "../components/ui/UserNameWithBadges";
import ShareDropdown from "../components/ui/ShareDropdown";
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
    userStories,
    currentContest,

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
  
  // ✅ READING ANALYTICS
  const readingAnalytics = useReadingAnalytics(
    story?.id,
    story?.title,
    story?.word_count,
    story?.contest_id
  );

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
        alert("Error al procesar el voto: " + result.error);
      }
    } catch (err) {
      console.error("💥 Error inesperado al votar:", err);
      alert("Error inesperado al votar");
    }
  };

  // ✅ SHARE FUNCTIONALITY
  // Generar datos para compartir
  const getShareData = () => {
    if (!story?.contest) return null;

    // Verificar si el usuario participó en este concurso
    const userParticipated = userStories.some(
      (userStory) => userStory.contest_id === story.contest.id
    );

    // URL del concurso (no de la historia específica)
    const contestUrl = `${window.location.origin}/contest/${story.contest.id}`;

    // Generar texto según si el usuario participó o no
    return userParticipated
      ? {
          title: `Letranido - ${story.contest.title}`,
          text: `¡Participé con mi historia en el concurso "${story.contest.title}" en Letranido! ✍️\n📚 Únete como escritor y comparte tu historia\n🚀 Participa en:`,
          url: contestUrl,
        }
      : {
          title: `Letranido - ${story.contest.title}`,
          text: `📝 ¡Descubre historias increíbles en Letranido!\n🎯 Concurso activo: "${story.contest.title}"\n✍️ Únete como escritor:`,
          url: contestUrl,
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
            ? `"${story.story.replace(/<[^>]*>/g, "").substring(0, 140)}..." - Historia de ${story.author?.display_name || "un escritor"} para el concurso "${story.contest?.title || "creativo"}" en Letranido.`
            : "Lee esta historia creativa de nuestra comunidad de escritores en Letranido. Descubre nuevas voces y talentos literarios."
        }
        keywords={`${story?.title?.split(" ").slice(0, 3).join(", ") || "historia"}, ${story?.contest?.title || "escritura creativa"}, ${story?.author?.display_name || "autor"}, concurso literario, ficción, letranido`}
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
              // Navegar inteligentemente según el contexto
              if (story?.contest_id) {
                // Si la historia pertenece a un concurso, ir a ese concurso específico
                navigate(`/contest/${story.contest_id}`);
              } else {
                // Fallback: ir al concurso actual
                navigate("/contest/current");
              }
            }}
            className="flex items-center text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver al concurso
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
                  Concurso de {story.contest.month} - {story.contest.category}
                </span>
              </div>

              <Link
                to="/contest/current"
                className="text-primary-100 hover:text-white dark:text-primary-200 dark:hover:text-white text-sm flex items-center"
              >
                Ver concurso
                <ExternalLink className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Main Header */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-6 leading-tight">
              {story.title}
            </h1>

            {/* Author Info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
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
                  {/* Ocultar estadísticas del autor durante votación para evitar sesgo */}
                  {(() => {
                    // Usar currentContest en lugar de story.contest para tener las fechas correctas
                    const contestPhase = currentContest
                      ? getContestPhase(currentContest)
                      : null;
                    const isVotingPhase = contestPhase === "voting";

                    if (isVotingPhase) {
                      // Durante votación, no mostrar estadísticas del autor para evitar sesgo
                      return null;
                    } else {
                      return (
                        <div className="flex items-center text-sm text-gray-600 dark:text-dark-300">
                          <Award className="h-4 w-4 mr-1" />
                          <span>{story.author.wins} victorias</span>
                          <span className="mx-2">•</span>
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{story.author.totalLikes} votos totales</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Story Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-dark-300">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{getReadingTime(story.word_count)} min de lectura</span>
                </div>
                <div className="flex items-center">
                  <PenTool className="h-4 w-4 mr-1" />
                  <span>{story.word_count} palabras</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(story.created_at)}</span>
                </div>
              </div>
            </div>

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
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="flex items-center gap-4">
                {/* Determinar si estamos en fase de votación */}
                {(() => {
                  // Usar currentContest en lugar de story.contest para tener las fechas correctas
                  const contestPhase = currentContest
                    ? getContestPhase(currentContest)
                    : null;
                  const isVotingPhase = contestPhase === "voting";

                  if (isVotingPhase) {
                    // Durante votación: ocultar votos y vistas
                    return (
                      <>
                        <EnhancedVoteButton
                          isLiked={isLiked}
                          likesCount={0} // Ocultar conteo durante votación
                          canVote={votingInfo.canVote}
                          votingInfo={votingInfo}
                          isAuthenticated={isAuthenticated}
                          onVote={handleVote}
                          onAuthRequired={() => openAuthModal("register")}
                          size="default"
                          hideCount={true} // Prop para ocultar el número
                          isPortfolioStory={!story?.contest_id} // Historia libre si no tiene contest_id
                        />

                        <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                          <span>🗳️ Votación ciega - vota por la historia</span>
                        </div>

                        {/* Contador de votos restantes */}
                        <VoteCounter
                          contestId={story.contest_id}
                          className="ml-2"
                        />

                        {/* Compartir */}
                        {getShareData() && (
                          <ShareDropdown
                            shareData={getShareData()}
                            size="default"
                          />
                        )}
                      </>
                    );
                  } else {
                    // Fuera de votación: mostrar votos y vistas normalmente
                    return (
                      <>
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
                        />

                        <div className="flex items-center text-gray-600 dark:text-dark-300 text-xs">
                          <Eye className="h-5 w-5 mr-2" />
                          <span>{story.views_count || 0} vistas</span>
                        </div>

                        {/* Contador de votos restantes */}
                        <VoteCounter
                          contestId={story.contest_id}
                          className="ml-2"
                        />

                        {/* Compartir */}
                        {getShareData() && (
                          <ShareDropdown
                            shareData={getShareData()}
                            size="default"
                          />
                        )}
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
              color: ${isDark ? '#d1d5db' : '#374151'};
              text-align: justify;
              line-height: 1.7;
            }

            .story-content p:empty {
              height: 1.7em;
            }

            .story-content em {
              font-style: italic;
              color: ${isDark ? '#9ca3af' : '#4b5563'};
            }

            .story-content strong {
              font-weight: 600;
              color: ${isDark ? '#f9fafb' : '#1f2937'};
            }
          `,
            }}
          />

          {/* Story Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-600">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600 dark:text-dark-300 text-sm mb-2">
                  Esta historia participó en el concurso{" "}
                  <strong>"{story.contest.title}"</strong>
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-dark-400">
                  <span>Publicada el {formatDate(story.created_at)}</span>
                  <span>•</span>
                  <span>{story.word_count} palabras</span>
                  <span>•</span>
                  <span>
                    {getReadingTime(story.word_count)} minutos de lectura
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botón de voto en el footer - también ocultar conteo durante votación */}
                {(() => {
                  // Usar currentContest en lugar de story.contest para tener las fechas correctas
                  const contestPhase = currentContest
                    ? getContestPhase(currentContest)
                    : null;
                  const isVotingPhase = contestPhase === "voting";

                  return (
                    <EnhancedVoteButton
                      isLiked={isLiked}
                      likesCount={isVotingPhase ? 0 : likesCount} // Ocultar conteo durante votación
                      canVote={votingInfo.canVote}
                      votingInfo={votingInfo}
                      isAuthenticated={isAuthenticated}
                      onVote={handleVote}
                      onAuthRequired={() => openAuthModal("register")}
                      size="large"
                      showTooltip={false}
                      hideCount={isVotingPhase} // Prop para ocultar el número
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
                  Ver más historias del concurso
                </span>
              </div>
              <p className="text-primary-700 dark:text-primary-400 text-sm">
                Descubre más historias del concurso de {story.contest.month}
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

            {/* Enlace al concurso actual si esta historia es de un concurso cerrado */}
            {story?.contest?.status === "results" && (
              <Link
                to="/contest/current"
                className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
              >
                <div className="flex items-center mb-2">
                  <Trophy className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-900 dark:text-purple-300">
                    Ver concurso actual
                  </span>
                </div>
                <p className="text-purple-700 dark:text-purple-400 text-sm">
                  Participa en el concurso activo de este mes
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
