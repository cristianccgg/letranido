// components/admin/ReadingMetricsPanel.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Panel de administración para analizar la distribución de lecturas en un reto
 * Muestra métricas de equidad y detecta historias con baja visibilidad
 */
export default function ReadingMetricsPanel({ contestId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos de las métricas
  const [storyMetrics, setStoryMetrics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState([]);

  // Vista activa
  const [activeView, setActiveView] = useState('summary'); // 'summary' | 'stories' | 'distribution'

  /**
   * Cargar todas las métricas del concurso
   */
  const loadMetrics = async () => {
    if (!contestId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Cargar métricas por historia
      const { data: storiesData, error: storiesError } = await supabase.rpc(
        'get_contest_reading_metrics',
        { p_contest_id: contestId }
      );

      if (storiesError) throw storiesError;
      setStoryMetrics(storiesData || []);

      // 2. Cargar resumen estadístico
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_contest_reading_summary',
        { p_contest_id: contestId }
      );

      if (summaryError) throw summaryError;
      setSummary(summaryData?.[0] || null);

      // 3. Cargar distribución (histograma)
      const { data: distData, error: distError } = await supabase.rpc(
        'get_reading_distribution',
        { p_contest_id: contestId }
      );

      if (distError) throw distError;
      setDistribution(distData || []);
    } catch (err) {
      console.error('Error loading reading metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [contestId]);

  /**
   * Calcular categoría de equidad basada en coeficiente de variación
   */
  const getEquityCategory = (cv) => {
    if (!cv) return { label: 'N/A', color: 'gray' };
    if (cv < 30) return { label: 'Excelente', color: 'green' };
    if (cv < 50) return { label: 'Buena', color: 'blue' };
    if (cv < 70) return { label: 'Regular', color: 'yellow' };
    return { label: 'Baja', color: 'red' };
  };

  /**
   * Obtener color de badge según lecturas
   */
  const getReadCountColor = (readCount, avgReads) => {
    if (readCount === 0) return 'bg-red-100 text-red-800';
    if (readCount < avgReads * 0.5) return 'bg-orange-100 text-orange-800';
    if (readCount >= avgReads * 1.5) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (!contestId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Selecciona un reto para ver las métricas de lectura.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  const equity = summary ? getEquityCategory(summary.coefficient_of_variation) : null;
  const avgReads = summary?.avg_reads_per_story || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Métricas de Lectura
          </h2>
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Actualizar
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === 'summary'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveView('stories')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === 'stories'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Por Historia ({storyMetrics.length})
          </button>
          <button
            onClick={() => setActiveView('distribution')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === 'distribution'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Distribución
          </button>
        </div>
      </div>

      {/* Summary View */}
      {activeView === 'summary' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Estadísticas Generales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estadísticas Generales
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Total de historias</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.total_stories}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total de lecturas</div>
                <div className="text-2xl font-bold text-purple-600">
                  {summary.total_reads}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Lectores únicos</div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.unique_readers}
                </div>
              </div>
            </div>
          </div>

          {/* Distribución de Lecturas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribución de Lecturas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Promedio</span>
                <span className="text-lg font-bold text-gray-900">
                  {summary.avg_reads_per_story}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mediana</span>
                <span className="text-lg font-bold text-gray-900">
                  {summary.median_reads}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mínimo</span>
                <span className="text-lg font-bold text-red-600">
                  {summary.min_reads}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Máximo</span>
                <span className="text-lg font-bold text-green-600">
                  {summary.max_reads}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Desv. estándar</span>
                <span className="text-lg font-bold text-gray-900">
                  {summary.stddev_reads}
                </span>
              </div>
            </div>
          </div>

          {/* Índice de Equidad */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Índice de Equidad
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Coeficiente de Variación
                </div>
                <div className="flex items-end space-x-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {summary.coefficient_of_variation}%
                  </div>
                  {equity && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium bg-${equity.color}-100 text-${equity.color}-800`}
                    >
                      {equity.label}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Valores bajos indican distribución más equitativa
                </div>
              </div>

              {summary.stories_never_read > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-800">
                    Alerta: {summary.stories_never_read} historias sin lecturas
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <div>Excelente: {'<'} 30%</div>
                <div>Buena: 30-50%</div>
                <div>Regular: 50-70%</div>
                <div>Baja: {'>'} 70%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stories View */}
      {activeView === 'stories' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Historia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecturas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votos
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ratio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storyMetrics.map((story) => (
                  <tr key={story.story_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {story.story_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {story.author_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReadCountColor(
                          story.read_count,
                          avgReads
                        )}`}
                      >
                        {story.read_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">
                        {story.vote_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">
                        {story.read_to_vote_ratio}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {storyMetrics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      )}

      {/* Distribution View */}
      {activeView === 'distribution' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Histograma de Distribución
          </h3>

          <div className="space-y-4">
            {distribution.map((bucket, idx) => {
              const maxCount = Math.max(...distribution.map((b) => b.stories_count));
              const percentage = (bucket.stories_count / maxCount) * 100;

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {bucket.read_count_bucket}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {bucket.stories_count} historias
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-purple-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 20 && (
                        <span className="text-xs font-medium text-white">
                          {bucket.stories_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {distribution.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de distribución disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
}
