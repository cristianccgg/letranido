import { useState, useEffect, useCallback } from "react";
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
  Loader,
} from "lucide-react";
import { useVotingStats } from "../hooks/useVotingStats";
import VotingGuidance from "../components/voting/VotingGuidance";
import { useContests } from "../hooks/useContests";
import { useStories } from "../hooks/useStories";
import { useAuthStore } from "../store/authStore";

const CurrentContest = () => {
  const [sortBy, setSortBy] = useState("random");
  const [debugPhase, setDebugPhase] = useState("voting"); // Solo para desarrollo
  const [viewMode, setViewMode] = useState("compact");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState(null);

  // Hooks
  const { currentContest, loading: contestLoading } = useContests();
  const { getStoriesByContest } = useStories();
  const { user } = useAuthStore();
  const { userVotesCount, currentContestVotes } = useVotingStats();

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

  // Cargar historias del concurso actual
  const loadStories = useCallback(async () => {
    // Esperar a que el concurso se haya cargado completamente
    if (contestLoading) {
      console.log("⏳ Esperando a que termine de cargar el concurso...");
      return;
    }

    if (!currentContest) {
      console.log("ℹ️ No hay concurso actual disponible");
      setSubmissions([]);
      setLoadingSubmissions(false);
      return;
    }

    setLoadingSubmissions(true);
    setError(null);

    try {
      console.log(
        "🔍 Cargando historias para concurso:",
        currentContest.id,
        currentContest.title
      );

      const result = await getStoriesByContest(currentContest.id);

      if (result.success) {
        console.log("✅ Historias cargadas:", result.stories.length);
        setSubmissions(result.stories || []);
      } else {
        console.error("❌ Error cargando historias:", result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error("💥 Error inesperado:", err);
      setError("Error inesperado al cargar las historias");
    } finally {
      setLoadingSubmissions(false);
    }
  }, [currentContest?.id, contestLoading, getStoriesByContest]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Cambiar sortBy automáticamente cuando cambie la fase
  useEffect(() => {
    if (actualPhase === "results") {
      setSortBy("popular"); // En resultados, mostrar por ranking
    } else if (actualPhase === "voting") {
      setSortBy("random"); // En votación, aleatorio para justicia
    }
  }, [actualPhase]);

  // Obtener datos del concurso con fechas dinámicas
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

  // Combinar datos del concurso real con fechas dinámicas
  const contestData = currentContest
    ? {
        ...currentContest,
        ...contestDates,
      }
    : null;

  // Determinar fase actual
  const currentPhase = actualPhase;

  const sortedSubmissions = [...submissions].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        // Solo disponible en fase de resultados
        if (currentPhase === "results") {
          return (
            (b.likes_count || 0) +
            (b.views_count || 0) -
            ((a.likes_count || 0) + (a.views_count || 0))
          );
        }
        // Fallback a aleatorio si no es fase de resultados
        return Math.random() - 0.5;
      case "author":
        return (a.user_profiles?.display_name || "").localeCompare(
          b.user_profiles?.display_name || ""
        );
      case "length":
        return (b.word_count || 0) - (a.word_count || 0);
      case "random":
        return Math.random() - 0.5;
      case "recent":
      default:
        return new Date(b.created_at) - new Date(a.created_at);
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

  // Calcular tiempo de lectura estimado
  const calculateReadTime = (wordCount) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  // Loading states
  if (contestLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Cargando concurso...</p>
        </div>
      </div>
    );
  }

  if (!contestData) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <div className="text-gray-600 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">No hay concurso activo</h2>
          <p>Actualmente no hay ningún concurso disponible.</p>
        </div>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

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
                {contestData.month || "Mes actual"}
              </span>
              <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
                {contestData.category || "Ficción"}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {contestData.title}
            </h1>

            <p className="text-gray-600 leading-relaxed mb-4">
              {contestData.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {submissions.length} participantes
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {currentPhase === "submission" &&
                  `Envíos hasta ${contestData.submissionEndDate.toLocaleDateString(
                    "es-ES"
                  )}`}
                {currentPhase === "voting" &&
                  `Votación hasta ${contestData.votingEndDate.toLocaleDateString(
                    "es-ES"
                  )}`}
                {currentPhase === "results" && "Concurso finalizado"}
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                Insignia de Oro + Destacado del mes
              </div>
            </div>
          </div>

          {/* Botón dinámico según la fase */}
          <div className="ml-6">
            {currentPhase === "submission" && (
              <Link
                to={`/write/${contestData.id}`}
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
                  to={`/write/${contestData.id}`}
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
                {contestData.votingStartDate.toLocaleDateString("es-ES")}
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
              to={`/write/${contestData.id}`}
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
                  {contestData.votingStartDate.toLocaleDateString("es-ES")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {loadingSubmissions ? "..." : submissions.length}
                </div>
                <div className="text-sm text-gray-500">participantes</div>
              </div>
            </div>

            {/* Loading state */}
            {loadingSubmissions && (
              <div className="text-center py-8">
                <Loader className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                <p className="text-gray-600">Cargando participantes...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Grid de participantes */}
            {!loadingSubmissions && !error && submissions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Aún no hay participantes en este concurso.
                </p>
                <Link
                  to={`/write/${contestData.id}`}
                  className="btn-primary inline-flex items-center"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  ¡Sé el primero!
                </Link>
              </div>
            )}

            {!loadingSubmissions && !error && submissions.length > 0 && (
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
                            {submission.user_profiles?.display_name ||
                              "Usuario"}
                          </span>
                          {/* Badges del autor */}
                          {submission.user_profiles?.wins_count > 0 && (
                            <span
                              className="text-sm"
                              title="Ganador de concursos"
                            >
                              🏆
                            </span>
                          )}
                          {submission.user_profiles?.total_likes > 50 && (
                            <span className="text-sm" title="Autor popular">
                              ⭐
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            {submission.user_profiles?.wins_count || 0}{" "}
                            victorias
                          </span>
                          <span>•</span>
                          <span>{formatDate(submission.created_at)}</span>
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
                        <span>{submission.word_count || 0} palabras</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA para unirse */}
            {!loadingSubmissions && !error && submissions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-4">
                  ¿Te animas a unirte a estos escritores?
                </p>
                <Link
                  to={`/write/${contestData.id}`}
                  className="btn-primary inline-flex items-center"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Enviar mi historia
                </Link>
              </div>
            )}
          </div>

          {/* Estadísticas motivacionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {loadingSubmissions ? "..." : submissions.length}
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
                    (contestData.submissionEndDate - new Date()) /
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
                {loadingSubmissions
                  ? "..."
                  : submissions
                      .reduce(
                        (total, submission) =>
                          total + (submission.word_count || 0),
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
          {/* Voting Guidance - Solo en fase de votación */}
          {currentPhase === "voting" && (
            <VotingGuidance
              currentPhase={currentPhase}
              userVotesCount={currentContestVotes}
              totalStories={submissions.length}
              contestMonth={contestData.month}
            />
          )}

          {/* Podio de ganadores - Solo en resultados */}
          {currentPhase === "results" && sortedSubmissions.length > 0 && (
            <div className="mb-12 bg-gradient-to-br from-yellow-50 via-gray-50 to-orange-50 border border-yellow-200 rounded-2xl p-8">
              <div className="text-center mb-8">
                <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🏆 Ganadores del Concurso {contestData.month}
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
                                {submission.user_profiles?.display_name ||
                                  "Usuario"}
                              </span>
                              {submission.user_profiles?.wins_count > 0 && (
                                <span
                                  className="text-sm"
                                  title="Ganador de concursos"
                                >
                                  🏆
                                </span>
                              )}
                              {submission.user_profiles?.total_likes > 50 && (
                                <span className="text-sm" title="Autor popular">
                                  ⭐
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {submission.user_profiles?.wins_count || 0}{" "}
                              victorias
                            </div>
                          </div>
                        </div>

                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {submission.content?.substring(0, 200)}...
                        </p>

                        {/* Estadísticas */}
                        <div className="flex items-center justify-between mb-4 text-sm">
                          <div className="flex items-center gap-3 text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-red-400" />
                              <span className="font-medium text-red-600">
                                {submission.likes_count || 0}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {submission.views_count || 0}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            {calculateReadTime(submission.word_count || 0)} •{" "}
                            {submission.word_count || 0} palabras
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
                  {contestData.month}
                </p>
              </div>
            </div>
          )}

          {/* Resto de participaciones */}
          {!loadingSubmissions && !error && submissions.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentPhase === "results"
                    ? `Todas las participaciones (${submissions.length})`
                    : `Participaciones (${submissions.length})`}
                </h3>
                {currentPhase === "voting" && (
                  <p className="text-sm text-green-600 mb-4">
                    🗳️ Votación activa - Votos ocultos para decisiones
                    imparciales
                  </p>
                )}
                {currentPhase === "results" && (
                  <p className="text-sm text-yellow-600 mb-4">
                    🏆 Resultados finales - Ordenadas por número de votos
                    recibidos
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
                        currentPhase === "results"
                          ? "grid-cols-12"
                          : "grid-cols-10"
                      }`}
                    >
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Historia</div>
                      <div className="col-span-2">Autor</div>
                      {currentPhase === "results" && (
                        <div className="col-span-2 text-center">
                          Estadísticas
                        </div>
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
                            {submission.is_mature && (
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
                            {submission.word_count || 0} palabras •{" "}
                            {calculateReadTime(submission.word_count || 0)}
                          </div>
                        </div>

                        {/* Autor */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-900 truncate text-sm">
                              {submission.user_profiles?.display_name ||
                                "Usuario"}
                            </span>
                            {submission.user_profiles?.wins_count > 0 && (
                              <span
                                className="text-xs"
                                title="Ganador de concursos"
                              >
                                🏆
                              </span>
                            )}
                            {submission.user_profiles?.total_likes > 50 && (
                              <span className="text-xs" title="Autor popular">
                                ⭐
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.user_profiles?.wins_count || 0}{" "}
                            victorias
                          </div>
                        </div>

                        {/* Estadísticas - Solo en resultados */}
                        {currentPhase === "results" && (
                          <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-400" />
                                {submission.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {submission.views_count || 0}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Tiempo */}
                        <div className="col-span-2 text-center text-xs text-gray-500">
                          {formatDate(submission.created_at)}
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
                                {submission.is_mature && (
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
                                    {submission.user_profiles?.display_name ||
                                      "Usuario"}
                                  </span>
                                </span>

                                {/* Badges del autor */}
                                {(submission.user_profiles?.wins_count > 0 ||
                                  submission.user_profiles?.total_likes >
                                    50) && (
                                  <div className="flex items-center gap-1">
                                    {submission.user_profiles?.wins_count >
                                      0 && (
                                      <span
                                        className="text-xs text-yellow-600"
                                        title="Ganador de concursos"
                                      >
                                        🏆
                                      </span>
                                    )}
                                    {submission.user_profiles?.total_likes >
                                      50 && (
                                      <span
                                        className="text-xs text-blue-600"
                                        title="Autor popular"
                                      >
                                        ⭐
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      (
                                      {submission.user_profiles?.wins_count ||
                                        0}{" "}
                                      victorias)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right text-sm text-gray-500">
                              <div>
                                {calculateReadTime(submission.word_count || 0)}
                              </div>
                              <div>{submission.word_count || 0} palabras</div>
                            </div>
                          </div>

                          <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                            {submission.content?.substring(0, 200) ||
                              "Sin contenido disponible"}
                            ...
                          </p>

                          <div className="flex items-center justify-between">
                            {/* Información temporal - siempre visible */}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(submission.created_at)}
                              </div>
                            </div>

                            {/* Estadísticas - solo en resultados */}
                            {currentPhase === "results" && (
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Heart className="h-4 w-4 mr-1 text-red-400" />
                                  {submission.likes_count || 0} likes
                                </div>
                                <div className="flex items-center">
                                  <Eye className="h-4 w-4 mr-1" />
                                  {submission.views_count || 0} lecturas
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

          {/* Loading state para historias */}
          {loadingSubmissions && (
            <div className="text-center py-12">
              <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
              <p className="text-gray-600">Cargando historias...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loadingSubmissions && !error && submissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <PenTool className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aún no hay participaciones
              </h3>
              <p className="text-gray-600 mb-6">
                Sé el primero en enviar una historia a este concurso
              </p>
              <Link
                to={`/write/${contestData.id}`}
                className="btn-primary inline-flex items-center"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Escribir historia
              </Link>
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
                  {contestData.submissionEndDate.toLocaleDateString("es-ES")}
                </strong>{" "}
                para enviar tu historia al concurso de {contestData.month}.
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
                  {contestData.votingEndDate.toLocaleDateString("es-ES")}
                </strong>
                .
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/write/${contestData.id}`}
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
            {contestData.month}. ¡Nos vemos en el próximo mes para una nueva
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
          <div className="text-xs text-gray-400 mt-1">
            Historias: {submissions.length} | Cargando:{" "}
            {loadingSubmissions ? "Sí" : "No"}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentContest;
