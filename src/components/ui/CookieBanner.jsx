import React, { useState, useEffect } from 'react';
import { X, Cookie, Settings, Check } from 'lucide-react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import CookieSettingsModal from './CookieSettingsModal';

const CookieBanner = () => {
  const { setCookieConsent } = useGlobalApp();
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Siempre true, no modificable
    analytics: false,
    marketing: false,
    personalization: false
  });

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true
    };
    
    setCookieConsent(allAccepted);
    console.log('✅ Todas las cookies aceptadas');
  };

  const handleAcceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false
    };
    
    setCookieConsent(essentialOnly);
    console.log('✅ Solo cookies esenciales aceptadas');
  };

  const handleSavePreferences = () => {
    setCookieConsent(preferences);
    setShowSettings(false);
    console.log('✅ Preferencias de cookies guardadas:', preferences);
  };

  const togglePreference = (type) => {
    if (type === 'essential') return; // No se puede desactivar
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // El componente siempre renderiza cuando es llamado desde Layout

  return (
    <>
      {/* Modal de Configuración Avanzada */}
      <CookieSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Banner Principal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icono y Texto */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  Uso de Cookies en Letranido
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Utilizamos cookies para mejorar tu experiencia de lectura y escritura. 
                  Las cookies esenciales son necesarias para el funcionamiento del sitio. 
                  Puedes gestionar tus preferencias en cualquier momento. Al continuar navegando, 
                  aceptas el uso de cookies según nuestra política.
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <a
                    href="/privacy-policy"
                    className="text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Política de Privacidad
                  </a>
                  <a
                    href="/cookie-policy"
                    className="text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Política de Cookies
                  </a>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Configurar
              </button>
              <button
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Solo Esenciales
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 whitespace-nowrap"
              >
                Aceptar Todas
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieBanner;