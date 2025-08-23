// components/admin/ModerationDashboard.jsx - Dashboard de Moderación
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  Users,
  BarChart3,
  RefreshCw,
  Filter,
  Search,
  Star,
  MessageSquare,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import { useModeración } from "../../hooks/useModeración";
import StoryReviewModal from "./StoryReviewModal";
import { supabase } from "../../lib/supabase";

const ModerationDashboard = () => {
  const { user, currentContest, contests, isAdmin } = useGlobalApp();
  const {
    loading,
    estadisticas,
    analizarHistoriasConcurso,
    obtenerHistoriasParaRevisión,
    actualizarEstadoModeración,
    obtenerEstadisticasConcurso,
  } = useModeración();

  const [selectedContest, setSelectedContest] = useState(null);
  const [historiasParaRevisión, setHistoriasParaRevisión] = useState([]);
  const [allStories, setAllStories] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [búsqueda, setBúsqueda] = useState("");
  const [selectedStory, setSelectedStory] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  // Cache persistente usando localStorage
  const [contestCache, setContestCache] = useState(() => {
    try {
      const saved = localStorage.getItem("moderationCache");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [lastAnalyzed, setLastAnalyzed] = useState(() => {
    try {
      const saved = localStorage.getItem("moderationLastAnalyzed");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Guardar cache en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("moderationCache", JSON.stringify(contestCache));
  }, [contestCache]);

  useEffect(() => {
    localStorage.setItem(
      "moderationLastAnalyzed",
      JSON.stringify(lastAnalyzed)
    );
  }, [lastAnalyzed]);

  // Inicializar con concurso actual - SOLO seleccionar, no cargar automáticamente
  useEffect(() => {
    if (currentContest && !selectedContest) {
      setSelectedContest(currentContest);
      // NO cargar automáticamente - usar cache si existe
      if (contestCache[currentContest.id]) {
        const cachedData = contestCache[currentContest.id];
        setAllStories(cachedData.resultados || []);
        setHistoriasParaRevisión(cachedData.requierenRevisión || []);
      }
    }
  }, [currentContest, selectedContest, contestCache]);

  // NO cargar automáticamente cuando cambie el concurso - solo manual
  // useEffect eliminado para evitar cargas automáticas

  const loadModerationDataWithCache = async (
    contestId,
    forceRefresh = false
  ) => {
    if (!contestId || loading) return;

    // ✅ VERIFICAR CACHE PRIMERO - PERMANENTE hasta actualización manual
    if (!forceRefresh && contestCache[contestId]) {
      console.log("💾 Usando cache permanente para concurso:", contestId);

      const cachedData = contestCache[contestId];
      setAllStories(cachedData.resultados || []);
      setHistoriasParaRevisión(cachedData.requierenRevisión || []);
      return;
    }

    try {
      // 🛡️ MODO PRODUCCIÓN - Guarda en base de datos
      console.log(
        forceRefresh
          ? "🔄 Forzando re-análisis para:"
          : "🔄 Analizando concurso:",
        contestId
      );
      const resultado = await analizarHistoriasConcurso(contestId, true);

      if (resultado.success) {
        console.log(
          "✅ Análisis completado:",
          resultado.resultados?.length,
          "historias"
        );

        const requierenRevisión =
          resultado.resultados?.filter(
            (r) =>
              r.analisis?.requiresManualReview ||
              r.analisis?.score >= 50 ||
              r.historia?.is_mature
          ) || [];

        // ✅ GUARDAR EN CACHE
        setContestCache((prev) => ({
          ...prev,
          [contestId]: {
            resultados: resultado.resultados,
            requierenRevisión,
            estadisticas: resultado.estadisticas,
          },
        }));

        setLastAnalyzed((prev) => ({
          ...prev,
          [contestId]: Date.now(),
        }));

        setAllStories(resultado.resultados || []);
        setHistoriasParaRevisión(requierenRevisión);
        console.log(
          "💾 Guardado en cache. Estadísticas:",
          resultado.estadisticas
        );
      }
    } catch (error) {
      console.error("❌ Error cargando datos de moderación:", error);
    }
  };

  // Función legacy para compatibilidad - ahora usa cache
  const loadModerationData = () => {
    if (selectedContest?.id) {
      loadModerationDataWithCache(selectedContest.id, true); // Forzar refresh
    }
  };

  // Filtrar historias según criterios
  const historiasFiltradas = allStories.filter((story) => {
    const historia = story.historia;
    const analisis = story.analisis;

    // Filtro por búsqueda
    if (búsqueda) {
      const searchTerm = búsqueda.toLowerCase();
      if (
        !historia.title.toLowerCase().includes(searchTerm) &&
        !historia.content.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }
    }

    // Filtro por estado
    if (filtroEstado === "flagged") {
      // Requieren atención PERO NO incluir las que ya están marcadas +18
      return (
        (analisis?.requiresManualReview || analisis?.score >= 80) &&
        !historia.is_mature
      );
    }
    if (filtroEstado === "adult") {
      return historia.is_mature;
    }
    if (filtroEstado === "warning") {
      return analisis?.score >= 50 && analisis?.score < 80;
    }
    if (filtroEstado === "clean") {
      return analisis?.score < 50 && !historia.is_mature;
    }

    return true;
  });

  const handleViewStory = (storyData) => {
    setSelectedStory(storyData);
    setShowReviewModal(true);
  };

  const handleUpdateStory = async (
    storyId,
    action,
    newValue = null,
    notes = ""
  ) => {
    try {
      if (action === "mark_as_mature") {
        // Actualizar el campo is_mature
        const { error } = await supabase
          .from("stories")
          .update({
            is_mature: newValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", storyId);

        if (error) throw error;

        // Crear log de moderación
        await supabase.from("moderation_logs").insert({
          story_id: storyId,
          action: newValue ? "marked_as_mature" : "unmarked_as_mature",
          admin_user_id: user?.id,
          reason: `Admin ${newValue ? "marcó" : "desmarcó"} como +18`,
          details: { notes, timestamp: new Date().toISOString() },
        });
      } else if (action === "approve") {
        // Actualizar estado de moderación
        const { error } = await actualizarEstadoModeración(
          storyId,
          "approved",
          user?.id,
          notes
        );
        if (error) throw error;
      } else if (action === "reject") {
        // Actualizar estado de moderación
        const { error } = await actualizarEstadoModeración(
          storyId,
          "rejected",
          user?.id,
          notes
        );
        if (error) throw error;
      }

      // Recargar datos después de la actualización (forzar actualización del cache)
      await loadModerationDataWithCache(selectedContest.id, true);

      return { success: true };
    } catch (error) {
      console.error("Error actualizando historia:", error);
      return { success: false, error: error.message };
    }
  };

  // Calcular estadísticas en tiempo real desde historias cargadas - SIN LLAMADAS ADICIONALES
  const calcularEstadisticas = () => {
    if (!allStories || allStories.length === 0) return null;

    const stats = {
      total: allStories.length,
      marcadas18: 0,
      requierenAtencion: 0, // Score >= 80 Y NO marcadas +18
      problemasLeves: 0, // Score 50-79
      sinProblemas: 0, // Score < 50 Y NO +18
      scorePromedio: 0,
    };

    let scoreTotal = 0;

    allStories.forEach((story) => {
      const historia = story.historia;
      const analisis = story.analisis;
      const score = analisis?.score || 0;

      scoreTotal += score;

      // Contar marcadas +18
      if (historia.is_mature) {
        stats.marcadas18++;
        return; // Las +18 no cuentan en otras categorías
      }

      // Clasificar por severidad (solo NO +18)
      if (score >= 80) {
        stats.requierenAtencion++;
      } else if (score >= 50) {
        stats.problemasLeves++;
      } else {
        stats.sinProblemas++;
      }
    });

    stats.scorePromedio =
      stats.total > 0 ? Math.round(scoreTotal / stats.total) : 0;
    return stats;
  };

  const renderEstadisticas = () => {
    const stats = calcularEstadisticas();
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {/* Total */}
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        {/* Requieren Atención (score >= 80 Y NO +18) */}
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Requieren Atención
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.requierenAtencion}
              </p>
            </div>
          </div>
        </div>

        {/* Marcadas +18 */}
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Marcadas +18</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.marcadas18}
              </p>
            </div>
          </div>
        </div>

        {/* Problemas Leves (score 50-79) */}
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Problemas Leves
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.problemasLeves}
              </p>
            </div>
          </div>
        </div>

        {/* Score Promedio */}
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Score Promedio
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.scorePromedio}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoriaCard = (storyData) => {
    const { historia, analisis } = storyData;

    const getPriorityColor = (score) => {
      if (score >= 80) return "border-red-500 bg-red-50";
      if (score >= 50) return "border-orange-500 bg-orange-50";
      return "border-green-500 bg-green-50";
    };

    const getPriorityIcon = (score) => {
      if (score >= 80)
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      if (score >= 50) return <Flag className="w-5 h-5 text-orange-600" />;
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    };

    return (
      <div
        key={historia.id}
        className={`border-l-4 p-4 bg-white rounded-lg shadow-sm ${getPriorityColor(analisis?.score || 0)}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getPriorityIcon(analisis?.score || 0)}
              <h3 className="font-semibold text-gray-900 truncate">
                {historia.title}
              </h3>
              {historia.is_mature && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  +18
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {historia.content.substring(0, 150)}...
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
              <span>Score: {analisis?.score || 0}</span>
              <span>Palabras: {historia.word_count}</span>
              <span className="hidden sm:inline">
                Autor: {historia.user_profiles?.display_name || "Anónimo"}
              </span>
            </div>

            {/* Mostrar autor en móvil en línea separada */}
            <div className="sm:hidden mt-1 text-xs text-gray-400">
              Autor: {historia.user_profiles?.display_name || "Anónimo"}
            </div>

            {analisis?.flags && analisis.flags.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {analisis.flags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analisis?.detalles && analisis.detalles.length > 0 && (
              <div className="mt-2">
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Ver detalles del análisis
                  </summary>
                  <div className="mt-1 text-gray-600">
                    {analisis.detalles.map((detalle, idx) => (
                      <div key={idx}>• {detalle}</div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="ml-4 flex flex-col gap-2">
            <button
              onClick={() => handleViewStory(storyData)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
              title="Ver historia completa y análisis"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Revisar</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col  items-center justify-between mb-6">
        <div className="w-full flex flex-col items-center justify-between mb-4">
          <h1 className="text-2xl font-bold justify-center md:justify-start text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Dashboard de Moderación
          </h1>
          <p className="text-green-600 text-sm mt-1">
            🛡️ Modo Producción - Las acciones se guardan en la base de datos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Selector de concurso */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedContest?.id || ""}
              onChange={(e) => {
                const contest = contests.find((c) => c.id === e.target.value);
                setSelectedContest(contest);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar concurso</option>
              {contests.map((contest) => (
                <option key={contest.id} value={contest.id}>
                  {contest.title} - {contest.month} {contest.year}
                  {contest.id === currentContest?.id ? " (Actual)" : ""}
                </option>
              ))}
            </select>
            {/* Indicador de cache */}
            {selectedContest?.id && contestCache[selectedContest.id] && (
              <div className="absolute -top-2 -right-2">
                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  💾
                </span>
              </div>
            )}
          </div>

          {/* Botón para forzar actualización */}
          <button
            onClick={loadModerationData}
            disabled={loading || !selectedContest}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            title="Re-analizar todas las historias desde cero"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Re-analizando..." : "Cache"}
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título o contenido..."
                value={búsqueda}
                onChange={(e) => setBúsqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Todas las historias</option>
            <option value="flagged">🔴 Requieren atención</option>
            <option value="adult">🟣 Marcadas +18</option>
            <option value="warning">🟡 Con observaciones</option>
            <option value="clean">🟢 Sin problemas</option>
          </select>
        </div>
      </div>

      {/* Lista de historias */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Analizando historias...</p>
          </div>
        ) : historiasFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {selectedContest
                ? "No hay historias que coincidan con los filtros"
                : "Selecciona un concurso para empezar"}
            </p>
          </div>
        ) : (
          historiasFiltradas.map(renderHistoriaCard)
        )}
      </div>

      {selectedContest && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Información del Concurso</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Título:</strong> {selectedContest.title}
              </p>
              <p>
                <strong>Período:</strong> {selectedContest.month}{" "}
                {selectedContest.year}
              </p>
              <p>
                <strong>Fase:</strong> {selectedContest.phase}
              </p>
            </div>
            <div>
              <p>
                <strong>Historias analizadas:</strong>{" "}
                {historiasFiltradas.length}
              </p>
              {contestCache[selectedContest.id] &&
                lastAnalyzed[selectedContest.id] && (
                  <p>
                    <strong>Estado:</strong>
                    <span className="ml-1 text-green-600">
                      💾 En cache (analizado hace{" "}
                      {Math.round(
                        (Date.now() - lastAnalyzed[selectedContest.id]) /
                          1000 /
                          60
                      )}{" "}
                      min)
                    </span>
                  </p>
                )}
              <p>
                <strong>Concursos en cache:</strong>{" "}
                {Object.keys(contestCache).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de revisión de historia */}
      <StoryReviewModal
        story={selectedStory?.historia}
        analisis={selectedStory?.analisis}
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedStory(null);
        }}
        onUpdateStory={handleUpdateStory}
      />
    </div>
  );
};

export default ModerationDashboard;
