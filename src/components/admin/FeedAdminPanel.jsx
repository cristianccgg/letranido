// components/admin/FeedAdminPanel.jsx - Panel de administración del sistema de feed
import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  Calendar,
  FileText,
  Zap,
  Archive,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const FeedAdminPanel = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt_text: '',
    start_date: '',
    end_date: '',
    status: 'draft'
  });

  // Cargar prompts
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('feed_prompts')
        .select('*')
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;

      setPrompts(data || []);
    } catch (err) {
      console.error('Error loading prompts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Crear o actualizar prompt
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Convertir fechas a hora Colombia (UTC-5)
      // start_date: 00:00 Colombia = 05:00 UTC
      // end_date: 23:59 Colombia = 04:59 UTC del día siguiente
      const startUTC = `${formData.start_date}T05:00:00Z`;
      const endUTC = `${formData.end_date}T04:59:59Z`;

      if (editingPrompt) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('feed_prompts')
          .update({
            title: formData.title,
            description: formData.description,
            prompt_text: formData.prompt_text || null,
            start_date: startUTC,
            end_date: endUTC,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPrompt.id);

        if (updateError) throw updateError;
        setSuccess('Prompt actualizado exitosamente');
      } else {
        // Crear nuevo
        const { error: insertError } = await supabase
          .from('feed_prompts')
          .insert([{
            title: formData.title,
            description: formData.description,
            prompt_text: formData.prompt_text || null,
            start_date: startUTC,
            end_date: endUTC,
            status: formData.status
          }]);

        if (insertError) throw insertError;
        setSuccess('Prompt creado exitosamente');
      }

      // Resetear form
      resetForm();
      loadPrompts();
    } catch (err) {
      console.error('Error saving prompt:', err);
      setError(err.message);
    }
  };

  // Cambiar estado de prompt
  const handleChangeStatus = async (promptId, newStatus) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('feed_prompts')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId);

      if (updateError) throw updateError;

      setSuccess(`Prompt ${newStatus === 'active' ? 'activado' : newStatus === 'archived' ? 'archivado' : 'guardado como draft'}`);
      loadPrompts();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
  };

  // Eliminar prompt
  const handleDelete = async (promptId) => {
    if (!window.confirm('¿Estás seguro de eliminar este prompt? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('feed_prompts')
        .delete()
        .eq('id', promptId);

      if (deleteError) throw deleteError;

      setSuccess('Prompt eliminado');
      loadPrompts();
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError(err.message);
    }
  };

  // Editar prompt
  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      description: prompt.description,
      prompt_text: prompt.prompt_text || '',
      start_date: prompt.start_date.split('T')[0],
      end_date: prompt.end_date.split('T')[0],
      status: prompt.status
    });
    setShowForm(true);
  };

  // Calcular fechas sugeridas basándose en el último prompt
  const getSuggestedDates = () => {
    if (prompts.length === 0) return { start_date: '', end_date: '' };

    // Encontrar el prompt con end_date más tardía
    const latestPrompt = prompts.reduce((latest, p) =>
      new Date(p.end_date) > new Date(latest.end_date) ? p : latest
    );

    // Convertir end_date a fecha Colombia (UTC-5) para mostrar la fecha correcta al admin
    // end_date en BD: "2026-03-08T04:59:59Z" = 7 de marzo 23:59 Colombia
    const endDateColombia = new Date(latestPrompt.end_date).toLocaleDateString('en-CA', {
      timeZone: 'America/Bogota'
    }); // "2026-03-07"
    const [year, month, day] = endDateColombia.split('-').map(Number);

    // Día siguiente al end_date en Colombia
    const nextStart = new Date(year, month - 1, day + 1);

    // 7 días después del inicio
    const nextEnd = new Date(year, month - 1, day + 7);

    const formatForInput = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    return {
      start_date: formatForInput(nextStart),
      end_date: formatForInput(nextEnd)
    };
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      prompt_text: '',
      start_date: '',
      end_date: '',
      status: 'draft'
    });
    setEditingPrompt(null);
    setShowForm(false);
  };

  // Badge de estado
  const StatusBadge = ({ status }) => {
    const styles = {
      draft: 'bg-gray-400 text-white',
      active: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg',
      archived: 'bg-gray-300 text-gray-700'
    };

    const icons = {
      draft: <FileText className="w-3.5 h-3.5" />,
      active: <Zap className="w-3.5 h-3.5" />,
      archived: <Archive className="w-3.5 h-3.5" />
    };

    const labels = {
      draft: 'DRAFT',
      active: 'ACTIVO',
      archived: 'ARCHIVO'
    };

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </div>
    );
  };

  // Formatear fecha mostrando la hora en Colombia (UTC-5)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Bogota'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📝 Gestión de Prompts del Feed
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Crea y gestiona prompts para microhistorias
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              // Pre-llenar fechas sugeridas al crear nuevo prompt
              const suggested = getSuggestedDates();
              setFormData({
                title: '',
                description: '',
                prompt_text: '',
                start_date: suggested.start_date,
                end_date: suggested.end_date,
                status: 'draft'
              });
              setEditingPrompt(null);
              setShowForm(true);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showForm
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {showForm ? <X className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Nuevo Prompt'}
        </button>
      </div>

      {/* Mensajes de feedback */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-primary-200 dark:border-primary-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingPrompt ? 'Editar Prompt' : 'Crear Nuevo Prompt'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título del Prompt *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Escribe sobre un recuerdo de infancia"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción *
              </label>
              <textarea
                required
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del prompt para el feed"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Prompt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Texto de Inspiración (Opcional)
              </label>
              <textarea
                rows={3}
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                placeholder="El texto del prompt que verán los usuarios..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Fechas */}
            {!editingPrompt && formData.start_date && prompts.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Fechas sugeridas automáticamente: inicia el día después del último prompt y dura 7 días. Puedes ajustarlas.
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="draft">Draft (No visible)</option>
                <option value="active">Activo (Publicaciones abiertas)</option>
                <option value="archived">Archivado (Solo lectura)</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingPrompt ? 'Actualizar' : 'Crear'} Prompt
              </button>

              {editingPrompt && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Lista de Prompts */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Prompts Existentes ({prompts.length})
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando prompts...</p>
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No hay prompts creados</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Crea tu primer prompt para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={prompt.status} />
                      {prompt.status === 'draft' && new Date(prompt.start_date) > new Date() && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Clock className="w-3 h-3" />
                          En Cola
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(prompt.start_date)} — {formatDate(prompt.end_date)}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {prompt.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {prompt.description}
                    </p>
                  </div>
                </div>

                {/* Prompt Text */}
                {prompt.prompt_text && (
                  <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-3 mb-4">
                    <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                      "{prompt.prompt_text}"
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(prompt.start_date)} - {formatDate(prompt.end_date)}
                  </div>
                  <span>•</span>
                  <span>{prompt.stories_count || 0} microhistorias</span>
                  <span>•</span>
                  <span>{prompt.total_likes || 0} likes</span>
                  <span>•</span>
                  <span>{prompt.total_comments || 0} comentarios</span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Cambiar estados */}
                  {prompt.status === 'draft' && (
                    <button
                      onClick={() => handleChangeStatus(prompt.id, 'active')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Activar
                    </button>
                  )}

                  {prompt.status === 'active' && (
                    <button
                      onClick={() => handleChangeStatus(prompt.id, 'archived')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archivar
                    </button>
                  )}

                  {prompt.status === 'archived' && (
                    <button
                      onClick={() => handleChangeStatus(prompt.id, 'active')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Reactivar
                    </button>
                  )}

                  {/* Editar */}
                  <button
                    onClick={() => handleEdit(prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedAdminPanel;
