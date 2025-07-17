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
  Loader
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
    openAuthModal 
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
  const [contestNotifications, setContestNotifications] = useState(true);
  const [generalNotifications, setGeneralNotifications] = useState(false);
  const [newsletterContests, setNewsletterContests] = useState(true);
  const [loadingEmailPrefs, setLoadingEmailPrefs] = useState(false);
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

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
        .select('email_notifications, contest_notifications, general_notifications, newsletter_contests')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        // Si las nuevas columnas existen, usarlas; si no, usar email_notifications como fallback
        setEmailNotifications(data.email_notifications || false);
        setContestNotifications(data.contest_notifications ?? data.email_notifications ?? false);
        setGeneralNotifications(data.general_notifications ?? false);
        setNewsletterContests(data.newsletter_contests ?? true);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      // Si las columnas nuevas no existen, usar solo email_notifications
      if (error.message.includes('does not exist')) {
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_profiles')
            .select('email_notifications')
            .eq('id', user.id)
            .single();
          
          if (!fallbackError && fallbackData) {
            const emailEnabled = fallbackData.email_notifications;
            setEmailNotifications(emailEnabled);
            setContestNotifications(emailEnabled);
            setGeneralNotifications(false);
            setEmailResult({
              success: true,
              message: 'Preferencias cargadas (modo compatibilidad)'
            });
            setLoadingEmailPrefs(false);
            return;
          }
        } catch (fallbackErr) {
          console.error('Fallback error:', fallbackErr);
        }
      }
      
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
      // Intentar guardar con las nuevas columnas
      const updateData = {
        email_notifications: emailNotifications,
        contest_notifications: contestNotifications,
        general_notifications: generalNotifications,
        newsletter_contests: newsletterContests
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        // Si falla (columnas no existen), usar solo email_notifications
        if (error.message.includes('does not exist')) {
          const { error: fallbackError } = await supabase
            .from('user_profiles')
            .update({ 
              email_notifications: emailNotifications || contestNotifications
            })
            .eq('id', user.id);
          
          if (fallbackError) throw fallbackError;
          
          setEmailResult({
            success: true,
            message: 'Preferencias guardadas (modo compatibilidad). Considera ejecutar la migración de base de datos.'
          });
        } else {
          throw error;
        }
      } else {
        setEmailResult({
          success: true,
          message: 'Preferencias de email guardadas exitosamente.'
        });
      }

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
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Autenticación requerida
          </h2>
          <p className="text-gray-600">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary-600" />
          Preferencias
        </h1>
        <p className="text-gray-600">
          Configura tu experiencia en Letranido según tus necesidades
        </p>
      </div>

      <div className="space-y-8">
        {/* Información de Cuenta */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Información de Cuenta
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {user?.display_name || user?.name || 'Usuario'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {user?.email || 'No disponible'}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Para cambiar tu nombre de usuario o email, ve a tu perfil.
          </div>
        </section>

        {/* Notificaciones por Email */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Notificaciones por Email
          </h2>
          
          {loadingEmailPrefs ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Cargando preferencias...</span>
            </div>
          ) : (
            <>
              {emailResult && (
                <div className={`mb-4 p-4 rounded-lg ${emailResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {emailResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm ${emailResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {emailResult.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Notificaciones esenciales</h3>
                    <p className="text-sm text-gray-600">
                      Confirmaciones de cuenta, cambios de seguridad, actualizaciones importantes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Siempre activas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Notificaciones de concursos</h3>
                    <p className="text-sm text-gray-600">
                      Nuevos concursos, fechas límite, resultados de votaciones
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={(e) => {
                        setEmailNotifications(e.target.checked);
                        setContestNotifications(e.target.checked);
                        if (emailResult) setEmailResult(null);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Notificaciones generales</h3>
                    <p className="text-sm text-gray-600">
                      Tips de escritura, actualizaciones de funciones
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={generalNotifications}
                      onChange={(e) => {
                        setGeneralNotifications(e.target.checked);
                        if (emailResult) setEmailResult(null);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Newsletter de concursos</h3>
                    <p className="text-sm text-gray-600">
                      Resúmenes semanales de concursos, ganadores destacados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newsletterContests}
                      onChange={(e) => {
                        setNewsletterContests(e.target.checked);
                        if (emailResult) setEmailResult(null);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveEmailPreferences}
                  disabled={savingEmailPrefs}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400"
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
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cookie className="h-5 w-5 text-orange-600" />
            Configuración de Cookies
          </h2>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Estado actual</h3>
              <span className={`text-sm font-medium ${getCookieStatusColor()}`}>
                {getCookieStatusText()}
              </span>
            </div>
            
            {cookieConsent && (
              <div className="text-sm text-gray-600">
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
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configurar Cookies
            </button>
            
            <button
              onClick={showCookieBannerAgain}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
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
              className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Resetear Todo
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>
              Las cookies nos ayudan a mejorar tu experiencia. Puedes configurar qué tipos 
              aceptas o consultar nuestra{' '}
              <a 
                href="/cookie-policy" 
                className="text-primary-600 hover:text-primary-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                política de cookies
              </a>{' '}
              para más información.
            </p>
          </div>
        </section>

        {/* Privacidad y Seguridad */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Privacidad y Seguridad
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Política de Privacidad</h3>
                <p className="text-sm text-gray-600">Revisa cómo protegemos tus datos</p>
              </div>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Ver política →
              </a>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Términos de Servicio</h3>
                <p className="text-sm text-gray-600">Conoce las reglas de la plataforma</p>
              </div>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Ver términos →
              </a>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-gray-900">Eliminar Cuenta</h3>
                <p className="text-sm text-gray-600">Elimina permanentemente tu cuenta y datos</p>
              </div>
              <button 
                onClick={() => {
                  const subject = encodeURIComponent('Solicitud de Eliminación de Cuenta - Letranido');
                  const body = encodeURIComponent(`Hola,

Solicito la eliminación completa de mi cuenta de Letranido.

Detalles de mi cuenta:
- Email: ${user?.email}
- Nombre de usuario: ${user?.display_name || user?.name}
- ID de usuario: ${user?.id}

Entiendo que esta acción:
- Es irreversible
- Eliminará todos mis datos personales
- Anonimizará mis historias publicadas (para preservar concursos)
- Eliminará mis votos y comentarios

Razón para eliminar cuenta (opcional):
[Escribe aquí tu razón]

Confirmo que esta solicitud es voluntaria y que soy el titular de la cuenta.

Saludos,
${user?.display_name || user?.name}`);
                  
                  window.open(`mailto:admin@letranido.com?subject=${subject}&body=${body}`, '_blank');
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Solicitar eliminación →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Configuración de Cookies */}
      <CookieSettingsModal 
        isOpen={showCookieSettings} 
        onClose={() => setShowCookieSettings(false)} 
      />
    </div>
  );
};

export default Preferences;