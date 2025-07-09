// pages/Dashboard.jsx - Versión con datos reales y estadísticas de votación
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useContests } from "../hooks/compatibilityHooks";
import { useStories } from "../hooks/useStories";
import { useVotingStats } from "../hooks/compatibilityHooks";

const Dashboard = () => {
  const { user } = useAuthStore();
  const { currentContest } = useContests();
  const { getUserStories } = useStories();
  const {
    userVotesCount,
    currentContestVotes,
    loading: votingStatsLoading,
  } = useVotingStats();

  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const result = await getUserStories(user.id); // Pasar el ID explícitamente
        if (isMounted.current) {
          if (result.success) {
            setUserStories(result.stories);
          } else {
            console.error("Error loading stories:", result.error);
          }
          setLoading(false);
        }
      } else {
        if (isMounted.current) setLoading(false);
      }
    };

    loadUserData();
  }, [user, getUserStories]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.name || user?.display_name}! 👋
        </h1>
        <p className="text-gray-600 mb-4">
          Has escrito {userStories.length}{" "}
          {userStories.length === 1 ? "historia" : "historias"}.
          {userStories.length > 0
            ? " ¡Sigue así!"
            : " ¡Es hora de empezar a escribir!"}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {userStories.length}
            </div>
            <div className="text-sm text-gray-600">Historias escritas</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {userStories.reduce(
                (total, story) => total + story.likes_count,
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Likes recibidos</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {votingStatsLoading ? "..." : userVotesCount}
            </div>
            <div className="text-sm text-gray-600">Votos dados</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {userStories.reduce(
                (total, story) => total + story.views_count,
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Lecturas totales</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Prompt */}
          {currentContest && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <PenTool className="h-5 w-5 mr-2 text-primary-600" />
                  Concurso activo
                </h2>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  {currentContest.status === "submission"
                    ? "Envíos abiertos"
                    : "En votación"}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentContest.title}
              </h3>

              <p className="text-gray-600 mb-4">
                {currentContest.participants_count} escritores ya participaron
              </p>

              <Link
                to="/write"
                className="btn-primary inline-flex items-center"
              >
                <PenTool className="h-4 w-4 mr-2" />
                {currentContest.status === "submission"
                  ? "Escribir historia"
                  : "Ver participaciones"}
              </Link>
            </div>
          )}

          {/* Recent Stories */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
              Tus historias recientes
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
                  ¡Es el momento perfecto para empezar!
                </p>
                <Link to="/write" className="btn-primary">
                  Escribir mi primera historia
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userStories.slice(0, 3).map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>
                          {new Date(story.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </span>
                        <span className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {story.likes_count} likes
                        </span>
                        <span>{story.views_count} lecturas</span>
                      </div>
                    </div>
                    <Link
                      to={`/story/${story.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Ver →
                    </Link>
                  </div>
                ))}

                {userStories.length > 3 && (
                  <Link
                    to="/profile"
                    className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm inline-block"
                  >
                    Ver todas mis historias →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Acciones rápidas
            </h3>
            <div className="space-y-2">
              <Link
                to="/write"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                ✍️ Escribir nueva historia
              </Link>
              <Link
                to="/gallery"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                📚 Ver galería de historias
              </Link>
              <Link
                to="/contest/current"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                🏆 Ver concurso actual
              </Link>
            </div>
          </div>

          {/* Contest Info */}
          {currentContest && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">
                Concurso {currentContest.month}
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
                  <span className="text-gray-600">Estado:</span>
                  <span
                    className={`font-medium ${
                      currentContest.status === "submission"
                        ? "text-green-600"
                        : currentContest.status === "voting"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {currentContest.status === "submission"
                      ? "Abierto"
                      : currentContest.status === "voting"
                      ? "Votación"
                      : "Finalizado"}
                  </span>
                </div>
                {currentContest.status === "voting" && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Tus votos:</span>
                    <span className="font-medium text-red-600">
                      {votingStatsLoading ? "..." : currentContestVotes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voting Activity */}
          {!votingStatsLoading && userVotesCount > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Actividad de votación
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total votos dados:</span>
                  <span className="font-medium text-red-600">
                    {userVotesCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En concurso actual:</span>
                  <span className="font-medium text-blue-600">
                    {currentContestVotes}
                  </span>
                </div>
                {currentContest?.status === "voting" &&
                  currentContestVotes === 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        💡 ¡Aún no has votado en el concurso actual!
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
