import React, { useState, useEffect } from "react";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  Calendar
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";

const ReportsPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const { getReports, updateReportStatus } = useGlobalApp();

  // Cargar reportes
  const loadReports = async () => {
    setLoading(true);
    try {
      const result = await getReports();
      if (result.success) {
        setReports(result.data || []);
      } else {
        console.error("Error loading reports:", result.error);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filtrar reportes por estado
  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  // Actualizar estado de reporte
  const handleUpdateReportStatus = async (reportId, newStatus, adminNotes = '') => {
    setActionLoading(reportId);
    try {
      const result = await updateReportStatus(reportId, newStatus, adminNotes);
      if (result.success) {
        // Actualizar estado local
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus, admin_notes: adminNotes, resolved_at: new Date().toISOString() }
            : report
        ));
        setSelectedReport(null);
      } else {
        alert("Error al actualizar el reporte: " + result.error);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Error al actualizar el reporte");
    } finally {
      setActionLoading(null);
    }
  };

  // Obtener color y icono según estado
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, label: 'Pendiente' };
      case 'reviewed':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Eye, label: 'Revisado' };
      case 'resolved':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Resuelto' };
      case 'dismissed':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle, label: 'Descartado' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock, label: 'Desconocido' };
    }
  };

  // Obtener color según razón del reporte
  const getReasonColor = (reason) => {
    switch (reason) {
      case 'spam':
        return 'text-red-600 bg-red-100';
      case 'inappropriate':
        return 'text-orange-600 bg-orange-100';
      case 'harassment':
        return 'text-purple-600 bg-purple-100';
      case 'other':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Hace menos de una hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hace 1 día";
    return `Hace ${diffInDays} días`;
  };

  const ReasonLabels = {
    spam: 'Spam',
    inappropriate: 'Contenido inapropiado',
    harassment: 'Acoso',
    other: 'Otro'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">Panel de Reportes</h2>
        </div>
        <button
          onClick={loadReports}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'pending', label: 'Pendientes', count: reports.filter(r => r.status === 'pending').length },
          { key: 'reviewed', label: 'Revisados', count: reports.filter(r => r.status === 'reviewed').length },
          { key: 'resolved', label: 'Resueltos', count: reports.filter(r => r.status === 'resolved').length },
          { key: 'dismissed', label: 'Descartados', count: reports.filter(r => r.status === 'dismissed').length },
          { key: 'all', label: 'Todos', count: reports.length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Lista de reportes */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Flag className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No hay reportes disponibles' 
                : `No hay reportes ${filter === 'pending' ? 'pendientes' : filter}`}
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const statusInfo = getStatusInfo(report.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getReasonColor(report.reason)}`}>
                        {ReasonLabels[report.reason] || report.reason}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(report.created_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Reportado por: {report.reporter?.display_name || 'Usuario desconocido'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {report.reporter?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Autor del comentario: Usuario ID {report.reported_comment?.user_id?.substring(0, 8) || 'Desconocido'}
                        </p>
                        <p className="text-xs text-gray-600">
                          (Los detalles del usuario están en auth.users)
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Comentario reportado:</p>
                      <p className="text-sm text-gray-700 italic">
                        "{report.reported_comment?.content || 'Contenido no disponible'}"
                      </p>
                    </div>

                    {report.description && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">Descripción del reporte:</p>
                        <p className="text-sm text-gray-700">{report.description}</p>
                      </div>
                    )}

                    {report.admin_notes && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">Notas del administrador:</p>
                        <p className="text-sm text-blue-700">{report.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                          disabled={actionLoading === report.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Marcar como revisado"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          disabled={actionLoading === report.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Resolver"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                          disabled={actionLoading === report.id}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Descartar"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de detalles del reporte */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles del Reporte</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusInfo(selectedReport.status).bgColor} ${getStatusInfo(selectedReport.status).color}`}>
                      {React.createElement(getStatusInfo(selectedReport.status).icon, { className: "h-3 w-3" })}
                      {getStatusInfo(selectedReport.status).label}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getReasonColor(selectedReport.reason)}`}>
                      {ReasonLabels[selectedReport.reason] || selectedReport.reason}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comentario reportado</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      "{selectedReport.reported_comment?.content || 'Contenido no disponible'}"
                    </p>
                  </div>
                </div>

                {selectedReport.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <p className="text-sm text-gray-700">{selectedReport.description}</p>
                  </div>
                )}

                {selectedReport.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleUpdateReportStatus(selectedReport.id, 'reviewed')}
                      disabled={actionLoading === selectedReport.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Eye className="h-4 w-4" />
                      Marcar como revisado
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(selectedReport.id, 'resolved')}
                      disabled={actionLoading === selectedReport.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolver
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(selectedReport.id, 'dismissed')}
                      disabled={actionLoading === selectedReport.id}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Descartar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;