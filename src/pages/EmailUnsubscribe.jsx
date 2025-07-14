// pages/EmailUnsubscribe.jsx - Página para cancelar suscripción a emails
import { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useGlobalApp } from '../contexts/GlobalAppContext';
import { supabase } from '../lib/supabase';

const EmailUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useGlobalApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');
  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [user, userEmail]);

  const handleUnsubscribe = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Por favor ingresa tu email para desuscribirte.'
      });
      return;
    }

    setLoading(true);
    try {
      // Actualizar preferencias de email
      const { error } = await supabase
        .from('user_profiles')
        .update({ email_notifications: false })
        .eq('email', email.toLowerCase().trim());

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        message: 'Te has desuscrito exitosamente de las notificaciones por email.'
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Error al procesar la desuscripción: ' + error.message
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cancelar suscripción
            </h1>
            <p className="text-gray-600">
              Lamentamos verte partir. Puedes cancelar las notificaciones por email aquí.
            </p>
          </div>

          {result ? (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
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
              
              {result.success && (
                <div className="mt-4 space-y-2">
                  <Link
                    to="/email/preferences"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Gestionar otras preferencias →
                  </Link>
                  <br />
                  <Link
                    to="/"
                    className="inline-flex items-center text-gray-600 hover:text-gray-700 text-sm"
                  >
                    Volver al inicio →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <button
                onClick={handleUnsubscribe}
                disabled={loading || !email}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Cancelar suscripción'
                )}
              </button>

              <div className="text-center pt-4">
                <Link
                  to="/email/preferences"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ¿Prefieres gestionar tus preferencias?
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Recuerda</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Puedes volver a suscribirte desde tu perfil</li>
              <li>• Seguirás recibiendo emails importantes sobre tu cuenta</li>
              <li>• Tus historias y datos permanecen intactos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailUnsubscribe;