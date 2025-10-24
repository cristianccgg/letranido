import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Mail, 
  Cookie, 
  Bell, 
  Shield, 
  User,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  Trash2,
} from 'lucide-react';
import { useGlobalApp } from '../contexts/GlobalAppContext';
import { supabase } from '../lib/supabase';
import CookieSettingsModal from '../components/ui/CookieSettingsModal';

const Preferences = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, 
    cookieConsent, 
    showCookieBannerAgain,
    resetCookieConsent,
    openAuthModal,
    simulateUserDeletion,
    deleteUserAccount
  } = useGlobalApp();

  // Verificar si el usuario está autenticado
  useEffect(() => {
    if (!user) {
      // Mostrar modal de autenticación y luego redirigir de vuelta
      openAuthModal('login');
      
      // Opcional: puedes almacenar la ruta actual para volver después del login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [user, navigate, location.pathname, openAuthModal]);
  
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loadingEmailPrefs, setLoadingEmailPrefs] = useState(false);
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  

  // Estados para eliminación de cuenta
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionStep, setDeletionStep] = useState('simulation'); // 'simulation' | 'confirmation' | 'processing'
  const [simulationResult, setSimulationResult] = useState(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [deletionLoading, setDeletionLoading] = useState(false);

  // Cargar preferencias de email desde Supabase
  useEffect(() => {
    if (user?.id) {
      loadEmailPreferences();
    }
  }, [user?.id]);

  const loadEmailPreferences = async () => {
    if (!user?.id) return;
    
    setLoadingEmailPrefs(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email_notifications')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setEmailNotifications(data.email_notifications ?? true);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      setEmailResult({
        success: false,
        message: 'Error cargando preferencias: ' + error.message
      });
    }
    setLoadingEmailPrefs(false);
  };

  const handleSaveEmailPreferences = async () => {
    setSavingEmailPrefs(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ email_notifications: emailNotifications })
        .eq('id', user.id);

      if (error) throw error;

      setEmailResult({
        success: true,
        message: 'Preferencias de email guardadas exitosamente.'
      });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setEmailResult(null), 3000);
    } catch (error) {
      setEmailResult({
        success: false,
        message: 'Error guardando preferencias: ' + error.message
      });
    }
    setSavingEmailPrefs(false);
  };


  // Funciones para eliminación de cuenta
  const handleStartDeletion = async () => {
    setShowDeletionModal(true);
    setDeletionStep('simulation');
    setDeletionLoading(true);
    
    try {
      const result = await simulateUserDeletion();
      setSimulationResult(result);
    } catch (error) {
      setSimulationResult({ success: false, error: error.message });
    }
    
    setDeletionLoading(false);
  };

  const handleConfirmDeletion = async () => {
    if (confirmationText !== 'ELIMINAR MI CUENTA') {
      alert('Debes escribir exactamente "ELIMINAR MI CUENTA" para continuar');
      return;
    }

    const finalConfirm = window.confirm(
      '🚨 ÚLTIMA CONFIRMACIÓN: Esto eliminará TODOS tus datos permanentemente y no se puede deshacer. ¿Continuar?'
    );

    if (!finalConfirm) return;

    setDeletionStep('processing');
    setDeletionLoading(true);

    try {
      const result = await deleteUserAccount(null, { dryRun: false });
      
      if (result.success) {
        // Usuario será redirigido automáticamente tras logout
        alert('Tu cuenta ha sido eliminada exitosamente. Gracias por haber formado parte de Letranido.');
      } else {
        alert(`Error al eliminar la cuenta: ${result.error}`);
        setDeletionStep('confirmation');
      }
    } catch (error) {
      alert(`Error crítico: ${error.message}`);
      setDeletionStep('confirmation');
    }
    
    setDeletionLoading(false);
  };

  const resetDeletionModal = () => {
    setShowDeletionModal(false);
    setDeletionStep('simulation');
    setSimulationResult(null);
    setConfirmationText('');
    setDeletionLoading(false);
  };

  const getCookieStatusText = () => {
    if (!cookieConsent) return 'No configuradas';
    
    const activeCount = Object.values(cookieConsent).filter(value => 
      typeof value === 'boolean' && value
    ).length;
    
    return `${activeCount} tipos activos`;
  };

  const getCookieStatusColor = () => {
    if (!cookieConsent) return 'text-gray-500';
    
    const activeCount = Object.values(cookieConsent).filter(value => 
      typeof value === 'boolean' && value
    ).length;
    
    if (activeCount === 1) return 'text-red-600'; // Solo esenciales
    if (activeCount <= 2) return 'text-yellow-600'; // Pocas activas
    return 'text-green-600'; // Varias activas
  };

  // Si el usuario no está autenticado, mostrar loading o login
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Autenticación requerida
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Necesitas iniciar sesión para acceder a tus preferencias
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          Preferencias
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura tu experiencia en Letranido según tus necesidades
        </p>
      </div>

      <div className="space-y-8">
        {/* Información de Cuenta */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Información de Cuenta
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de usuario
              </label>
              <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {user?.display_name || user?.name || 'Usuario'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {user?.email || 'No disponible'}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Para cambiar tu nombre de usuario, email o configuración de privacidad, ve a tu perfil.
          </div>
        </section>

        {/* Notificaciones por Email */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
            Notificaciones por Email
          </h2>
          
          {loadingEmailPrefs ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando preferencias...</span>
            </div>
          ) : (
            <>
              {emailResult && (
                <div className={`mb-4 p-4 rounded-lg ${emailResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-center">
                    {emailResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    )}
                    <span className={`text-sm ${emailResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {emailResult.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Notificaciones esenciales - siempre activas */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Notificaciones esenciales
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Confirmaciones de cuenta, cambios de seguridad, actualizaciones críticas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Siempre activas</span>
                  </div>
                </div>

                {/* Nueva interfaz simplificada */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Notificaciones de Letranido
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Concursos, newsletter, tips de escritura, actualizaciones y más
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={(e) => {
                        setEmailNotifications(e.target.checked);
                        if (emailResult) setEmailResult(null);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                  </label>
                </div>

              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveEmailPreferences}
                  disabled={savingEmailPrefs}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                >
                  {savingEmailPrefs ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Preferencias
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </section>

        {/* Configuración de Cookies */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Cookie className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Configuración de Cookies
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">Estado actual</h3>
              <span className={`text-sm font-medium ${getCookieStatusColor()}`}>
                {getCookieStatusText()}
              </span>
            </div>
            
            {cookieConsent && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Última actualización:</strong> {' '}
                  {cookieConsent.timestamp 
                    ? new Date(cookieConsent.timestamp).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No disponible'
                  }
                </p>
                
                <div className="flex flex-wrap gap-2 mt-2">
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
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {labels[key]}: {value ? 'Sí' : 'No'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCookieSettings(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configurar Cookies
            </button>
            
            <button
              onClick={showCookieBannerAgain}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Mostrar Banner Nuevamente
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres resetear todas las preferencias de cookies? Esto volverá a mostrar el banner de consentimiento.')) {
                  resetCookieConsent();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Resetear Todo
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Las cookies nos ayudan a mejorar tu experiencia. Puedes configurar qué tipos 
              aceptas o consultar nuestra{' '}
              <a 
                href="/cookie-policy" 
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                política de cookies
              </a>{' '}
              para más información.
            </p>
          </div>
        </section>


        {/* Eliminar Cuenta */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            Eliminar Cuenta
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Eliminar permanentemente mi cuenta</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Esta acción es irreversible y eliminará todos tus datos personales
              </p>
            </div>
            <button 
              onClick={handleStartDeletion}
              disabled={deletionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-medium disabled:bg-gray-400"
            >
              {deletionLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar mi cuenta
            </button>
          </div>
        </section>
      </div>

      {/* Modal de Eliminación de Cuenta */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                Eliminar cuenta
              </h2>

              {deletionStep === 'simulation' && (
                <div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                        Vista previa de eliminación
                      </h3>
                    </div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Estos son los datos que se eliminarían permanentemente:
                    </p>
                  </div>

                  {deletionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="h-6 w-6 animate-spin text-primary-600 dark:text-primary-400" />
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Analizando tus datos...</span>
                    </div>
                  ) : simulationResult ? (
                    <div className="space-y-4">
                      {simulationResult.success ? (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Tus historias:</span> {simulationResult.simulation.stories.total}
                                {simulationResult.simulation.stories.winners > 0 && (
                                  <span className="text-red-600 dark:text-red-400 ml-1">
                                    ({simulationResult.simulation.stories.winners} ganadoras)
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Tus comentarios:</span> {simulationResult.simulation.comments}
                              </div>
                              <div>
                                <span className="font-medium">Tus votos:</span> {simulationResult.simulation.votes}
                              </div>
                              <div>
                                <span className="font-medium">Tus badges:</span> {simulationResult.simulation.badges}
                              </div>
                            </div>

                            {simulationResult.simulation.stories.total > 0 && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                                    ELIMINAR
                                  </span>
                                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Tus {simulationResult.simulation.stories.total} historias serán eliminadas
                                  </span>
                                </div>
                                <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                                  Nadie podrá leer su contenido. Serán eliminadas permanentemente.
                                </p>
                                
                                {simulationResult.simulation.stories.titles?.length > 0 && (
                                  <div>
                                    <strong className="text-xs">Historias a eliminar:</strong>
                                    <ul className="list-disc list-inside mt-1 text-xs text-red-600 dark:text-red-400">
                                      {simulationResult.simulation.stories.titles.map((title, index) => (
                                        <li key={index}>"{title}"</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                                  ELIMINAR
                                </span>
                                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                  Todos tus datos personales
                                </span>
                              </div>
                              <p className="text-xs text-red-700 dark:text-red-300">
                                Tu perfil, comentarios, votos, badges y notificaciones serán eliminados permanentemente.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <p className="text-red-600 dark:text-red-400">
                            Error: {simulationResult.error}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      ⚠️ Importante:
                    </h4>
                    <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                      <li>• Esta acción es <strong>irreversible</strong></li>
                      <li>• Se eliminarán TODOS tus datos personales</li>
                      <li>• Tus historias serán eliminadas - nadie podrá leerlas</li>
                      <li>• No podrás recuperar tu cuenta</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={resetDeletionModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setDeletionStep('confirmation')}
                      disabled={!simulationResult?.success}
                      className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:bg-gray-400"
                    >
                      Continuar con eliminación
                    </button>
                  </div>
                </div>
              )}

              {deletionStep === 'confirmation' && (
                <div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      🚨 Confirmación final
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      Para confirmar que realmente quieres eliminar tu cuenta, escribe exactamente:
                    </p>
                    <p className="font-mono font-bold text-red-800 dark:text-red-200 mt-2">
                      ELIMINAR MI CUENTA
                    </p>
                  </div>

                  <div className="mb-6">
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-red-500"
                      placeholder="Escribe la confirmación aquí..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeletionStep('simulation')}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleConfirmDeletion}
                      disabled={confirmationText !== 'ELIMINAR MI CUENTA'}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:bg-gray-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar cuenta permanentemente
                    </button>
                  </div>
                </div>
              )}

              {deletionStep === 'processing' && (
                <div className="text-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-red-600 dark:text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Eliminando tu cuenta...
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Por favor espera mientras eliminamos todos tus datos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Cookies */}
      <CookieSettingsModal 
        isOpen={showCookieSettings} 
        onClose={() => setShowCookieSettings(false)} 
      />
    </div>
  );
};

export default Preferences;