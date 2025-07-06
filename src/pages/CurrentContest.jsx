import { useState, useEffect } from "react";
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
  User,
  Grid3X3,
  List,
} from "lucide-react";

const CurrentContest = () => {
  const [sortBy, setSortBy] = useState("random");
  const [debugPhase, setDebugPhase] = useState("voting"); // Solo para desarrollo
  const [viewMode, setViewMode] = useState("compact");

  // Fechas reales del concurso actual (Julio 2025)
  const realContestDates = {
    submissionEndDate: new Date("2025-07-26T23:59:59"), // 26 de julio
    votingStartDate: new Date("2025-07-27T00:00:00"), // 27 de julio
    votingEndDate: new Date("2025-07-31T23:59:59"), // 31 de julio
  };

  // Función para detectar la fase real basada en la fecha actual
  const getRealPhase = () => {
    const now = new Date();
    if (now <= realContestDates.submissionEndDate) {
      return "submission";
    } else if (
      now >= realContestDates.votingStartDate &&
      now <= realContestDates.votingEndDate
    ) {
      return "voting";
    } else {
      return "results";
    }
  };

  // Usar fase real en producción, debug en desarrollo
  const actualPhase =
    process.env.NODE_ENV === "production" ? getRealPhase() : debugPhase;

  // Mock data del concurso actual
  const getContestDates = (phase) => {
    // En producción, usar siempre las fechas reales
    if (process.env.NODE_ENV === "production") {
      return realContestDates;
    }

    // En desarrollo, usar fechas de debug
    switch (phase) {
      case "submission":
        return {
          submissionEndDate: new Date("2025-12-26T23:59:59"), // Futuro - fase de envío
          votingStartDate: new Date("2025-12-27T00:00:00"), // Futuro
          votingEndDate: new Date("2025-12-31T23:59:59"), // Futuro
        };
      case "voting":
        return {
          submissionEndDate: new Date("2025-06-26T23:59:59"), // Pasado - envío cerrado
          votingStartDate: new Date("2025-06-27T00:00:00"), // Pasado - votación empezó
          votingEndDate: new Date("2025-12-31T23:59:59"), // Futuro - votación abierta
        };
      case "results":
        return {
          submissionEndDate: new Date("2025-06-26T23:59:59"), // Pasado
          votingStartDate: new Date("2025-06-27T00:00:00"), // Pasado
          votingEndDate: new Date("2025-06-30T23:59:59"), // Pasado - todo cerrado
        };
      default:
        return realContestDates;
    }
  };

  const contestDates = getContestDates(actualPhase);

  // Cambiar sortBy automáticamente cuando cambie la fase
  useEffect(() => {
    if (actualPhase === "results") {
      setSortBy("popular"); // En resultados, mostrar por ranking
    } else if (actualPhase === "voting") {
      setSortBy("random"); // En votación, aleatorio para justicia
    }
  }, [actualPhase]);

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

  // Usar la fase calculada (real en producción, debug en desarrollo)
  const currentPhase = actualPhase;

  // Mock participaciones (solo visibles en fase de voting)
  const submissions = [
    {
      id: 3,
      title: "El Último Testimonio",
      author: "Ana Rodríguez",
      authorId: "ana_rodriguez",
      excerpt:
        "No era solo un libro. Era el registro de cada alma que había encontrado refugio entre estos muros. Cada lágrima, cada sonrisa, cada sueño roto y reconstruido...",
      likes: 52, // MÁS LIKES - Primer lugar
      views: 203,
      publishedAt: "2025-07-03T20:45:00Z",
      wordCount: 756,
      readTime: "4 min",
      authorBadges: ["🏆", "⭐", "🔥"],
      authorWins: 5,
      isMature: false,
    },
    {
      id: 1,
      title: "El Guardián de los Secretos",
      author: "María Elena",
      authorId: "maria_elena",
      excerpt:
        "En el silencio sepulcral de la biblioteca, solo quedaba yo y aquel libro que parecía brillar con luz propia. Sus páginas amarillentas susurraban historias que nadie más había escuchado...",
      likes: 38, // SEGUNDO LUGAR
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
      likes: 31, // TERCER LUGAR
      views: 134,
      publishedAt: "2025-07-04T09:15:00Z",
      wordCount: 923,
      readTime: "5 min",
      authorBadges: ["⭐"],
      authorWins: 1,
      isMature: false,
    },
    {
      id: 4,
      title: "Ecos en el Vacío",
      author: "Miguel Santos",
      authorId: "miguel_santos",
      excerpt:
        "La biblioteca moría, pero su último libro contenía algo que ningún otro había logrado: el poder de hacer que los muertos hablaran una vez más...",
      likes: 18,
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
      likes: 12,
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
        // Solo disponible en fase de resultados
        if (currentPhase === "results") {
          return b.likes + b.views - (a.likes + a.views);
        }
        // Fallback a aleatorio si no es fase de resultados
        return Math.random() - 0.5;
      case "author":
        return a.author.localeCompare(b.author);
      case "length":
        return b.wordCount - a.wordCount;
      case "random":
        return Math.random() - 0.5;
      case "recent":
      default:
        return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
  });

  // Opciones de ordenamiento dinámicas según la fase
  const getSortOptions = () => {
    const baseOptions = [
      { value: "recent", label: "Más recientes" },
      { value: "random", label: "Orden aleatorio" },
      { value: "author", label: "Por autor (A-Z)" },
      { value: "length", label: "Por extensión" },
    ];

    // Solo mostrar "Más populares" en fase de resultados
    if (currentPhase === "results") {
      baseOptions.splice(1, 0, { value: "popular", label: "Más votadas" });
    }

    return baseOptions;
  };

  const sortOptions = getSortOptions();

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
        <div className="space-y-8">
          {/* Header de fase de envío */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PenTool className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Fase de envío de historias
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Los participantes están escribiendo sus historias. Las historias
              se revelarán el{" "}
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

          {/* Lista de participantes que ya enviaron */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Escritores que ya participaron
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sus historias se revelarán el{" "}
                  {currentContest.votingStartDate.toLocaleDateString("es-ES")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {submissions.length}
                </div>
                <div className="text-sm text-gray-500">participantes</div>
              </div>
            </div>

            {/* Grid de participantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {submission.author}
                        </span>
                        {/* Badges del autor */}
                        {submission.authorBadges.map((badge, i) => (
                          <span
                            key={i}
                            className="text-sm"
                            title={getBadgeInfo(badge).name}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{submission.authorWins} victorias</span>
                        <span>•</span>
                        <span>{formatDate(submission.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Indicador de envío */}
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Preview mínimo SIN spoilers */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>📝 Historia enviada</span>
                      <span>{submission.wordCount} palabras</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA para unirse */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-4">
                ¿Te animas a unirte a estos escritores?
              </p>
              <Link
                to={`/write/${currentContest.id}`}
                className="btn-primary inline-flex items-center"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Enviar mi historia
              </Link>
            </div>
          </div>

          {/* Estadísticas motivacionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {submissions.length}
              </div>
              <div className="text-blue-800 font-medium">
                Historias enviadas
              </div>
              <div className="text-sm text-blue-600 mt-1">¡Únete a ellos!</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.max(
                  0,
                  Math.ceil(
                    (currentContest.submissionEndDate - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}
              </div>
              <div className="text-green-800 font-medium">Días restantes</div>
              <div className="text-sm text-green-600 mt-1">
                Para enviar tu historia
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {submissions
                  .reduce(
                    (total, submission) => total + submission.wordCount,
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="text-purple-800 font-medium">
                Palabras escritas
              </div>
              <div className="text-sm text-purple-600 mt-1">
                Por la comunidad
              </div>
            </div>
          </div>
        </div>
      )}

      {(currentPhase === "voting" || currentPhase === "results") && (
        <>
          {/* Podio de ganadores - Solo en resultados */}
          {currentPhase === "results" && (
            <div className="mb-12 bg-gradient-to-br from-yellow-50 via-gray-50 to-orange-50 border border-yellow-200 rounded-2xl p-8">
              <div className="text-center mb-8">
                <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🏆 Ganadores del Concurso {currentContest.month}
                </h2>
                <p className="text-gray-600">
                  ¡Felicitaciones a nuestros escritores destacados!
                </p>
              </div>

              {/* Podio visual */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {sortedSubmissions.slice(0, 3).map((submission, index) => (
                  <div
                    key={submission.id}
                    className={`relative ${
                      index === 0
                        ? "md:order-2 transform md:scale-110" // Ganador en el centro y más grande
                        : index === 1
                        ? "md:order-1" // Segundo lugar a la izquierda
                        : "md:order-3" // Tercer lugar a la derecha
                    }`}
                  >
                    {/* Card del ganador */}
                    <div
                      className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-transform hover:scale-105 ${
                        index === 0
                          ? "border-yellow-300"
                          : index === 1
                          ? "border-gray-300"
                          : "border-orange-300"
                      }`}
                    >
                      {/* Ribbon de posición */}
                      <div
                        className={`relative py-4 px-6 text-center text-white font-bold ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : index === 1
                            ? "bg-gradient-to-r from-gray-400 to-gray-600"
                            : "bg-gradient-to-r from-orange-400 to-orange-600"
                        }`}
                      >
                        <div className="text-3xl mb-1">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                        <div className="text-lg font-bold">
                          {index === 0
                            ? "1º LUGAR"
                            : index === 1
                            ? "2º LUGAR"
                            : "3º LUGAR"}
                        </div>
                        {index === 0 && (
                          <div className="text-sm opacity-90 mt-1">
                            🏆 GANADOR
                          </div>
                        )}
                      </div>

                      {/* Contenido de la historia */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                          {submission.title}
                        </h3>

                        {/* Autor con badges */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-900">
                                {submission.author}
                              </span>
                              {submission.authorBadges.map((badge, i) => (
                                <span
                                  key={i}
                                  className="text-sm"
                                  title={getBadgeInfo(badge).name}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {submission.authorWins} victorias
                            </div>
                          </div>
                        </div>

                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {submission.excerpt}
                        </p>

                        {/* Estadísticas */}
                        <div className="flex items-center justify-between mb-4 text-sm">
                          <div className="flex items-center gap-3 text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-red-400" />
                              <span className="font-medium text-red-600">
                                {submission.likes}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {submission.views}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            {submission.readTime} • {submission.wordCount}{" "}
                            palabras
                          </div>
                        </div>

                        {/* Botón leer */}
                        <Link
                          to={`/story/${submission.id}`}
                          className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-colors ${
                            index === 0
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                              : "bg-primary-600 hover:bg-primary-700 text-white"
                          }`}
                        >
                          Leer historia ganadora →
                        </Link>
                      </div>
                    </div>

                    {/* Decoración adicional para el ganador */}
                    {index === 0 && (
                      <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mensaje de felicitación */}
              <div className="text-center mt-8 p-4 bg-white/60 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>¡Felicitaciones a todos los participantes!</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Cada historia aportó algo único al concurso de{" "}
                  {currentContest.month}
                </p>
              </div>
            </div>
          )}

          {/* Resto de participaciones */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {currentPhase === "results"
                ? `Todas las participaciones (${submissions.length})`
                : `Participaciones (${submissions.length})`}
            </h3>
            {currentPhase === "voting" && (
              <p className="text-sm text-green-600 mb-4">
                🗳️ Votación activa - Votos ocultos para decisiones imparciales
              </p>
            )}
            {currentPhase === "results" && (
              <p className="text-sm text-yellow-600 mb-4">
                🏆 Resultados finales - Ordenadas por número de votos recibidos
              </p>
            )}
          </div>
          {/* Filtros y controles */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("compact")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "compact"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="h-4 w-4" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("expanded")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "expanded"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Cards
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de participaciones */}
          {viewMode === "compact" ? (
            /* Vista COMPACTA - Lista densa */
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div
                  className={`grid gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide ${
                    currentPhase === "results" ? "grid-cols-12" : "grid-cols-10"
                  }`}
                >
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Historia</div>
                  <div className="col-span-2">Autor</div>
                  {currentPhase === "results" && (
                    <div className="col-span-2 text-center">Estadísticas</div>
                  )}
                  <div className="col-span-2 text-center">Tiempo</div>
                  <div className="col-span-1 text-center">Acción</div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {sortedSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className={`grid gap-4 items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                      currentPhase === "results"
                        ? "grid-cols-12"
                        : "grid-cols-10"
                    }`}
                  >
                    {/* Ranking */}
                    <div className="col-span-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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

                    {/* Título + badges */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {submission.title}
                        </h3>
                        {submission.isMature && (
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-medium">
                            18+
                          </span>
                        )}
                        {currentPhase === "results" && index === 0 && (
                          <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-bold">
                            🏆
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {submission.wordCount} palabras • {submission.readTime}
                      </div>
                    </div>

                    {/* Autor */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900 truncate text-sm">
                          {submission.author}
                        </span>
                        {submission.authorBadges.map((badge, i) => (
                          <span
                            key={i}
                            className="text-xs"
                            title={getBadgeInfo(badge).name}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.authorWins} victorias
                      </div>
                    </div>

                    {/* Estadísticas - Solo en resultados */}
                    {currentPhase === "results" && (
                      <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-400" />
                            {submission.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {submission.views}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tiempo */}
                    <div className="col-span-2 text-center text-xs text-gray-500">
                      {formatDate(submission.publishedAt)}
                    </div>

                    {/* Acción */}
                    <div className="col-span-1 text-center">
                      <Link
                        to={`/story/${submission.id}`}
                        className="text-xs px-2 py-1 rounded font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
                      >
                        Leer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Vista EXPANDIDA - Cards originales */
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
                        {/* Información temporal - siempre visible */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(submission.publishedAt)}
                          </div>
                        </div>

                        {/* Estadísticas - solo en resultados */}
                        {currentPhase === "results" && (
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1 text-red-400" />
                              {submission.likes} likes
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {submission.views} lecturas
                            </div>
                          </div>
                        )}

                        <Link
                          to={`/story/${submission.id}`}
                          className="text-sm px-4 py-2 btn-primary"
                        >
                          Leer historia →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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
            {process.env.NODE_ENV === "production" && (
              <span className="text-green-400 ml-2">(REAL)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentContest;
