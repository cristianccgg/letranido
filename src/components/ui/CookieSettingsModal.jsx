import React, { useState } from 'react';
import { X, Cookie, Settings, Check, AlertTriangle } from 'lucide-react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';

const CookieSettingsModal = ({ isOpen, onClose }) => {
  const { cookieConsent, setCookieConsent, resetCookieConsent } = useGlobalApp();
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: cookieConsent?.analytics || false,
    marketing: cookieConsent?.marketing || false,
    personalization: cookieConsent?.personalization || false
  });

  if (!isOpen) return null;

  const handleSavePreferences = () => {
    setCookieConsent(preferences);
    onClose();
  };

  const handleResetConsent = () => {
    if (window.confirm('¿Estás seguro de que quieres resetear todas las preferencias de cookies? Esto volverá a mostrar el banner de consentimiento.')) {
      resetCookieConsent();
      onClose();
    }
  };

  const togglePreference = (type) => {
    if (type === 'essential') return;
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getConsentTimestamp = () => {
    if (cookieConsent?.timestamp) {
      return new Date(cookieConsent.timestamp).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'No disponible';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Cookie className="h-6 w-6 text-primary-600" />
              Configuración de Cookies
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Información Legal */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información Legal Importante</p>
                <p>
                  Como plataforma internacional, cumplimos con GDPR (Europa), CCPA (California), 
                  LGPD (Brasil) y regulaciones locales. Tienes derecho a modificar o eliminar 
                  tus preferencias en cualquier momento.
                </p>
              </div>
            </div>
          </div>

          {/* Estado Actual */}
          {cookieConsent && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Estado Actual</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Última actualización:</strong> {getConsentTimestamp()}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(cookieConsent).map(([key, value]) => {
                  if (key === 'timestamp') return null;
                  const labels = {
                    essential: 'Esenciales',
                    analytics: 'Analytics',
                    marketing: 'Marketing',
                    personalization: 'Personalización'
                  };
                  return (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {labels[key]}: {value ? 'Activado' : 'Desactivado'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Configuración de Cookies */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configurar Preferencias</h3>

            {/* Cookies Esenciales */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Cookies Esenciales</h4>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Siempre activas</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Necesarias para el funcionamiento básico del sitio web. Incluyen autenticación, 
                preferencias de idioma, seguridad y funcionalidades esenciales.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Ejemplos:</strong> Cookies de sesión, tokens CSRF, preferencias de accesibilidad
              </div>
            </div>

            {/* Analytics */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Cookies de Analytics</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.analytics}
                    onChange={() => togglePreference('analytics')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Nos ayudan a entender cómo interactúas con el sitio para mejorar la experiencia 
                de usuario y optimizar nuestros servicios literarios.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Ejemplos:</strong> Google Analytics, métricas de lectura, estadísticas de concursos
              </div>
            </div>

            {/* Marketing */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Cookies de Marketing</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.marketing}
                    onChange={() => togglePreference('marketing')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Permiten mostrarte contenido y recomendaciones relevantes basados en tus 
                intereses literarios y patrones de lectura.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Ejemplos:</strong> Recomendaciones personalizadas, anuncios de libros relevantes
              </div>
            </div>

            {/* Personalización */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Cookies de Personalización</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.personalization}
                    onChange={() => togglePreference('personalization')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Recordar tus preferencias como tema visual, configuraciones de editor, 
                y otras personalizaciones del sitio.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Ejemplos:</strong> Tema oscuro/claro, configuración del editor, filtros guardados
              </div>
            </div>
          </div>

          {/* Enlaces Legales */}
          <div className="border-t pt-4 mt-6">
            <p className="text-sm text-gray-600 mb-3">
              Para más información sobre cómo procesamos tus datos:
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Política de Privacidad
              </a>
              <a
                href="/cookie-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Política de Cookies
              </a>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Términos de Servicio
              </a>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetConsent}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Resetear Todo
            </button>
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieSettingsModal;