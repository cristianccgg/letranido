// components/admin/MaintenanceControl.jsx - Control de modo mantenimiento para admin
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Power, 
  PowerOff, 
  Clock, 
  MessageSquare, 
  User, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Wrench,
  Eye,
  Award
} from 'lucide-react';
import { useMaintenanceMode } from '../../hooks/useMaintenanceMode';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import { fixWinnerBadges } from '../../utils/fix-badges';

const MaintenanceControl = () => {
  const { user } = useGlobalApp();
  const { 
    isActive, 
    message, 
    estimatedDuration, 
    activatedAt, 
    activatedBy, 
    loading, 
    error,
    toggleMaintenanceMode,
    refreshStatus 
  } = useMaintenanceMode();

  const [showToggleModal, setShowToggleModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  
  // Estados para fix de badges
  const [badgeFixLoading, setBadgeFixLoading] = useState(false);
  const [badgeFixResult, setBadgeFixResult] = useState(null);

  // Inicializar formulario con valores actuales
  useEffect(() => {
    if (message) setCustomMessage(message);
    if (estimatedDuration) setCustomDuration(estimatedDuration);
  }, [message, estimatedDuration]);

  // Presets de mensajes comunes
  const messagePresets = [
    {
      title: "Mantenimiento Rutinario",
      message: "Estamos realizando mejoras en el sitio. Volveremos en unos minutos.",
      duration: "15 minutos"
    },
    {
      title: "Actualización de Concursos",
      message: "Actualizando el sistema de concursos para mejorar tu experiencia de escritura.",
      duration: "10 minutos"
    },
    {
      title: "Mejoras de Rendimiento",
      message: "Optimizando la plataforma para una experiencia más rápida y fluida.",
      duration: "20 minutos"
    },
    {
      title: "Mantenimiento Urgente",
      message: "Solucionando un problema técnico. Disculpa las molestias.",
      duration: "30 minutos"
    }
  ];

  const handleToggle = async () => {
    setIsToggling(true);
    
    try {
      const result = await toggleMaintenanceMode(
        !isActive,
        customMessage || null,
        customDuration || null,
        user?.email || 'admin'
      );

      if (result.success) {
        setShowToggleModal(false);
        console.log(`✅ Modo mantenimiento ${!isActive ? 'activado' : 'desactivado'}`);
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Error toggleando mantenimiento:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handlePresetClick = (preset) => {
    setCustomMessage(preset.message);
    setCustomDuration(preset.duration);
  };

  const handlePreview = () => {
    // Abrir en nueva pestaña para preview
    const previewWindow = window.open('/maintenance-preview', '_blank');
    if (previewWindow) {
      previewWindow.focus();
    }
  };

  // 🚨 FUNCIÓN DE EMERGENCIA: Fix badges de ganadores
  const handleFixBadges = async () => {
    setBadgeFixLoading(true);
    setBadgeFixResult(null);
    
    try {
      const result = await fixWinnerBadges();
      setBadgeFixResult(result);
      
      if (result.success) {
        console.log('✅ Badges corregidos exitosamente:', result);
      } else {
        console.error('❌ Error corrigiendo badges:', result.error);
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setBadgeFixResult({
        success: false,
        error: error.message
      });
    } finally {
      setBadgeFixLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
          <span className="text-gray-600">Cargando estado de mantenimiento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Control de Mantenimiento</h2>
            <p className="text-gray-600">Gestiona el modo mantenimiento del sitio</p>
          </div>
        </div>
        
        <button
          onClick={refreshStatus}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          title="Actualizar estado"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Estado actual */}
      <div className={`rounded-2xl p-6 mb-6 border-2 ${
        isActive 
          ? 'bg-red-50 border-red-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isActive ? (
              <PowerOff className="w-6 h-6 text-red-600 mr-3" />
            ) : (
              <Power className="w-6 h-6 text-green-600 mr-3" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                isActive ? 'text-red-800' : 'text-green-800'
              }`}>
                {isActive ? 'Sitio en Mantenimiento' : 'Sitio Activo'}
              </h3>
              <p className={`text-sm ${
                isActive ? 'text-red-600' : 'text-green-600'
              }`}>
                {isActive ? 'Los usuarios ven la página de mantenimiento' : 'Funcionamiento normal'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowToggleModal(true)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
              isActive
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isActive ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento'}
          </button>
        </div>
      </div>

      {/* Información del mantenimiento activo */}
      {isActive && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-6 border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Información del Mantenimiento
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-orange-700">
                <strong>Mensaje:</strong> {message}
              </span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-orange-700">
                <strong>Duración estimada:</strong> {estimatedDuration}
              </span>
            </div>
            
            {activatedAt && (
              <div className="flex items-center">
                <User className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-orange-700">
                  <strong>Activado:</strong> {new Date(activatedAt).toLocaleString()} 
                  {activatedBy && ` por ${activatedBy}`}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-orange-200">
            <button
              onClick={handlePreview}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver página de mantenimiento
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* 🚨 PANEL DE EMERGENCIA: Fix badges de ganadores */}
      <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Award className="w-6 h-6 text-orange-600 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-orange-900">🚨 Corrección de Emergencia</h3>
              <p className="text-sm text-orange-700">Asignar badges faltantes a ganadores del concurso cerrado</p>
            </div>
          </div>
          
          <button
            onClick={handleFixBadges}
            disabled={badgeFixLoading}
            className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {badgeFixLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Award className="w-4 h-4 mr-2" />
            )}
            {badgeFixLoading ? 'Corrigiendo...' : 'Corregir Badges'}
          </button>
        </div>

        {/* Resultado del fix */}
        {badgeFixResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            badgeFixResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              {badgeFixResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${
                badgeFixResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {badgeFixResult.success ? '✅ Corrección exitosa' : '❌ Error en corrección'}
              </span>
            </div>
            
            <p className={`text-sm ${
              badgeFixResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {badgeFixResult.success 
                ? `${badgeFixResult.message}. Ganadores: ${badgeFixResult.winners?.join(', ')}`
                : badgeFixResult.error
              }
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-orange-600 bg-orange-100 rounded-lg p-3">
          <strong>⚠️ USAR SOLO EN EMERGENCIA:</strong> Los badges se asignan automáticamente al cerrar concursos. 
          Esta función es solo para corregir errores excepcionales o problemas retroactivos con badges faltantes 
          (contest_winner, contest_finalist, contest_winner_veteran).
          <br/><br/>
          <strong>✅ Normal:</strong> Cerrar concurso desde Admin Panel → Badges automáticos<br/>
          <strong>🚨 Emergencia:</strong> Usar este botón solo si los badges no se asignaron correctamente
        </div>
      </div>

      {/* Modal de confirmación */}
      {showToggleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {isActive ? 'Desactivar Modo Mantenimiento' : 'Activar Modo Mantenimiento'}
              </h3>

              {!isActive && (
                <>
                  {/* Presets de mensaje */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Plantillas Rápidas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {messagePresets.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => handlePresetClick(preset)}
                          className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                        >
                          <div className="font-medium text-gray-900 text-sm">{preset.title}</div>
                          <div className="text-xs text-gray-600 mt-1 truncate">{preset.message}</div>
                          <div className="text-xs text-indigo-600 mt-1">{preset.duration}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mensaje personalizado */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje para los usuarios
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Estamos realizando mejoras en el sitio. Volveremos en unos minutos."
                    />
                  </div>

                  {/* Duración estimada */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración estimada
                    </label>
                    <input
                      type="text"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="10 minutos"
                    />
                  </div>
                </>
              )}

              {/* Confirmación */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  {isActive 
                    ? '¿Estás seguro de que quieres desactivar el modo mantenimiento? Los usuarios podrán acceder nuevamente al sitio.'
                    : '¿Estás seguro de que quieres activar el modo mantenimiento? Los usuarios verán la página de mantenimiento instead del sitio normal.'
                  }
                </p>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowToggleModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isToggling}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggle}
                  disabled={isToggling}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                    isActive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isToggling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    isActive ? 'Desactivar' : 'Activar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceControl;