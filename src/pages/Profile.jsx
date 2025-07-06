// pages/Profile.jsx - Versión simplificada
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { User, Edit3, Trophy, Star, Calendar } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useStories } from "../hooks/useStories";

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuthStore();
  const { getUserStories } = useStories();

  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const result = await getUserStories(currentUser.id); // Pasar el ID explícitamente
        if (result.success) {
          setUserStories(result.stories);
        } else {
          console.error("Error loading stories:", result.error);
        }
      }
      setLoading(false);
    };

    loadUserData();
  }, [currentUser, getUserStories]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-gray-600">
          Los perfiles de otros usuarios no están disponibles aún.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-white" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentUser?.name || currentUser?.display_name}
            </h1>
            <p className="text-gray-600 mb-4">{currentUser?.email}</p>
            <div className="text-sm text-gray-500">
              Miembro desde{" "}
              {new Date(
                currentUser?.created_at || Date.now()
              ).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {userStories.length}
          </div>
          <div className="text-sm text-gray-600">Historias</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {userStories.reduce((total, story) => total + story.likes_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {userStories.reduce((total, story) => total + story.views_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Lecturas</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {userStories.filter((story) => story.is_winner).length}
          </div>
          <div className="text-sm text-gray-600">Victorias</div>
        </div>
      </div>

      {/* Recent Stories */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Mis historias ({userStories.length})
        </h2>

        {userStories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Trophy className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aún no has escrito ninguna historia
            </h3>
            <p className="text-gray-600">
              ¡Participa en el concurso actual para empezar!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {userStories.map((story) => (
              <article
                key={story.id}
                className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0"
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

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {new Date(story.created_at).toLocaleDateString("es-ES")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      {story.likes_count}
                    </span>
                    <span>{story.views_count} lecturas</span>
                    <span>{story.word_count} palabras</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
