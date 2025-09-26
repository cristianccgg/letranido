import React, { useState, useEffect } from "react";
import {
  Vote,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Trophy,
  Calendar,
  AlertTriangle,
  Check,
  X,
  Save,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader,
  Settings,
  Target,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import { 
  getAllPolls, 
  createPoll, 
  addPollOptions, 
  getPollResults, 
  closePoll,
  convertPollToContest,
  updatePoll,
  updatePollOption,
  deletePollOption,
  addSinglePollOption,
  getPollById
} from "../../lib/supabase-polls";

const PollAdminPanel = () => {
  const { user } = useGlobalApp();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollResults, setPollResults] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Estados para crear encuesta
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    target_month: "",
    target_contest_month: "",
    voting_deadline: "",
    options: [
      { title: "", description: "", text: "" },
      { title: "", description: "", text: "" },
      { title: "", description: "", text: "" }
    ]
  });

  // Estados para editar encuesta
  const [editPoll, setEditPoll] = useState({
    id: "",
    title: "",
    description: "",
    target_month: "",
    target_contest_month: "",
    voting_deadline: "",
    options: []
  });

  // Estados para conversión a concurso
  const [contestData, setContestData] = useState({
    title: "",
    submission_deadline: "",
    voting_deadline: "",
    category: "Ficción",
    prize: "Insignia de Oro + Destacado del mes",
    min_words: 100,
    max_words: 1000
  });

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const pollsData = await getAllPolls();
      setPolls(pollsData);
    } catch (error) {
      console.error('Error cargando encuestas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPoll = async (poll) => {
    try {
      setActionLoading(`edit-${poll.id}`);
      
      // Cargar datos completos de la encuesta
      const fullPoll = await getPollById(poll.id);
      
      if (!fullPoll) {
        throw new Error('No se pudo cargar la encuesta');
      }

      // Formatear fecha para input datetime-local
      const formattedDeadline = new Date(fullPoll.voting_deadline)
        .toISOString()
        .slice(0, 16);

      setEditPoll({
        id: fullPoll.id,
        title: fullPoll.title,
        description: fullPoll.description || '',
        target_month: fullPoll.target_month,
        target_contest_month: fullPoll.target_contest_month,
        voting_deadline: formattedDeadline,
        options: (fullPoll.options || []).map(opt => ({
          id: opt.id,
          title: opt.option_title,
          description: opt.option_description || '',
          text: opt.option_text,
          isNew: false
        }))
      });

      setShowEditModal(true);
    } catch (error) {
      console.error('Error cargando encuesta para editar:', error);
      alert('Error cargando encuesta: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEditPoll = async () => {
    if (!editPoll.title.trim() || !editPoll.target_month.trim() || !editPoll.voting_deadline) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    // Validar que al menos 2 opciones tengan contenido
    const validOptions = editPoll.options.filter(opt => 
      opt.title.trim() && opt.text.trim()
    );

    if (validOptions.length < 2) {
      alert('Necesitas al menos 2 opciones válidas');
      return;
    }

    try {
      setActionLoading('save-edit');
      
      // 1. Actualizar datos básicos de la encuesta
      const pollResult = await updatePoll(editPoll.id, {
        title: editPoll.title,
        description: editPoll.description,
        target_month: editPoll.target_month,
        target_contest_month: editPoll.target_contest_month,
        voting_deadline: editPoll.voting_deadline
      });

      if (!pollResult.success) {
        throw new Error(pollResult.error);
      }

      // 2. Procesar opciones
      for (const option of validOptions) {
        if (option.isNew) {
          // Agregar nueva opción
          try {
            const result = await addSinglePollOption(editPoll.id, {
              title: option.title,
              description: option.description,
              text: option.text
            });
            if (!result || !result.success) {
              console.warn(`Error agregando opción: ${result?.error || 'Error desconocido'}`);
            }
          } catch (error) {
            console.warn('Error agregando nueva opción:', error);
          }
        } else if (option.id) {
          // Actualizar opción existente - TEMPORALMENTE SALTAMOS ESTE PASO
          console.log('Saltando actualización de opción existente (temporal):', option.id);
          // TODO: Arreglar permisos RLS en poll_options para habilitar actualizaciones
          /*
          const result = await updatePollOption(option.id, {
            title: option.title,
            description: option.description,
            text: option.text
          });
          if (!result || !result.success) {
            throw new Error(`Error actualizando opción: ${result?.error || 'Error desconocido'}`);
          }
          */
        } else {
          console.warn('Opción sin ID encontrada:', option);
        }
      }

      // 3. Eliminar opciones marcadas para eliminar
      const optionsToDelete = editPoll.options.filter(opt => opt.markedForDeletion && !opt.isNew);
      for (const option of optionsToDelete) {
        const result = await deletePollOption(option.id);
        if (!result.success) {
          console.warn(`Error eliminando opción ${option.id}:`, result.error);
        }
      }

      setShowEditModal(false);
      await loadPolls();
      alert('Encuesta actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando encuesta:', error);
      alert('Error actualizando encuesta: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePoll = async () => {
    if (!newPoll.title.trim() || !newPoll.target_month.trim() || !newPoll.voting_deadline) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    // Validar que al menos 2 opciones tengan contenido
    const validOptions = newPoll.options.filter(opt => 
      opt.title.trim() && opt.text.trim()
    );

    if (validOptions.length < 2) {
      alert('Necesitas al menos 2 opciones válidas');
      return;
    }

    try {
      setActionLoading('create');
      
      // Crear la encuesta
      const pollResult = await createPoll({
        title: newPoll.title,
        description: newPoll.description,
        target_month: newPoll.target_month,
        target_contest_month: newPoll.target_contest_month.toLowerCase(),
        voting_deadline: newPoll.voting_deadline,
        created_by: user.id
      });

      if (!pollResult.success) {
        throw new Error(pollResult.error);
      }

      // Agregar las opciones
      const optionsResult = await addPollOptions(pollResult.data.id, validOptions);
      
      if (!optionsResult.success) {
        throw new Error(optionsResult.error);
      }

      // Reset form y reload
      setNewPoll({
        title: "",
        description: "",
        target_month: "",
        target_contest_month: "",
        voting_deadline: "",
        options: [
          { title: "", description: "", text: "" },
          { title: "", description: "", text: "" },
          { title: "", description: "", text: "" }
        ]
      });
      
      setShowCreateModal(false);
      await loadPolls();
      
      alert('Encuesta creada exitosamente');
    } catch (error) {
      console.error('Error creando encuesta:', error);
      alert('Error creando encuesta: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!confirm('¿Estás seguro de cerrar esta encuesta?')) return;

    try {
      setActionLoading(`close-${pollId}`);
      const result = await closePoll(pollId);
      
      if (result.success) {
        await loadPolls();
        alert('Encuesta cerrada exitosamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error cerrando encuesta:', error);
      alert('Error cerrando encuesta: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewResults = async (poll) => {
    try {
      setActionLoading(`results-${poll.id}`);
      const results = await getPollResults(poll.id);
      
      if (results.success) {
        setPollResults(results.data);
        setSelectedPoll(poll);
        setShowResultsModal(true);
      } else {
        throw new Error(results.error);
      }
    } catch (error) {
      console.error('Error obteniendo resultados:', error);
      alert('Error obteniendo resultados: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToContest = async () => {
    if (!selectedPoll) {
      alert('No hay encuesta seleccionada');
      return;
    }

    try {
      setActionLoading('convert');
      
      const result = await convertPollToContest(selectedPoll.id);
      
      if (result.success) {
        setShowConvertModal(false);
        setSelectedPoll(null);
        await loadPolls();
        alert(`Concurso creado exitosamente. Opción ganadora: ${result.data.winning_option.title}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error convirtiendo a concurso:', error);
      alert('Error convirtiendo a concurso: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const addPollOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, { title: "", description: "", text: "" }]
    }));
  };

  const removePollOption = (index) => {
    if (newPoll.options.length <= 2) return; // Mínimo 2 opciones
    
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updatePollOption = (index, field, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  // Funciones para editar encuesta
  const addEditPollOption = () => {
    setEditPoll(prev => ({
      ...prev,
      options: [...prev.options, { title: "", description: "", text: "", isNew: true }]
    }));
  };

  const removeEditPollOption = (index) => {
    const option = editPoll.options[index];
    
    // Verificar que tenemos al menos 2 opciones válidas restantes
    const validOptionsCount = editPoll.options.filter(opt => !opt.markedForDeletion).length;
    if (validOptionsCount <= 2) {
      alert('Debe tener al menos 2 opciones en la encuesta');
      return;
    }
    
    if (option.isNew) {
      // Si es nueva, simplemente la removemos del array
      setEditPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    } else {
      // Si existe en la BD, la marcamos para eliminar
      setEditPoll(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => 
          i === index ? { ...opt, markedForDeletion: true } : opt
        )
      }));
    }
  };

  const updateEditPollOption = (index, field, value) => {
    setEditPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const getStatusBadge = (poll) => {
    const now = new Date();
    const deadline = new Date(poll.voting_deadline);
    
    if (poll.status === 'converted') {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Convertida</span>;
    } else if (poll.status === 'closed' || deadline <= now) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Cerrada</span>;
    } else if (poll.status === 'active') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Activa</span>;
    }
    
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">{poll.status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin text-gray-600" />
        <span className="ml-2 text-gray-600">Cargando encuestas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Vote className="h-6 w-6 text-emerald-600" />
            Panel de Encuestas
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona las encuestas de votación para prompts de concursos
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadPolls}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Encuesta
          </button>
        </div>
      </div>

      {/* Lista de encuestas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {polls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Vote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay encuestas creadas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {polls.map((poll) => (
              <div key={poll.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{poll.title}</h3>
                      {getStatusBadge(poll)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {poll.target_month}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(poll.voting_deadline).toLocaleDateString('es-ES')}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {poll.total_votes} votos
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Vote className="h-4 w-4" />
                        {poll.poll_options?.length || 0} opciones
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 ml-4">
                    {poll.status === 'active' && (
                      <button
                        onClick={() => handleEditPoll(poll)}
                        disabled={actionLoading === `edit-${poll.id}`}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `edit-${poll.id}` ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <Edit className="h-3 w-3" />
                        )}
                        Editar
                      </button>
                    )}

                    <button
                      onClick={() => handleViewResults(poll)}
                      disabled={actionLoading === `results-${poll.id}`}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `results-${poll.id}` ? (
                        <Loader className="h-3 w-3 animate-spin" />
                      ) : (
                        <BarChart3 className="h-3 w-3" />
                      )}
                      Resultados
                    </button>

                    {poll.status === 'active' && (
                      <button
                        onClick={() => handleClosePoll(poll.id)}
                        disabled={actionLoading === `close-${poll.id}`}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `close-${poll.id}` ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <Pause className="h-3 w-3" />
                        )}
                        Cerrar
                      </button>
                    )}

                    {(poll.status === 'closed' || poll.status === 'completed') && poll.status !== 'converted' && (
                      <button
                        onClick={() => {
                          setSelectedPoll(poll);
                          setShowConvertModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        <Trophy className="h-3 w-3" />
                        Convertir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Encuesta */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Nueva Encuesta de Prompts</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={newPoll.title}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Elige el prompt para Noviembre 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes objetivo *
                    </label>
                    <input
                      type="text"
                      value={newPoll.target_month}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, target_month: e.target.value }))}
                      placeholder="Noviembre 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes del concurso *
                    </label>
                    <input
                      type="text"
                      value={newPoll.target_contest_month}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, target_contest_month: e.target.value }))}
                      placeholder="noviembre"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha límite *
                    </label>
                    <input
                      type="datetime-local"
                      value={newPoll.voting_deadline}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, voting_deadline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newPoll.description}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="¡Ayuda a elegir el prompt para el próximo concurso!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Opciones */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Opciones de Prompts</h4>
                    <button
                      onClick={addPollOption}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar opción
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-700">Opción {index + 1}</h5>
                          {newPoll.options.length > 2 && (
                            <button
                              onClick={() => removePollOption(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            value={option.title}
                            onChange={(e) => updatePollOption(index, 'title', e.target.value)}
                            placeholder="Título del prompt"
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={option.description}
                            onChange={(e) => updatePollOption(index, 'description', e.target.value)}
                            placeholder="Descripción corta (opcional)"
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <textarea
                          value={option.text}
                          onChange={(e) => updatePollOption(index, 'text', e.target.value)}
                          rows={2}
                          placeholder="Texto completo del prompt"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreatePoll}
                    disabled={actionLoading === 'create'}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'create' ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Crear Encuesta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resultados */}
      {showResultsModal && pollResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Resultados de Encuesta</h3>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setPollResults(null);
                    setSelectedPoll(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{pollResults.poll.title}</h4>
                  <p className="text-gray-600 text-sm">{pollResults.poll.description}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    <strong>Total de votos:</strong> {pollResults.poll.total_votes}
                  </div>
                  {pollResults.summary.winning_option && (
                    <div className="text-sm text-emerald-600 mt-1">
                      <strong>Ganador:</strong> {pollResults.summary.winning_option.option_title}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {pollResults.poll.poll_options?.map((option) => {
                    const percentage = pollResults.poll.total_votes > 0 
                      ? Math.round((option.vote_count / pollResults.poll.total_votes) * 100) 
                      : 0;
                    
                    return (
                      <div key={option.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{option.option_title}</h5>
                          <span className="text-sm text-gray-600">
                            {option.vote_count} votos ({percentage}%)
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        <p className="text-sm text-gray-600 italic">
                          "{option.option_text}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Encuesta */}
      {showEditModal && editPoll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Editar Encuesta</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={editPoll.title}
                      onChange={(e) => setEditPoll(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Elige el prompt para Noviembre 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes objetivo *
                    </label>
                    <input
                      type="text"
                      value={editPoll.target_month}
                      onChange={(e) => setEditPoll(prev => ({ ...prev, target_month: e.target.value }))}
                      placeholder="Noviembre 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes del concurso *
                    </label>
                    <input
                      type="text"
                      value={editPoll.target_contest_month}
                      onChange={(e) => setEditPoll(prev => ({ ...prev, target_contest_month: e.target.value }))}
                      placeholder="noviembre"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha límite *
                    </label>
                    <input
                      type="datetime-local"
                      value={editPoll.voting_deadline}
                      onChange={(e) => setEditPoll(prev => ({ ...prev, voting_deadline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editPoll.description}
                    onChange={(e) => setEditPoll(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="¡Ayuda a elegir el prompt para el próximo reto!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Opciones */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Opciones de Prompts</h4>
                    <button
                      onClick={addEditPollOption}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar opción
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editPoll.options.filter(opt => !opt.markedForDeletion).map((option, index) => (
                      <div key={option.id || index} className={`border rounded-lg p-4 ${option.isNew ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-700">Opción {index + 1}</h5>
                            {option.isNew && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Nueva</span>
                            )}
                          </div>
                          <button
                            onClick={() => removeEditPollOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            value={option.title}
                            onChange={(e) => updateEditPollOption(index, 'title', e.target.value)}
                            placeholder="Título del prompt"
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={option.description}
                            onChange={(e) => updateEditPollOption(index, 'description', e.target.value)}
                            placeholder="Descripción corta (opcional)"
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <textarea
                          value={option.text}
                          onChange={(e) => updateEditPollOption(index, 'text', e.target.value)}
                          rows={2}
                          placeholder="Texto completo del prompt"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEditPoll}
                    disabled={actionLoading === 'save-edit'}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'save-edit' ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Convertir a Concurso */}
      {showConvertModal && selectedPoll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Convertir a Concurso</h3>
                <button
                  onClick={() => {
                    setShowConvertModal(false);
                    setSelectedPoll(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedPoll.title}</h4>
                  <p className="text-sm text-gray-600">Mes objetivo: {selectedPoll.target_month}</p>
                  <p className="text-sm text-gray-600">Total votos: {selectedPoll.total_votes}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Conversión automática</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    El sistema creará automáticamente el concurso con:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                    <li>La opción con más votos como prompt</li>
                    <li>Título: "Concurso {selectedPoll.target_month}"</li>
                    <li>Fechas calculadas automáticamente</li>
                    <li>Configuración estándar (100-1000 palabras)</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowConvertModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConvertToContest}
                    disabled={actionLoading === 'convert'}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'convert' ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Convirtiendo...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4" />
                        Crear Concurso
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollAdminPanel;