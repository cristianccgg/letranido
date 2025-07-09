// pages/UnifiedProfile.jsx - USANDO AppStateContext
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Trophy,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  Heart,
  Eye,
  Users,
  User,
  Edit3,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useAppState } from "../contexts/AppStateContext"; // ✅ Usar contexto unificado
import { supabase } from "../lib/supabase";

const UnifiedProfile = () => {
  const { user } = useAuthStore();

  // ✅ Usar el contexto unificado en lugar de múltiples hooks
  const {
    currentContest,
    currentContestPhase,
    userStories,
    userStoriesLoading,
    votingStats,
    votingStatsLoading,
  } = useAppState();

  const [hasUserParticipated, setHasUserParticipated] = useState(false);
  const [loadingParticipation, setLoadingParticipation] = useState(false);

  // Verificar si el usuario ya participó en el concurso actual
  useEffect(() => {
    const checkParticipation = async () => {
      if (!currentContest || !user) {
        setHasUserParticipated(false);
        return;
      }

      setLoadingParticipation(true);
      try {
        const { data, error } = await supabase
          .from("stories")
          .select("id, title, created_at")
          .eq("contest_id", currentContest.id)
          .eq("user_id", user.id)
          .single();

        setHasUserParticipated(!!data && !error);
      } catch (err) {
        console.error("Error checking participation:", err);
        setHasUserParticipated(false);
      } finally {
        setLoadingParticipation(false);
      }
    };

    checkParticipation();
  }, [currentContest, user]);

  // Función para obtener las acciones disponibles
  const getAvailableActions = () => {
    const actions = [];

    // Escribir historia (condicionado)
    if (!hasUserParticipated && currentContestPhase !== "results") {
      actions.push({
        icon: <PenTool className="h-5 w-5" />,
        title: "Escribir nueva historia",
        description: `Participa en el concurso de ${
          currentContest?.month || "este mes"
        }`,
        href: "/write",
        color: "text-blue-600 hover:text-blue-700",
        bgColor: "hover:bg-blue-50",
      });
    }

    // Ver concurso actual
    if (currentContest) {
      actions.push({
        icon: <Trophy className="h-5 w-5" />,
        title:
          currentContestPhase === "results"
            ? "Ver resultados"
            : "Ver concurso actual",
        description: `${currentContest.participants_count} participantes`,
        href: "/contest/current",
        color: "text-yellow-600 hover:text-yellow-700",
        bgColor: "hover:bg-yellow-50",
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  // ✅ Ya no necesitamos loading separado - el contexto maneja todo
  if (userStoriesLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-12 w-12 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.name || user?.display_name}
              </h1>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-white/50">
                <Edit3 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">{user?.email}</p>

            <div className="text-sm text-gray-500 mb-6">
              Miembro desde{" "}
              {new Date(user?.created_at || Date.now()).toLocaleDateString(
                "es-ES",
                {
                  year: "numeric",
                  month: "long",
                }
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {userStories.length}
                </div>
                <div className="text-sm text-gray-600">Historias</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {userStories.reduce(
                    (total, story) => total + (story.likes_count || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Likes recibidos</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-600">
                  {votingStatsLoading ? "..." : votingStats.userVotesCount}
                </div>
                <div className="text-sm text-gray-600">Votos dados</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-yellow-600">
                  {userStories.reduce(
                    (total, story) => total + (story.views_count || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Lecturas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Contest Status */}
          {currentContest && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary-600" />
                  Concurso {currentContest.month}
                </h2>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  {currentContestPhase === "submission"
                    ? "Envíos abiertos"
                    : currentContestPhase === "voting"
                    ? "En votación"
                    : "Finalizado"}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentContest.title}
              </h3>

              {/* Participation Status */}
              {loadingParticipation ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="animate-pulse flex items-center">
                    <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              ) : hasUserParticipated ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      ¡Ya participaste en este concurso!
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Tu historia fue enviada exitosamente.
                    {currentContestPhase === "voting" &&
                      " ¡Ahora puedes votar por otras historias!"}
                    {currentContestPhase === "results" &&
                      " Puedes ver los resultados finales."}
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center text-blue-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {currentContestPhase === "results"
                        ? "Este concurso ya terminó"
                        : "Aún no participaste en este concurso"}
                    </span>
                  </div>
                  {currentContestPhase !== "results" && (
                    <p className="text-blue-700 text-sm mt-1">
                      ¡Es tu oportunidad de brillar! Escribe una historia
                      increíble.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{currentContest.participants_count} participantes</span>
                <Link
                  to="/contest/current"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver detalles →
                </Link>
              </div>
            </div>
          )}

          {/* Recent Stories */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Mis historias ({userStories.length})
            </h2>

            {userStories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <PenTool className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aún no has escrito ninguna historia
                </h3>
                <p className="text-gray-600 mb-4">
                  ¡Es el momento perfecto para empezar tu aventura literaria!
                </p>
                {!hasUserParticipated && currentContestPhase !== "results" && (
                  <Link to="/write" className="btn-primary">
                    Escribir mi primera historia
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userStories.map((story) => (
                  <article
                    key={story.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {story.contests?.title || "Concurso"}
                      </span>
                      {story.is_winner && (
                        <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          Ganador
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {story.title}
                    </h3>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {story.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {new Date(story.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </span>
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          {story.likes_count || 0}
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {story.views_count || 0}
                        </span>
                        <span>{story.word_count || 0} palabras</span>
                      </div>

                      <Link
                        to={`/story/${story.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Leer →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">
              Acciones disponibles
            </h3>

            {availableActions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay acciones disponibles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.href}
                    className={`flex items-center p-3 rounded-lg transition-colors ${action.color} ${action.bgColor} group`}
                  >
                    <div className="mr-3">{action.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs opacity-75">
                        {action.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Participation blocker */}
            {hasUserParticipated && currentContestPhase !== "results" && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center text-gray-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>Ya participaste en el concurso actual</span>
                </div>
              </div>
            )}
          </div>

          {/* Voting Activity */}
          {!votingStatsLoading && votingStats.userVotesCount > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Actividad de votación
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total votos dados:</span>
                  <span className="font-medium text-red-600">
                    {votingStats.userVotesCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En concurso actual:</span>
                  <span className="font-medium text-blue-600">
                    {votingStats.currentContestVotes}
                  </span>
                </div>
                {currentContest?.status === "voting" &&
                  votingStats.currentContestVotes === 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        💡 ¡Aún no has votado en el concurso actual!
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Contest Info */}
          {currentContest && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">
                Información del concurso
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-medium">{currentContest.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participantes:</span>
                  <span className="font-medium">
                    {currentContest.participants_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tu estado:</span>
                  <span
                    className={`font-medium ${
                      hasUserParticipated ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {hasUserParticipated ? "Participando" : "No participando"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfile;
