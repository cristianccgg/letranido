import { Link } from "react-router-dom";
import {
  PenTool,
  Trophy,
  Calendar,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const Dashboard = () => {
  const { user } = useAuthStore();

  // Mock data
  const userStats = {
    textsWritten: 12,
    totalLikes: 156,
    streak: 7,
    rank: 23,
    lastActivity: "2025-07-03",
  };

  const currentPrompt = {
    id: 1,
    title: "El último libro de la biblioteca",
    timeLeft: "1 día, 8 horas",
    participants: 189,
  };

  const recentTexts = [
    {
      id: 1,
      title: "El Susurro de las Páginas",
      likes: 45,
      status: "Ganador",
      publishedAt: "2025-07-01",
    },
    {
      id: 2,
      title: "Cartas desde el Futuro",
      likes: 23,
      status: "Participante",
      publishedAt: "2025-06-28",
    },
    {
      id: 3,
      title: "La Última Melodía",
      likes: 31,
      status: "Participante",
      publishedAt: "2025-06-25",
    },
  ];

  const upcomingPrompts = [
    {
      id: 2,
      title: "Un mensaje en una botella",
      category: "Aventura",
      startsIn: "2 días",
    },
    {
      id: 3,
      title: "El color que no existe",
      category: "Fantasía",
      startsIn: "5 días",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mb-4">
          Tienes una racha de {userStats.streak} días escribiendo. ¡Sigue así!
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {userStats.streak}
            </div>
            <div className="text-sm text-gray-600">Días de racha</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              #{userStats.rank}
            </div>
            <div className="text-sm text-gray-600">Ranking</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Prompt */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <PenTool className="h-5 w-5 mr-2 text-primary-600" />
                Prompt activo
              </h2>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {currentPrompt.timeLeft}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentPrompt.title}
            </h3>

            <p className="text-gray-600 mb-4">
              {currentPrompt.participants} escritores ya participaron
            </p>

            <Link
              to={`/write/${currentPrompt.id}`}
              className="btn-primary inline-flex items-center"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Escribir ahora
            </Link>
          </div>

          {/* Recent Texts */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
              Tus historias recientes
            </h2>

            <div className="space-y-3">
              {recentTexts.map((text) => (
                <div
                  key={text.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{text.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{text.publishedAt}</span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {text.likes} likes
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      text.status === "Ganador"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {text.status}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/profile"
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm inline-block"
            >
              Ver todas mis historias →
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Tu progreso
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Textos este mes</span>
                  <span className="font-medium">4/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: "40%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Racha actual</span>
                  <span className="font-medium">{userStats.streak} días</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Prompts */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Próximos prompts
            </h3>

            <div className="space-y-3">
              {upcomingPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <h4 className="font-medium text-gray-900 text-sm">
                    {prompt.title}
                  </h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {prompt.category}
                    </span>
                    <span className="text-xs text-primary-600 font-medium">
                      En {prompt.startsIn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Acciones rápidas
            </h3>
            <div className="space-y-2">
              <Link
                to="/gallery"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Ver galería de historias
              </Link>
              <Link
                to="/profile"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Editar mi perfil
              </Link>
              <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Configuración
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
