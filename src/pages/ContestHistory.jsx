// pages/ContestHistory.jsx - NUEVO: Lista de retos pasados
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Crown,
  ArrowRight,
  Filter,
  Search,
  Loader,
  AlertCircle,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { UserWithWinnerBadges } from "../components/ui/UserNameWithBadges";
import SEOHead from "../components/SEO/SEOHead";

const ContestHistory = () => {
  const { 
    contests, 
    contestsLoading, 
    getStoriesByContest, 
    clearFinishedContestsCache, 
    clearFinishedStoriesCache
  } = useGlobalApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [contestsWithWinners, setContestsWithWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ SOLO MOSTRAR CONCURSOS FINALIZADOS - MEMOIZADO PARA EVITAR BUCLES
  const finishedContests = useMemo(() => 
    contests.filter((contest) => contest.status === "results"),
    [contests]
  );

  // ✅ CARGAR GANADORES PARA CADA CONCURSO
  useEffect(() => {
    const loadContestWinners = async () => {
      if (finishedContests.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const contestsWithWinnersData = await Promise.all(
          finishedContests.map(async (contest) => {
            try {
              const result = await getStoriesByContest(contest.id);

              if (result.success && result.stories.length > 0) {
                // Ordenar por likes para obtener ganadores
                const sortedStories = result.stories.sort((a, b) => {
                  // Primero por likes_count (descendente)
                  const likesA = a.likes_count || 0;
                  const likesB = b.likes_count || 0;
                  if (likesB !== likesA) {
                    return likesB - likesA;
                  }
                  
                  // En caso de empate, por created_at (ascendente - más antigua primero)
                  const dateA = new Date(a.created_at);
                  const dateB = new Date(b.created_at);
                  return dateA - dateB;
                });

                return {
                  ...contest,
                  winner: sortedStories[0] || null,
                  secondPlace: sortedStories[1] || null,
                  thirdPlace: sortedStories[2] || null,
                  totalStories: result.stories.length,
                  topStories: sortedStories.slice(0, 3),
                };
              }

              return {
                ...contest,
                winner: null,
                totalStories: 0,
                topStories: [],
              };
            } catch (err) {
              console.error(`Error loading contest ${contest.id}:`, err);
              return {
                ...contest,
                winner: null,
                totalStories: 0,
                topStories: [],
              };
            }
          })
        );

        setContestsWithWinners(contestsWithWinnersData);
      } catch (error) {
        console.error("Error loading contest winners:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContestWinners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishedContests]);

  // ✅ FILTROS
  const filteredContests = contestsWithWinners.filter((contest) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contest.month.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || contest.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "Todas las categorías" },
    { value: "Ficción", label: "Ficción" },
    { value: "Drama", label: "Drama" },
    { value: "Poesía", label: "Poesía" },
    { value: "Ensayo", label: "Ensayo" },
    { value: "Terror", label: "Terror" },
    { value: "Romance", label: "Romance" },
    { value: "Ciencia Ficción", label: "Ciencia Ficción" },
    { value: "Fantasía", label: "Fantasía" },
  ];

  // ✅ LOADING STATES
  if (contestsLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600 dark:text-dark-300">Cargando historial de retos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Historial de Concursos"
        description="Explora todos los retos de escritura pasados de Letranido. Descubre las historias ganadoras, participantes destacados y la evolución de nuestra comunidad creativa."
        keywords="historial retos escritura, retos pasados letranido, historias ganadoras, escritores destacados"
        url="/contest-history"
        canonicalUrl="https://letranido.com/contest-history"
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-100 mb-2">
            Historial de Concursos
          </h1>
          <p className="text-gray-600 dark:text-dark-300 mb-6">
            Explora retos pasados y descubre a los ganadores
          </p>

          {/* Link al reto actual */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-lg mb-2">
                  ¿Buscas el reto actual?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Participa o vota en el reto activo de este mes
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to="/contest/current"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-center"
                >
                  Ver reto actual
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-800 dark:border-dark-600 hover:border-purple-300 dark:hover:border-purple-500 rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar retos por título o mes..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            
            {/* Cache Control - Solo en desarrollo */}
            {import.meta.env.DEV && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    clearFinishedContestsCache();
                    clearFinishedStoriesCache();
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors border border-gray-300 dark:border-dark-600"
                  title="[DEV] Limpiar caché de retos e historias finalizadas para forzar recarga"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  🔧 Dev: Actualizar caché
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-dark-300">
            {filteredContests.length} reto
            {filteredContests.length !== 1 ? "s" : ""} encontrado
            {filteredContests.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Contest Cards */}
        {filteredContests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Trophy className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-100 mb-2">
              No se encontraron retos
            </h3>
            <p className="text-gray-600 dark:text-dark-300">
              {searchTerm.trim() || selectedCategory !== "all"
                ? "Intenta con otros términos de búsqueda o filtros diferentes"
                : "Aún no hay retos finalizados en el historial"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest) => (
              <div
                key={contest.id}
                className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-indigo-100 dark:border-dark-600 hover:border-purple-200 dark:hover:border-purple-500 overflow-hidden"
              >
                {/* Contest Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium opacity-90">
                        {contest.month}
                      </span>
                    </div>
                    <div className="text-xs opacity-75">
                      {contest.totalStories || 0} historias
                    </div>
                  </div>

                  <h2 className="text-lg font-bold mb-2 leading-tight line-clamp-2">
                    {contest.title}
                  </h2>

                  <p className="text-sm opacity-80 line-clamp-2">
                    {contest.description}
                  </p>
                </div>

                {/* Winner Section */}
                <div className="p-6 dark:bg-dark-800">
                  {contest.winner ? (
                    <div className="mb-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-500 rounded-full flex items-center justify-center mr-3">
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-dark-300">
                          Historia ganadora
                        </span>
                      </div>

                      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-indigo-100 dark:border-dark-600">
                        <h3 className="font-bold text-gray-900 dark:text-dark-100 mb-2 line-clamp-1">
                          {contest.winner.title}
                        </h3>

                        <div className="text-sm text-gray-600 dark:text-dark-300 mb-3">
                          por{" "}
                          <UserWithWinnerBadges
                            userId={contest.winner.user_id}
                            userName={contest.winner.author}
                            className="inline-flex"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-dark-700/80 rounded-full">
                            <span className="text-red-500 text-sm">❤️</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-dark-300">
                              {contest.winner.likes_count || 0}
                            </span>
                          </div>
                          <Link
                            to={`/story/${contest.winner.id}`}
                            className="text-indigo-600 hover:text-purple-600 dark:text-indigo-400 dark:hover:text-purple-400 font-medium text-sm transition-colors duration-200"
                          >
                            Leer →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-dark-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin historias disponibles</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="text-center">
                    <Link
                      to={`/contest/${contest.id}`}
                      className="inline-flex items-center w-full justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ver todas las historias
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-50 to-accent-50 border border-indigo-200 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 dark:border-dark-600 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ¿Te inspiraste con estas historias?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Únete al reto actual y demuestra tu talento literario
          </p>
          <Link
            to="/contest/current"
            className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600"
          >
            <BookOpen className="h-5 w-5 mr-3" />
            Participar en el reto actual
            <ArrowRight className="h-5 w-5 ml-3" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default ContestHistory;
