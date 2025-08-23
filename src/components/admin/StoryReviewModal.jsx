// components/admin/StoryReviewModal.jsx - Modal para revisar historias individualmente
import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Flag,
  User,
  Calendar,
  FileText,
  BarChart3,
  Eye,
  MessageSquare,
  Star,
  Edit,
  Save,
  XCircle
} from 'lucide-react';

const StoryReviewModal = ({ story, analisis, isOpen, onClose, onUpdateStory }) => {
  const [activeTab, setActiveTab] = useState('content');
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  if (!isOpen || !story) return null;

  const handleAdminAction = async (action, newValue = null) => {
    if (!onUpdateStory) return;
    
    setActionLoading(true);
    try {
      const result = await onUpdateStory(story.id, action, newValue, notes);
      if (result.success) {
        onClose();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAs18 = () => {
    handleAdminAction('mark_as_mature', true);
  };

  const handleUnmarkAs18 = () => {
    handleAdminAction('mark_as_mature', false);
  };

  const handleApprove = () => {
    handleAdminAction('approve');
  };

  const handleReject = () => {
    if (!notes.trim()) {
      alert('Por favor agrega una razón para el rechazo');
      setShowNotesInput(true);
      return;
    }
    handleAdminAction('reject');
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getPriorityIcon = (score) => {
    if (score >= 80) return <AlertTriangle className="w-5 h-5" />;
    if (score >= 50) return <Flag className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const renderContent = () => (
    <div className="space-y-4">
      {/* Información básica */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Autor:</span>
            <span className="ml-2">{story.user_profiles?.display_name || 'Anónimo'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Palabras:</span>
            <span className="ml-2">{story.word_count}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Fecha:</span>
            <span className="ml-2">{new Date(story.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Marcado +18:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${story.is_mature ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {story.is_mature ? 'Sí' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Título */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Título:</h4>
        <div className="bg-white border rounded-lg p-3">
          <p className="text-gray-900">{story.title}</p>
        </div>
      </div>

      {/* Contenido */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Contenido:</h4>
        <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
            {story.content}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-4">
      {/* Score y Estado */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getPriorityColor(analisis?.score || 0)}`}>
              {getPriorityIcon(analisis?.score || 0)}
            </div>
            <div>
              <h4 className="font-semibold">Score de Moderación: {analisis?.score || 0}/100</h4>
              <p className="text-sm text-gray-600">{analisis?.reason || 'Sin análisis'}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            analisis?.status === 'approved' ? 'bg-green-100 text-green-700' :
            analisis?.status === 'flagged' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {analisis?.status || 'pending'}
          </div>
        </div>

        {/* Acción automática */}
        <div className="text-sm">
          <span className="font-medium text-gray-700">Acción automática sugerida:</span>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
            {analisis?.autoAction || 'approve'}
          </span>
        </div>
      </div>

      {/* Flags detectados */}
      {analisis?.flags && analisis.flags.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Flags Detectados:</h4>
          <div className="flex flex-wrap gap-2">
            {analisis.flags.map((flag, idx) => (
              <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detalles del análisis */}
      {analisis?.detalles && analisis.detalles.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Detalles del Análisis:</h4>
          <div className="bg-white border rounded-lg p-3">
            {analisis.detalles.map((detalle, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-sm text-gray-700">{detalle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explicación de por qué necesita revisión */}
      {analisis?.requiresManualReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-amber-800">Requiere Revisión Manual</h5>
              <p className="text-sm text-amber-700 mt-1">
                Esta historia ha sido marcada para revisión debido a su contenido o porque está marcada como +18.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdminActions = () => (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-3">Estado Actual de la Historia</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Marcado +18:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${story.is_mature ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {story.is_mature ? 'Sí' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Score actual:</span>
            <span className="ml-2 font-bold">{analisis?.score || 0}/100</span>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">🔧 Acciones de Moderación</h4>
        <div className="space-y-3">
          
          {/* Marcar/Desmarcar +18 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Clasificación de Edad</p>
              <p className="text-xs text-gray-500">Cambiar si la historia debe ser +18 o no</p>
            </div>
            <div className="flex gap-2">
              {!story.is_mature ? (
                <button
                  onClick={handleMarkAs18}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  Marcar como +18
                </button>
              ) : (
                <button
                  onClick={handleUnmarkAs18}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
                >
                  Quitar +18
                </button>
              )}
            </div>
          </div>

          {/* Aprobar/Rechazar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Estado de Moderación</p>
              <p className="text-xs text-gray-500">Aprobar o rechazar la historia</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar
              </button>
              <button
                onClick={() => setShowNotesInput(!showNotesInput)}
                disabled={actionLoading}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Campo de notas */}
      {showNotesInput && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Notas de Moderación</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explica la razón del rechazo o agrega notas para el usuario..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleReject}
              disabled={actionLoading || !notes.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
            </button>
            <button
              onClick={() => {
                setShowNotesInput(false);
                setNotes('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Información importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">⚠️ Importante:</p>
            <p className="text-amber-700 mt-1">
              • Marcar como +18 reducirá automáticamente el score si contiene contenido adulto
            </p>
            <p className="text-amber-700">
              • Las acciones quedan registradas en el log de moderación
            </p>
            <p className="text-amber-700">
              • El usuario NO recibirá notificaciones automáticas de estos cambios
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'content', label: 'Contenido', icon: FileText },
    { id: 'analysis', label: 'Análisis', icon: BarChart3 },
    { id: 'actions', label: 'Acciones Admin', icon: Edit }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revisión de Historia</h3>
              <p className="text-sm text-gray-600">Modo TEST - Solo lectura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'content' && renderContent()}
          {activeTab === 'analysis' && renderAnalysis()}
          {activeTab === 'actions' && renderAdminActions()}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              🛡️ <strong>Modo Producción:</strong> Las acciones de moderación se guardarán en la base de datos y quedarán registradas.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryReviewModal;