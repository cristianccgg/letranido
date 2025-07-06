import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Edit3,
  Trophy,
  Star,
  Calendar,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data - esto vendría de la API
  const profileUser = {
    id: userId || currentUser?.id,
    name: "Elena M.",
    email: "elena@email.com",
    bio: "Escritora apasionada por la ficción y el drama. Me encanta explorar las emociones humanas a través de las palabras.",
    location: "Madrid, España",
    website: "https://elena-writes.com",
    joinedAt: "2024-03-15",
    avatar: null,
    stats: {
      textsWritten: 28,
      totalLikes: 456,
      totalViews: 2341,
      wins: 5,
      streak: 12,
      rank: 15,
    },
    badges: [
      {
        id: 1,
        name: "Primer texto",
        description: "Escribió su primera historia",
        earned: true,
      },
      {
        id: 2,
        name: "Escritor constante",
        description: "7 días de racha escribiendo",
        earned: true,
      },
      {
        id: 3,
        name: "Favorito de la comunidad",
        description: "Recibió 100+ likes",
        earned: true,
      },
      {
        id: 4,
        name: "Ganador",
        description: "Ganó su primer concurso",
        earned: true,
      },
      {
        id: 5,
        name: "Maestro de palabras",
        description: "Escribió 25+ historias",
        earned: true,
      },
      {
        id: 6,
        name: "Leyenda",
        description: "Escritor del mes",
        earned: false,
      },
    ],
  };

  const recentTexts = [
    {
      id: 1,
      title: "El Susurro de las Páginas",
      excerpt:
        "Entre las sombras de los estantes vacíos, el último libro parecía brillar con luz propia...",
      category: "Ficción",
      likes: 45,
      views: 234,
      publishedAt: "2025-07-01",
      isWinner: true,
    },
    {
      id: 2,
      title: "Cartas desde el Futuro",
      excerpt:
        "La primera carta llegó un martes por la mañana, con un sello que no reconocí...",
      category: "Ciencia Ficción",
      likes: 23,
      views: 156,
      publishedAt: "2025-06-28",
      isWinner: false,
    },
    {
      id: 3,
      title: "La Última Melodía",
      excerpt:
        "El piano había permanecido en silencio durante décadas, pero esa noche...",
      category: "Drama",
      likes: 31,
      views: 189,
      publishedAt: "2025-06-25",
      isWinner: false,
    },
  ];

  const isOwnProfile = !userId || userId === currentUser?.id;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {profileUser.name}
              </h1>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar perfil
                </button>
              )}
            </div>

            <p className="text-gray-600 mb-4">{profileUser.bio}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {profileUser.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profileUser.location}
                </div>
              )}
              {profileUser.website && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  <a
                    href={profileUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Sitio web
                  </a>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Se unió en {formatDate(profileUser.joinedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {profileUser.stats.textsWritten}
          </div>
          <div className="text-sm text-gray-600">Historias</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {profileUser.stats.totalLikes}
          </div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {profileUser.stats.totalViews}
          </div>
          <div className="text-sm text-gray-600">Vistas</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {profileUser.stats.wins}
          </div>
          <div className="text-sm text-gray-600">Victorias</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {profileUser.stats.streak}
          </div>
          <div className="text-sm text-gray-600">Racha</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent-600">
            #{profileUser.stats.rank}
          </div>
          <div className="text-sm text-gray-600">Ranking</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Texts */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {isOwnProfile ? "Mis historias recientes" : "Historias recientes"}
            </h2>

            <div className="space-y-6">
              {recentTexts.map((text) => (
                <article
                  key={text.id}
                  className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {text.category}
                    </span>
                    {text.isWinner && (
                      <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Ganador
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {text.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{text.excerpt}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{text.publishedAt}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {text.likes}
                      </span>
                      <span>{text.views} vistas</span>
                      <button className="text-primary-600 hover:text-primary-700 font-medium">
                        Leer →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Insignias
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {profileUser.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-lg border-2 text-center ${
                  badge.earned
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div
                  className={`text-2xl mb-1 ${
                    badge.earned ? "text-yellow-600" : "text-gray-400"
                  }`}
                >
                  {badge.earned ? "🏆" : "🔒"}
                </div>
                <div
                  className={`text-xs font-medium ${
                    badge.earned ? "text-yellow-800" : "text-gray-500"
                  }`}
                >
                  {badge.name}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    badge.earned ? "text-yellow-700" : "text-gray-400"
                  }`}
                >
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
