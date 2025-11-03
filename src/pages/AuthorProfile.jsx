import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  BookOpen,
  Heart,
  Eye,
  MapPin,
  Globe,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import UserAvatar from "../components/ui/UserAvatar";
import SEOHead from "../components/SEO/SEOHead";
import UserKarmaSection from "../components/profile/UserKarmaSection";
import UserBadgesSection from "../components/ui/UserBadgesSection";
import SocialLinksDisplay from "../components/ui/SocialLinksDisplay";
import ExpandableBio from "../components/ui/ExpandableBio";
import { useGlobalApp } from "../contexts/GlobalAppContext";

const AuthorProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentContest, contests, getContestPhase } = useGlobalApp();
  const [author, setAuthor] = useState(null);
  const [authorStories, setAuthorStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, popular

  // Función para limpiar tags HTML del texto
  const stripHtmlTags = (text) => {
    if (!text) return "";
    return text
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  // Función para verificar si una historia está en un concurso en fase de envíos
  const isStoryInSubmissionsPhase = (story) => {
    if (!story.contest || !story.contest_id || !contests) return false;

    // Buscar el concurso específico de esta historia
    const storyContest = contests.find((c) => c.id === story.contest_id);
    if (!storyContest) return false;

    const contestPhase = getContestPhase(storyContest);
    console.log(
      `🔒 Historia "${story.title}" - Concurso: ${storyContest.title} - Fase: ${contestPhase}`
    );

    return contestPhase === "submission";
  };

  // Cargar datos del autor
  useEffect(() => {
    if (userId) {
      loadAuthorProfile();
    }
  }, [userId]);

  const loadAuthorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Cargando perfil para userId:", userId);

      // Obtener perfil del autor con campos de privacidad
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select(
          `
          *
        `
        )
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("❌ Error perfil:", profileError);
        if (profileError.code === "PGRST116") {
          setError("Autor no encontrado");
        } else {
          throw profileError;
        }
        return;
      }

      console.log("✅ Perfil encontrado:", profile.display_name);

      // Note: Los perfiles públicos siempre se pueden ver, pero con información limitada según configuración de privacidad

      setAuthor(profile);
      await loadAuthorStories(profile.id);
    } catch (err) {
      console.error("Error cargando perfil del autor:", err);
      setError("Error al cargar el perfil del autor");
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorStories = async (authorId) => {
    try {
      setStoriesLoading(true);
      console.log("📚 Buscando historias para userId:", authorId);

      // Obtener historias del autor (consulta simplificada sin fechas)
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
          id,
          title,
          content,
          excerpt,
          created_at,
          updated_at,
          likes_count,
          views_count,
          user_id,
          contest_id,
          is_featured,
          contest:contests(id, title)
        `
        )
        .eq("user_id", authorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error cargando historias:", error);
        throw error;
      }

      console.log("📚 Historias encontradas:", data?.length || 0);

      // Filtrar historias según reglas de visibilidad por fase de concurso
      const visibleStories = (data || []).filter((story) => {
        // Historias libres (sin concurso) siempre visibles
        if (!story.contest) return true;

        // Verificar si la historia está en cualquier concurso en fase de envíos
        if (isStoryInSubmissionsPhase(story)) {
          console.log(
            `❌ Historia "${story.title}" - OCULTA por estar en fase de envíos`
          );
          return false;
        }

        console.log(`✅ Historia "${story.title}" - VISIBLE`);
        return true;
      });

      console.log(
        "👁️ Historias visibles:",
        visibleStories.length,
        "de",
        data?.length || 0
      );
      setAuthorStories(visibleStories);
    } catch (err) {
      console.error("Error cargando historias del autor:", err);
      setAuthorStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Función para determinar si una historia debe mostrar estadísticas
  const shouldShowStats = (story) => {
    // Historias libres siempre muestran estadísticas
    if (!story.contest) return true;

    // Buscar el concurso específico de esta historia
    const storyContest = contests?.find((c) => c.id === story.contest_id);
    if (!storyContest) return true;

    const contestPhase = getContestPhase(storyContest);

    // Durante votación y counting: NO mostrar estadísticas
    // Solo mostrar después de que el admin cierre manualmente el concurso (results)
    return contestPhase !== "voting" && contestPhase !== "counting";
  };

  // Calcular estadísticas del autor (excluyendo historias en votación y counting)
  const authorStats = useMemo(() => {
    if (!authorStories.length)
      return {
        totalStories: 0,
        totalLikes: 0,
        totalViews: 0,
        hiddenStories: 0,
      };

    // Filtrar solo historias que muestran estadísticas
    const storiesWithStats = authorStories.filter(shouldShowStats);

    // Calcular historias ocultas en fase de envíos
    const allAuthorStories = authorStories.length;
    let hiddenStoriesCount = 0;

    // Simular consulta completa para contar historias ocultas
    if (contests && author) {
      // Esto es una aproximación. En producción podrías hacer una consulta separada.
      hiddenStoriesCount =
        contests.filter((contest) => getContestPhase(contest) === "submission")
          .length > 0
          ? 1
          : 0; // Simplificado para el ejemplo
    }

    return {
      totalStories: authorStories.length, // Total siempre muestra todas las visibles
      totalLikes: storiesWithStats.reduce(
        (sum, story) => sum + (story.likes_count || 0),
        0
      ),
      totalViews: storiesWithStats.reduce(
        (sum, story) => sum + (story.views_count || 0),
        0
      ),
      hiddenStories: hiddenStoriesCount,
    };
  }, [authorStories, contests, author]);

  // Ordenar historias según filtro
  const sortedStories = useMemo(() => {
    const stories = [...authorStories];

    switch (sortBy) {
      case "oldest":
        return stories.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      case "popular":
        return stories.sort(
          (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
        );
      case "newest":
      default:
        return stories.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
  }, [authorStories, sortBy]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{error}</h1>
        <p className="text-gray-600 mb-8">
          El perfil que buscas no existe o no está disponible.
        </p>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${author.display_name || author.name} - Perfil de Autor`}
        description={
          author.bio ||
          `Descubre las historias de ${author.display_name || author.name} en Letranido. ${authorStats.totalStories} historias publicadas con ${authorStats.totalLikes} likes recibidos.`
        }
        keywords={`${author.display_name}, autor, escritor, historias, letranido`}
        url={`/author/${userId}`}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Botón de regreso */}
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
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>

        {/* Header del perfil - Contenido sobre gradiente */}
        <div className="relative mb-8 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-2xl shadow-lg overflow-hidden">
          {/* Patrón decorativo sutil */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"></div>
          </div>

          {/* Contenido del perfil */}
          <div className="relative px-6 sm:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Avatar */}
              <div className="flex justify-center sm:justify-start flex-shrink-0">
                <div className="ring-4 ring-white/30 rounded-full">
                  <UserAvatar user={author} size="2xl" />
                </div>
              </div>

              {/* Información del autor */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  {author.display_name || author.name}
                </h1>

                {/* Biografía */}
                {author.bio && author.show_bio && (
                  <div className="mb-4 max-w-3xl mx-auto sm:mx-0">
                    <ExpandableBio
                      bio={author.bio}
                      maxLength={200}
                      className="text-white/90 leading-relaxed"
                    />
                  </div>
                )}

                {/* Información adicional */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Miembro desde{" "}
                      {new Date(author.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {author.location && author.show_location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{author.location}</span>
                    </div>
                  )}
                </div>
                {author.social_links &&
                  author.show_social_links &&
                  Object.keys(author.social_links).length > 0 && (
                    <div className="flex items-center mt-5 justify-center sm:justify-start [&_a]:!text-white [&_a]:!border-white/30 [&_a:hover]:!border-white/50 [&_a:hover]:!bg-white/10 [&_a]:shadow-sm [&_svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      <SocialLinksDisplay
                        socialLinks={author.social_links}
                        size="sm"
                      />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas - Diseño compacto y elegante */}
        {author.show_stats && (
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 sm:p-6 text-center border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {authorStats.totalStories}
                </span>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Historias
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 sm:p-6 text-center border border-red-200 dark:border-red-800/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                <span className="text-2xl sm:text-3xl font-bold text-red-700 dark:text-red-300">
                  {authorStats.totalLikes}
                </span>
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                  Likes
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 sm:p-6 text-center border border-green-200 dark:border-green-800/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                <span className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300">
                  {authorStats.totalViews}
                </span>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                  Lecturas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Secciones de Karma y Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Karma del usuario */}
          <UserKarmaSection
            userId={userId}
            userName={author.display_name || author.name}
            compact={true}
          />

          {/* Badges del usuario */}
          <UserBadgesSection
            userId={userId}
            userName={author.display_name || author.name}
          />
        </div>

        {/* Sección de historias - Diseño mejorado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Historias
                  <span className="ml-2 text-lg font-normal text-gray-500 dark:text-gray-400">
                    ({authorStats.totalStories})
                  </span>
                </h2>
              </div>

              {/* Filtros de ordenamiento - Mejorados */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("newest")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === "newest"
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Recientes
                </button>
                <button
                  onClick={() => setSortBy("popular")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === "popular"
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Populares
                </button>
                <button
                  onClick={() => setSortBy("oldest")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === "oldest"
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Antiguas
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Mensaje informativo sobre historias ocultas */}
            {contests &&
              contests.some(
                (contest) => getContestPhase(contest) === "submission"
              ) && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Historias en concursos activos
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Las historias enviadas a concursos en fase de envíos no
                        son visibles hasta que comience la votación. Esto
                        garantiza la equidad del proceso de evaluación.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {storiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : sortedStories.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Sin historias aún
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {author.display_name || author.name} aún no ha publicado
                  ninguna historia.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedStories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/story/${story.id}?from=profile&authorId=${userId}`}
                    className="group block border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800/50 hover:bg-gradient-to-br hover:from-primary-50/50 hover:to-accent-50/50 dark:hover:from-primary-900/10 dark:hover:to-accent-900/10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors pr-3">
                        {story.title}
                      </h3>

                      {/* Badge de tipo de historia - Mejorado */}
                      <span
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                          story.contest
                            ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300"
                            : "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300"
                        }`}
                      >
                        {story.contest ? "🏆 Reto" : "✍️ Libre"}
                      </span>
                    </div>

                    {/* Excerpt */}
                    {story.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                        {stripHtmlTags(story.excerpt)}
                      </p>
                    )}

                    {/* Información del reto si aplica */}
                    {story.contest && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 text-sm text-purple-700 dark:text-purple-400 font-medium bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-lg">
                          📝 {story.contest.title}
                        </span>
                      </div>
                    )}

                    {/* Estadísticas y fecha */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {shouldShowStats(story) ? (
                          <>
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span className="font-medium">
                                {story.likes_count || 0}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <Eye className="w-4 h-4 text-green-600" />
                              <span className="font-medium">
                                {story.views_count || 0}
                              </span>
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
                            <Lock className="w-4 h-4" />
                            En votación
                          </span>
                        )}
                      </div>

                      <time
                        dateTime={story.created_at}
                        className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm"
                      >
                        {new Date(story.created_at).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthorProfile;
