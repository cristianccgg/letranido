// components/admin/EmailTester.jsx - Componente para probar emails desde el admin
import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { sendContestEmailViaSupabase } from '../../lib/email/supabase-emails.js';

const EmailTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Enviar email específico via Supabase
  const handleSendEmail = async (emailType) => {
    setLoading(true);
    try {
      const sendResult = await sendContestEmailViaSupabase(emailType);
      setResult({
        success: sendResult.success,
        message: sendResult.success 
          ? `Email '${emailType}' enviado a ${sendResult.sent} usuarios en modo ${sendResult.mode}` 
          : sendResult.error,
        data: sendResult
      });
    } catch (error) {
      setResult({ success: false, message: error.message });
    }
    setLoading(false);
  };

  const emailTypes = [
    { type: 'new_contest', label: '🎯 Nuevo Concurso', desc: 'Email de concurso disponible (funciona ✅)' },
    { type: 'submission_reminder', label: '⏰ Recordatorio', desc: 'Recordatorio de últimos días para enviar' },
    { type: 'voting_started', label: '🗳️ Votación Iniciada', desc: 'Notificar que inició la votación' },
    { type: 'results', label: '🏆 Resultados', desc: 'Anunciar ganadores del concurso' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Mail className="h-6 w-6 mr-2 text-blue-600" />
          Sistema de Emails - Envío de Pruebas
        </h2>

        {/* Tipos de Email */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Enviar Emails de Prueba</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {emailTypes.map((email) => (
              <div key={email.type} className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">{email.label}</h4>
                <p className="text-sm text-gray-600 mb-3">{email.desc}</p>
                <button
                  onClick={() => handleSendEmail(email.type)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resultado */}
        {result && (
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
            
            {result.data && (
              <div className="mt-3 p-3 bg-white rounded border text-sm">
                <pre className="text-gray-700">{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Información del sistema */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✅ Sistema Funcionando</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• ✅ <strong>Supabase Edge Functions</strong> - Emails desde el servidor</li>
            <li>• ✅ <strong>Modo test activo</strong> - Solo envía a cristianccggg@gmail.com</li>
            <li>• ✅ <strong>Resend integrado</strong> - Emails reales funcionando</li>
            <li>• ✅ <strong>Templates responsivos</strong> - HTML bonito en Gmail</li>
            <li>• ⚙️ <strong>Para producción:</strong> Cambiar EMAIL_MODE a 'production' en Supabase Secrets</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📧 Configuración Actual</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Origen:</strong> onboarding@resend.dev (para pruebas)</li>
            <li>• <strong>Destinatario test:</strong> cristianccggg@gmail.com</li>
            <li>• <strong>Solo usuarios con:</strong> email_notifications = true</li>
            <li>• <strong>Validación:</strong> Emails verificados antes de enviar</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailTester;