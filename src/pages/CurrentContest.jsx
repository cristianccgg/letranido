import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Clock,
  Users,
  Eye,
  Heart,
  Star,
  PenTool,
  Calendar,
  Award,
  Lock,
  AlertCircle,
} from "lucide-react";

const CurrentContest = () => {
  const [sortBy, setSortBy] = useState("recent");
  const [debugPhase, setDebugPhase] = useState("voting"); // Para testing

  // Mock data del concurso actual
  const getContestDates = (phase) => {
    const now = new Date();
    switch (phase) {
      case "submission":
        return {
          submissionEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días
          votingStartDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // +8 días
          votingEndDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 días
        };
      case "voting":
        return {
          submissionEndDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 día
          votingStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 día
          votingEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días
        };
      case "results":
        return {
          submissionEndDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // -8 días
          votingStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // -7 días
          votingEndDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 día
        };
      default:
        return getContestDates("voting");
    }
  };

  const contestDates = getContestDates(debugPhase);

  const currentContest = {
    id: 1,
    title: "El último libro de la biblioteca",
    description:
      "Eres el bibliotecario de una biblioteca que está a punto de cerrar para siempre. Solo queda un libro en los estantes. ¿Cuál es y por qué es tan especial?",
    endDate: new Date("2025-07-31T23:59:59"),
    month: "Julio 2025",
    category: "Ficción",
    participants: 127,
    prize: "Insignia de Oro + Destacado del mes",
    // Fechas dinámicas basadas en debugPhase
    ...contestDates,
  };

  // Determinar en qué fase estamos
  const now = new Date();
  const isSubmissionPhase = now <= currentContest.submissionEndDate;
  const isVotingPhase =
    now >= currentContest.votingStartDate &&
    now <= currentContest.votingEndDate;
  const isResultsPhase = now > currentContest.votingEndDate;

  const getCurrentPhase = () => {
    if (isSubmissionPhase) return "submission";
    if (isVotingPhase) return "voting";
    if (isResultsPhase) return "results";
    return "submission";
  };

  const currentPhase = getCurrentPhase();

  // Mock participaciones (solo visibles en fase de voting)
  const submissions = [
    {
      id: 1,
      title: "El Guardián de los Secretos",
      author: "María Elena",
      authorId: "maria_elena",
      excerpt:
        "En el silencio sepulcral de la biblioteca, solo quedaba yo y aquel libro que parecía brillar con luz propia. Sus páginas amarillentas susurraban historias que nadie más había escuchado...",
      likes: 24,
      views: 156,
      publishedAt: "2025-07-05T14:30:00Z",
      wordCount: 847,
      readTime: "4 min",
      authorBadges: ["🏆", "⭐"],
      authorWins: 3,
      isMature: false,
    },
    {
      id: 2,
      title: "Memorias en Papel Amarillento",
      author: "Carlos Vega",
      authorId: "carlos_vega",
      excerpt:
        "Cincuenta años cuidando estos libros me habían enseñado que las historias más importantes no estaban en las páginas, sino entre ellas. Y ese último libro... ese contenía todas nuestras memorias...",
      likes: 18,
      views: 134,
      publishedAt: "2025-07-04T09:15:00Z",
      wordCount: 923,
      readTime: "5 min",
      authorBadges: ["⭐"],
      authorWins: 1,
      isMature: false,
    },
    {
      id: 3,
      title: "El Último Testimonio",
      author: "Ana Rodríguez",
      authorId: "ana_rodriguez",
      excerpt:
        "No era solo un libro. Era el registro de cada alma que había encontrado refugio entre estos muros. Cada lágrima, cada sonrisa, cada sueño roto y reconstruido...",
      likes: 31,
      views: 203,
      publishedAt: "2025-07-03T20:45:00Z",
      wordCount: 756,
      readTime: "4 min",
      authorBadges: ["🏆", "⭐", "🔥"],
      authorWins: 5,
      isMature: false,
    },
    {
      id: 4,
      title: "Ecos en el Vacío",
      author: "Miguel Santos",
      authorId: "miguel_santos",
      excerpt:
        "La biblioteca moría, pero su último libro contenía algo que ningún otro había logrado: el poder de hacer que los muertos hablaran una vez más...",
      likes: 12,
      views: 89,
      publishedAt: "2025-07-05T11:20:00Z",
      wordCount: 634,
      readTime: "3 min",
      authorBadges: [],
      authorWins: 0,
      isMature: true,
    },
    {
      id: 5,
      title: "La Despedida Silenciosa",
      author: "Laura Mendoza",
      authorId: "laura_mendoza",
      excerpt:
        "Había llegado el momento de cerrar las puertas por última vez. Pero antes, tenía que leer ese libro que había estado esperando en el estante más alto durante décadas...",
      likes: 7,
      views: 67,
      publishedAt: "2025-07-05T16:00:00Z",
      wordCount: 512,
      readTime: "3 min",
      authorBadges: ["⭐"],
      authorWins: 2,
      isMature: false,
    },
  ];

  const sortedSubmissions = submissions.sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.likes + b.views - (a.likes + a.views);
      case "random":
        return Math.random() - 0.5;
      case "recent":
      default:
        return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Hace menos de una hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hace 1 día";
    return `Hace ${diffInDays} días`;
  };

  const getBadgeInfo = (badge) => {
    switch (badge) {
      case "🏆":
        return { name: "Ganador", color: "text-yellow-600" };
      case "⭐":
        return { name: "Autor popular", color: "text-blue-600" };
      case "🔥":
        return { name: "Racha ganadora", color: "text-red-600" };
      default:
        return { name: "", color: "text-gray-600" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header del concurso */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                🏆 CONCURSO ACTIVO
              </span>
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {currentContest.month}
              </span>
              <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
                {currentContest.category}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {currentContest.title}
            </h1>

            <p className="text-gray-600 leading-relaxed mb-4">
              {currentContest.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {currentContest.participants} participantes
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {currentPhase === "submission" &&
                  `Envíos hasta ${currentContest.submissionEndDate.toLocaleDateString(
                    "es-ES"
                  )}`}
                {currentPhase === "voting" &&
                  `Votación hasta ${currentContest.votingEndDate.toLocaleDateString(
                    "es-ES"
                  )}`}
                {currentPhase === "results" && "Concurso finalizado"}
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                {currentContest.prize}
              </div>
            </div>
          </div>

          {/* Botón dinámico según la fase */}
          <div className="ml-6">
            {currentPhase === "submission" && (
              <Link
                to={`/write/${currentContest.id}`}
                className="btn-primary flex items-center"
              >
                <PenTool className="h-4 w-4 mr-2" />
                ¡Participar ahora!
              </Link>
            )}
            {currentPhase === "voting" && (
              <div className="text-center">
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  🗳️ FASE DE VOTACIÓN
                </div>
                <Link
                  to={`/write/${currentContest.id}`}
                  className="btn-secondary text-sm"
                >
                  ¿Aún quieres participar?
                </Link>
              </div>
            )}
            {currentPhase === "results" && (
              <div className="text-center">
                <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                  🏆 RESULTADOS FINALES
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido dinámico según la fase */}
      {currentPhase === "submission" && (
        <div className="text-center py-12">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Fase de envío de historias
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Los participantes están escribiendo sus historias. Las
            participaciones se revelarán el{" "}
            <strong>
              {currentContest.votingStartDate.toLocaleDateString("es-ES")}
            </strong>{" "}
            para comenzar la fase de votación.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
            <AlertCircle className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <p className="text-blue-800 text-sm">
              <strong>¿Por qué esperamos?</strong>
              <br />
              Para que todos los participantes tengan las mismas oportunidades
              de recibir votos, sin importar cuándo envíen su historia.
            </p>
          </div>
          <Link
            to={`/write/${currentContest.id}`}
            className="btn-primary inline-flex items-center px-6 py-3"
          >
            <PenTool className="h-5 w-5 mr-2" />
            Escribir mi historia
          </Link>
        </div>
      )}

      {(currentPhase === "voting" || currentPhase === "results") && (
        <>
          {/* Filtros */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Participaciones ({submissions.length})
              </h2>
              {currentPhase === "voting" && (
                <p className="text-sm text-green-600 mt-1">
                  🗳️ Votación activa - ¡Puedes votar por tus favoritas!
                </p>
              )}
              {currentPhase === "results" && (
                <p className="text-sm text-yellow-600 mt-1">
                  🏆 Resultados finales del concurso
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="recent">Más recientes</option>
                <option value="popular">Más populares</option>
                <option value="random">Orden aleatorio</option>
              </select>
            </div>
          </div>

          {/* Lista de participaciones */}
          <div className="space-y-6">
            {sortedSubmissions.map((submission, index) => (
              <article
                key={submission.id}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* Posición/ranking visual */}
                  <div className="flex-shrink-0 text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentPhase === "results"
                          ? index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {currentPhase === "results" && index < 3
                        ? index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : "🥉"
                        : index + 1}
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {submission.title}
                          {submission.isMature && (
                            <span className="ml-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                              Contenido Maduro
                            </span>
                          )}
                          {currentPhase === "results" && index === 0 && (
                            <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                              🏆 GANADOR
                            </span>
                          )}
                        </h3>

                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-600">
                            por{" "}
                            <span className="font-medium text-gray-900">
                              {submission.author}
                            </span>
                          </span>

                          {/* Badges del autor */}
                          {submission.authorBadges.length > 0 && (
                            <div className="flex items-center gap-1">
                              {submission.authorBadges.map((badge, i) => {
                                const badgeInfo = getBadgeInfo(badge);
                                return (
                                  <span
                                    key={i}
                                    className={`text-xs ${badgeInfo.color}`}
                                    title={badgeInfo.name}
                                  >
                                    {badge}
                                  </span>
                                );
                              })}
                              {submission.authorWins > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({submission.authorWins} victorias)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-500">
                        <div>{submission.readTime}</div>
                        <div>{submission.wordCount} palabras</div>
                      </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                      {submission.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1 text-red-400" />
                          {submission.likes} likes
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {submission.views} lecturas
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(submission.publishedAt)}
                        </div>
                      </div>

                      <Link
                        to={`/story/${submission.id}`}
                        className={`text-sm px-4 py-2 ${
                          currentPhase === "voting"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                      >
                        {currentPhase === "voting"
                          ? "Leer y votar →"
                          : "Leer historia →"}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* CTA para participar (solo en fase de submission y voting) */}
      {(currentPhase === "submission" || currentPhase === "voting") && (
        <div className="mt-12 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-8 text-center">
          {currentPhase === "submission" && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Aún estás a tiempo de participar!
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Tienes hasta el{" "}
                <strong>
                  {currentContest.submissionEndDate.toLocaleDateString("es-ES")}
                </strong>{" "}
                para enviar tu historia al concurso de {currentContest.month}.
              </p>
            </>
          )}

          {currentPhase === "voting" && (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Te inspiraste leyendo estas historias?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Aunque ya estamos en la fase de votación, aún puedes enviar tu
                historia hasta el{" "}
                <strong>
                  {currentContest.votingEndDate.toLocaleDateString("es-ES")}
                </strong>
                .
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/write/${currentContest.id}`}
              className="btn-primary inline-flex items-center px-6 py-3"
            >
              <PenTool className="h-5 w-5 mr-2" />
              Escribir mi historia
            </Link>
            <Link
              to="/"
              className="btn-secondary inline-flex items-center px-6 py-3"
            >
              Ver reglas del concurso
            </Link>
          </div>
        </div>
      )}

      {/* Mensaje de resultados finales */}
      {currentPhase === "results" && (
        <div className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Concurso finalizado!
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Gracias a todos los participantes del concurso de{" "}
            {currentContest.month}. ¡Nos vemos en el próximo mes para una nueva
            aventura literaria!
          </p>
          <Link
            to="/"
            className="btn-primary inline-flex items-center px-6 py-3"
          >
            Ver próximo concurso
          </Link>
        </div>
      )}
      {/* Debug buttons - SOLO PARA TESTING */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-3 rounded-lg shadow-lg">
          <div className="text-xs mb-2 text-gray-300">
            🔧 Debug - Cambiar fase:
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setDebugPhase("submission")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                debugPhase === "submission"
                  ? "bg-blue-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              📝 Envío
            </button>
            <button
              onClick={() => setDebugPhase("voting")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                debugPhase === "voting"
                  ? "bg-green-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              🗳️ Votación
            </button>
            <button
              onClick={() => setDebugPhase("results")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                debugPhase === "results"
                  ? "bg-yellow-600"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              🏆 Resultados
            </button>
          </div>
          <div className="text-xs mt-2 text-gray-400">
            Fase actual: <span className="font-medium">{currentPhase}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentContest;
