// pages/ContestHistory.jsx - NUEVO: Lista de concursos pasados
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Users,
  Crown,
  Medal,
  Award,
  Star,
  Clock,
  ArrowRight,
  Filter,
  Search,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";

const ContestHistory = () => {
  const { contests, contestsLoading, getStoriesByContest } = useGlobalApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [contestsWithWinners, setContestsWithWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ SOLO MOSTRAR CONCURSOS FINALIZADOS
  const finishedContests = contests.filter(
    (contest) => contest.status === "results"
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
                const sortedStories = result.stories.sort(
                  (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
                );

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
  }, [finishedContests, getStoriesByContest]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    });
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-500" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  // ✅ LOADING STATES
  if (contestsLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Loader className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Cargando historial de concursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Historial de Concursos
        </h1>
        <p className="text-gray-600 mb-6">
          Explora concursos pasados y descubre a los ganadores
        </p>

        {/* Link al concurso actual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                ¿Buscas el concurso actual?
              </h3>
              <p className="text-blue-700 text-sm">
                Participa o vota en el concurso activo de este mes
              </p>
            </div>
            <Link
              to="/contest/current"
              className="btn-primary flex items-center"
            >
              Ver concurso actual
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concursos por título o mes..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredContests.length} concurso
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron concursos
          </h3>
          <p className="text-gray-600">
            {searchTerm.trim() || selectedCategory !== "all"
              ? "Intenta con otros términos de búsqueda o filtros diferentes"
              : "Aún no hay concursos finalizados en el historial"}
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filteredContests.map((contest) => (
            <div
              key={contest.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Contest Header */}
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Trophy className="h-6 w-6 mr-3" />
                    <div>
                      <h2 className="text-xl font-bold">{contest.title}</h2>
                      <p className="text-primary-100">
                        {contest.month} • {contest.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-200">Finalizado</div>
                    <div className="text-xs text-primary-300">
                      {formatDate(contest.voting_deadline || contest.end_date)}
                    </div>
                  </div>
                </div>

                <p className="text-primary-100 text-sm">
                  {contest.description}
                </p>
              </div>

              {/* Contest Stats */}
              <div className="p-6">
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {contest.participants_count || 0}
                    </div>
                    <div className="text-sm text-gray-600">Participantes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {contest.totalStories || 0}
                    </div>
                    <div className="text-sm text-gray-600">Historias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {contest.min_words}-{contest.max_words}
                    </div>
                    <div className="text-sm text-gray-600">Palabras</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {contest.prize ? "🏆" : "🎖️"}
                    </div>
                    <div className="text-sm text-gray-600">Premio</div>
                  </div>
                </div>

                {/* Winners Section */}
                {contest.topStories && contest.topStories.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                      Ganadores
                    </h3>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {contest.topStories.slice(0, 3).map((story, index) => (
                        <div
                          key={story.id}
                          className={`p-4 rounded-lg border-2 ${
                            index === 0
                              ? "border-yellow-300 bg-yellow-50"
                              : index === 1
                              ? "border-gray-300 bg-gray-50"
                              : "border-orange-300 bg-orange-50"
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            {getRankIcon(index + 1)}
                            <span className="ml-2 font-bold">
                              {index === 0 ? "1º" : index === 1 ? "2º" : "3º"}{" "}
                              Lugar
                            </span>
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {story.title}
                          </h4>

                          <p className="text-sm text-gray-600 mb-2">
                            por {story.author}
                          </p>

                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-red-600">
                              ❤️ {story.likes_count || 0}
                            </span>
                            <Link
                              to={`/story/${story.id}`}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Leer →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay historias disponibles para este concurso</p>
                  </div>
                )}

                {/* Action Button */}
                <div className="text-center">
                  <Link
                    to={`/contest/${contest.id}`}
                    className="btn-primary inline-flex items-center"
                  >
                    Ver todas las historias de este concurso
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          ¿Te inspiraste con estas historias?
        </h3>
        <p className="text-gray-600 mb-6">
          Únete al concurso actual y demuestra tu talento literario
        </p>
        <Link to="/contest/current" className="btn-primary">
          Participar en el concurso actual
        </Link>
      </div>
    </div>
  );
};

export default ContestHistory;
