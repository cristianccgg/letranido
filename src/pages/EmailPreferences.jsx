// pages/EmailPreferences.jsx - Página para gestionar preferencias de email
import { useState, useEffect } from 'react';
import { Mail, Bell, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalApp } from '../contexts/GlobalAppContext';
import { supabase } from '../lib/supabase';

const EmailPreferences = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useGlobalApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    new_contest_emails: true,
    reminder_emails: true,
    voting_emails: true,
    results_emails: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadPreferences();
  }, [isAuthenticated, navigate]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email_notifications')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences(prev => ({
          ...prev,
          email_notifications: data.email_notifications,
          new_contest_emails: data.email_notifications,
          reminder_emails: data.email_notifications,
          voting_emails: data.email_notifications,
          results_emails: data.email_notifications,
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setResult({
        success: false,
        message: 'Error cargando preferencias: ' + error.message
      });
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          email_notifications: preferences.email_notifications 
        })
        .eq('id', user.id);

      if (error) throw error;

      setResult({
        success: true,
        message: 'Preferencias guardadas exitosamente.'
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Error guardando preferencias: ' + error.message
      });
    }
    setSaving(false);
  };

  const handleToggle = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
      // Si se desactiva notificaciones generales, desactivar todas
      ...(key === 'email_notifications' && !value ? {
        new_contest_emails: false,
        reminder_emails: false,
        voting_emails: false,
        results_emails: false,
      } : {}),
      // Si se activa cualquier específica, activar generales
      ...(key !== 'email_notifications' && value ? {
        email_notifications: true
      } : {})
    }));
    // Limpiar resultado anterior
    if (result) setResult(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Necesitas iniciar sesión para ver tus preferencias.</p>
          <Link
            to="/"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Preferencias de Email
            </h1>
            <p className="text-gray-600">
              Controla qué notificaciones quieres recibir por email
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Cargando preferencias...</span>
            </div>
          ) : (
            <>
              {result && (
                <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? 'Éxito' : 'Error'}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Configuración principal */}
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-blue-600" />
                        Notificaciones por email
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Recibir emails sobre la actividad de Letranido
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.email_notifications}
                        onChange={(e) => handleToggle('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Tipos específicos de email */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tipos de notificaciones</h3>
                  
                  <div className="space-y-3">
                    {[
                      {
                        key: 'new_contest_emails',
                        title: '🎯 Nuevos concursos',
                        description: 'Cuando se publique un nuevo concurso'
                      },
                      {
                        key: 'reminder_emails',
                        title: '⏰ Recordatorios',
                        description: 'Recordatorios de fechas límite para enviar historias'
                      },
                      {
                        key: 'voting_emails',
                        title: '🗳️ Votaciones',
                        description: 'Cuando comience el período de votación'
                      },
                      {
                        key: 'results_emails',
                        title: '🏆 Resultados',
                        description: 'Cuando se anuncien los ganadores de concursos'
                      }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[item.key]}
                            onChange={(e) => handleToggle(item.key, e.target.checked)}
                            disabled={!preferences.email_notifications}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!preferences.email_notifications ? 'opacity-50' : ''}`}></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar preferencias'
                    )}
                  </button>
                  
                  <Link
                    to="/"
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors text-center"
                  >
                    Volver al inicio
                  </Link>
                </div>

                {/* Información adicional */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📧 Información sobre emails</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Solo enviamos emails relevantes sobre concursos y actividad de la plataforma</li>
                    <li>• Nunca compartimos tu email con terceros</li>
                    <li>• Puedes cambiar estas preferencias en cualquier momento</li>
                    <li>• Los emails importantes sobre tu cuenta siempre se enviarán</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;