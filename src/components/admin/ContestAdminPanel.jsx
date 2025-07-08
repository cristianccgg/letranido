import React, { useState, useEffect } from "react";
import {
  Trophy,
  Settings,
  Eye,
  Clock,
  Users,
  Award,
  AlertTriangle,
  Check,
  X,
  Crown,
  Medal,
  Star,
  Plus,
  Edit,
  Calendar,
  Save,
  RefreshCw,
} from "lucide-react";
import { useContests } from "../../hooks/useContests";
import { useContestFinalization } from "../../hooks/useContestFinalization";
import { useAuthStore } from "../../store/authStore";

const ContestAdminPanel = () => {
  const [selectedContest, setSelectedContest] = useState(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [winners, setWinners] = useState(null);
  const [finalizationResult, setFinalizationResult] = useState(null);
  const [editingContest, setEditingContest] = useState(null);

  const { user } = useAuthStore();
  const {
    contests,
    loading: contestsLoading,
    refetch,
    createContest,
    updateContest,
  } = useContests();
  const {
    finalizeContest,
    previewWinners,
    loading: finalizationLoading,
  } = useContestFinalization();

  // Solo mostrar a administradores
  const isAdmin = user?.is_admin || user?.email === "admin@literalab.com";

  // Form state para crear/editar concurso
  const [contestForm, setContestForm] = useState({
    title: "",
    description: "",
    category: "Ficción",
    month: "",
    min_words: 100,
    max_words: 1000,
    submission_deadline: "",
    voting_deadline: "",
    prize: "Insignia de Oro + Destacado del mes",
    status: "submission",
  });

  useEffect(() => {
    if (!contestsLoading && contests.length > 0) {
      const finalizableContest = contests.find(
        (contest) =>
          contest.status === "voting" || contest.status === "submission"
      );
      if (finalizableContest) {
        setSelectedContest(finalizableContest);
      }
    }
  }, [contests, contestsLoading]);

  // Resetear form
  const resetForm = () => {
    const now = new Date();
    const thisMonth = now.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    // Sugerir fechas por defecto
    const submissionEnd = new Date(now);
    submissionEnd.setDate(now.getDate() + 20); // 20 días para envíos

    const votingEnd = new Date(submissionEnd);
    votingEnd.setDate(submissionEnd.getDate() + 7); // 7 días para votación

    setContestForm({
      title: "",
      description: "",
      category: "Ficción",
      month: thisMonth,
      min_words: 100,
      max_words: 1000,
      submission_deadline: submissionEnd.toISOString().slice(0, 16),
      voting_deadline: votingEnd.toISOString().slice(0, 16),
      prize: "Insignia de Oro + Destacado del mes",
      status: "submission",
    });
  };

  // Crear nuevo concurso
  const handleCreateContest = async (e) => {
    e.preventDefault();

    if (!contestForm.title.trim() || !contestForm.description.trim()) {
      alert("Título y descripción son obligatorios");
      return;
    }

    try {
      const result = await createContest({
        ...contestForm,
        start_date: new Date().toISOString(),
        end_date: contestForm.voting_deadline,
      });

      if (result.success) {
        alert("¡Concurso creado exitosamente!");
        setShowCreateModal(false);
        resetForm();
        await refetch();
      } else {
        alert("Error al crear concurso: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado: " + error.message);
    }
  };

  // Editar concurso existente
  const handleEditContest = (contest) => {
    setEditingContest(contest);
    setContestForm({
      title: contest.title,
      description: contest.description,
      category: contest.category,
      month: contest.month,
      min_words: contest.min_words,
      max_words: contest.max_words,
      submission_deadline: new Date(contest.submission_deadline)
        .toISOString()
        .slice(0, 16),
      voting_deadline: new Date(contest.voting_deadline)
        .toISOString()
        .slice(0, 16),
      prize: contest.prize || "Insignia de Oro + Destacado del mes",
      status: contest.status,
    });
    setShowEditModal(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingContest) return;

    try {
      const result = await updateContest(editingContest.id, {
        ...contestForm,
        end_date: contestForm.voting_deadline,
      });

      if (result.success) {
        alert("¡Concurso actualizado exitosamente!");
        setShowEditModal(false);
        setEditingContest(null);
        resetForm();
        await refetch();
      } else {
        alert("Error al actualizar concurso: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado: " + error.message);
    }
  };

  // Cambiar status rápidamente
  const handleQuickStatusChange = async (contest, newStatus) => {
    if (confirm(`¿Cambiar status de "${contest.title}" a "${newStatus}"?`)) {
      try {
        const result = await updateContest(contest.id, { status: newStatus });
        if (result.success) {
          alert("Status actualizado exitosamente");
          await refetch();
        } else {
          alert("Error: " + result.error);
        }
      } catch (error) {
        alert("Error inesperado: " + error.message);
      }
    }
  };

  const handlePreviewWinners = async (contest) => {
    const result = await previewWinners(contest.id);
    if (result.success) {
      setWinners(result.winners);
      setSelectedContest(contest);
      setShowFinalizationModal(true);
    } else {
      alert("Error al obtener vista previa: " + result.error);
    }
  };

  const handleFinalizeContest = async () => {
    if (!selectedContest) return;

    const result = await finalizeContest(selectedContest.id);
    setFinalizationResult(result);

    if (result.success) {
      await refetch();
      setShowFinalizationModal(false);
      setSelectedContest(null);
      setWinners(null);
    }
  };

  const categories = [
    "Ficción",
    "Drama",
    "Poesía",
    "Ensayo",
    "Humor",
    "Terror",
    "Romance",
    "Ciencia Ficción",
    "Fantasía",
    "Misterio",
  ];

  const statusOptions = [
    { value: "submission", label: "Envíos abiertos", color: "blue" },
    { value: "voting", label: "En votación", color: "green" },
    { value: "results", label: "Finalizado", color: "gray" },
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-gray-500 mb-4">
          <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Acceso restringido</h2>
          <p>Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  if (contestsLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 mr-3 text-primary-600" />
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de concursos y asignación de badges
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Concurso
          </button>
          <div className="text-sm text-gray-500">
            Conectado como: <span className="font-medium">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Resultado de finalización */}
      {finalizationResult && (
        <div
          className={`rounded-lg p-6 border ${
            finalizationResult.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start">
            {finalizationResult.success ? (
              <Check className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
            ) : (
              <X className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3
                className={`font-bold ${
                  finalizationResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {finalizationResult.success
                  ? "¡Concurso finalizado exitosamente!"
                  : "Error al finalizar"}
              </h3>
              <p
                className={`mt-1 ${
                  finalizationResult.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {finalizationResult.message || finalizationResult.error}
              </p>

              {finalizationResult.success &&
                finalizationResult.badgesAwarded && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      Badges otorgados:
                    </h4>
                    <div className="space-y-2">
                      {finalizationResult.badgesAwarded.map((award, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className="mr-2">
                            {award.position === 1
                              ? "🥇"
                              : award.position === 2
                              ? "🥈"
                              : "🥉"}
                          </span>
                          <span className="font-medium">{award.userName}</span>
                          <span className="mx-2">→</span>
                          <span className="text-green-700">
                            {award.badge.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <button
              onClick={() => setFinalizationResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de concursos */}
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Concursos ({contests.length})
          </h2>
          <button
            onClick={() => refetch()}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>

        {contests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No hay concursos disponibles</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
            >
              Crear primer concurso
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${
                  contest.status === "results" ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contest.status === "submission"
                          ? "bg-blue-100 text-blue-700"
                          : contest.status === "voting"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {contest.status === "submission"
                        ? "Envíos"
                        : contest.status === "voting"
                        ? "Votación"
                        : "Finalizado"}
                    </span>
                    <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-xs">
                      {contest.month}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditContest(contest)}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Editar concurso"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {contest.status === "results" && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {contest.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {contest.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {contest.participants_count || 0} participantes
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {contest.voting_deadline
                      ? new Date(contest.voting_deadline).toLocaleDateString(
                          "es-ES"
                        )
                      : "Sin fecha"}
                  </div>
                </div>

                {/* Fechas importantes */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      <strong>Envíos hasta:</strong>{" "}
                      {contest.submission_deadline
                        ? new Date(contest.submission_deadline).toLocaleString(
                            "es-ES"
                          )
                        : "No definido"}
                    </div>
                    <div>
                      <strong>Votación hasta:</strong>{" "}
                      {contest.voting_deadline
                        ? new Date(contest.voting_deadline).toLocaleString(
                            "es-ES"
                          )
                        : "No definido"}
                    </div>
                  </div>
                </div>

                {/* Botones de acción rápida */}
                {contest.status !== "results" && (
                  <div className="mb-3 flex gap-2">
                    {contest.status === "submission" && (
                      <button
                        onClick={() =>
                          handleQuickStatusChange(contest, "voting")
                        }
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        → Iniciar votación
                      </button>
                    )}
                    {contest.status === "voting" && (
                      <button
                        onClick={() =>
                          handleQuickStatusChange(contest, "submission")
                        }
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ← Volver a envíos
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {contest.status !== "results" && (
                    <button
                      onClick={() => handlePreviewWinners(contest)}
                      disabled={finalizationLoading}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      {finalizationLoading
                        ? "Cargando..."
                        : "Finalizar concurso"}
                    </button>
                  )}

                  <a
                    href="/contest/current"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center text-decoration-none"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver en sitio
                  </a>
                </div>

                {contest.status === "results" && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      <span>Concurso finalizado</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear concurso */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateContest} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Plus className="h-6 w-6 mr-2 text-green-600" />
                  Crear Nuevo Concurso
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del concurso *
                  </label>
                  <input
                    type="text"
                    required
                    value={contestForm.title}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={contestForm.category}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes
                  </label>
                  <input
                    type="text"
                    value={contestForm.month}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, month: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras mínimas
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={contestForm.min_words}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        min_words: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras máximas
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={contestForm.max_words}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        max_words: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de envíos
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.submission_deadline}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        submission_deadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de votación
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.voting_deadline}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        voting_deadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Premio
                  </label>
                  <input
                    type="text"
                    value={contestForm.prize}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, prize: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status actual
                  </label>
                  <select
                    value={contestForm.status}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de finalización */}
      {showFinalizationModal && selectedContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
                  Finalizar "{selectedContest.title}"
                </h2>
                <button
                  onClick={() => setShowFinalizationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-1">
                      ¿Estás seguro?
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      Esta acción finalizará el concurso, otorgará badges
                      automáticamente a los ganadores y no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista previa de ganadores */}
              {winners && winners.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Vista previa de ganadores:
                  </h3>
                  <div className="space-y-3">
                    {winners.slice(0, 3).map((story, index) => (
                      <div
                        key={story.id}
                        className={`flex items-center p-4 rounded-lg border-2 ${
                          index === 0
                            ? "border-yellow-300 bg-yellow-50"
                            : index === 1
                            ? "border-gray-300 bg-gray-50"
                            : "border-orange-300 bg-orange-50"
                        }`}
                      >
                        <div className="mr-4">
                          {index === 0 ? (
                            <Crown className="h-8 w-8 text-yellow-600" />
                          ) : index === 1 ? (
                            <Medal className="h-8 w-8 text-gray-600" />
                          ) : (
                            <Star className="h-8 w-8 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">
                              {index === 0 ? "1º" : index === 1 ? "2º" : "3º"}{" "}
                              Lugar
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                index === 0
                                  ? "bg-yellow-200 text-yellow-800"
                                  : index === 1
                                  ? "bg-gray-200 text-gray-800"
                                  : "bg-orange-200 text-orange-800"
                              }`}
                            >
                              {story.likes_count || 0} likes
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {story.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            por {story.user_profiles?.display_name || "Usuario"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Recibirá:</div>
                          <div
                            className={`font-medium ${
                              index === 0
                                ? "text-yellow-700"
                                : index === 1
                                ? "text-gray-700"
                                : "text-orange-700"
                            }`}
                          >
                            {index === 0
                              ? "🏆 Badge Ganador"
                              : index === 1
                              ? "🥈 Badge Segundo"
                              : "🥉 Badge Tercero"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {winners && winners.length === 0 && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-center">
                    No hay participaciones en este concurso para finalizar.
                  </p>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowFinalizationModal(false)}
                  disabled={finalizationLoading}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizeContest}
                  disabled={
                    finalizationLoading || !winners || winners.length === 0
                  }
                  className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {finalizationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Sí, finalizar concurso
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug en desarrollo */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-bold mb-2">
            🚨 DEBUG - Solo desarrollo
          </h4>
          <button
            onClick={() => {
              if (window.__authStoreCleanup) {
                window.__authStoreCleanup();
                window.location.reload();
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-4"
          >
            Limpiar AuthStore y recargar
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              alert("LocalStorage limpiado");
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Limpiar LocalStorage
          </button>
        </div>
      )}
    </div>
  );
};

export default ContestAdminPanel;
