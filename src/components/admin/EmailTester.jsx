// components/admin/EmailTester.jsx - Componente para probar emails desde el admin
import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Clock, Edit } from 'lucide-react';
import { sendContestEmailViaSupabase } from '../../lib/email/supabase-emails.js';

const EmailTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('contest');
  const [manualEmailForm, setManualEmailForm] = useState({
    subject: '',
    htmlContent: '',
    textContent: ''
  });

  // Función universal para enviar emails (concurso y manuales)
  const handleSendEmail = async (emailType, manualData = null) => {
    setLoading(true);
    try {
      let requestData = { emailType };
      
      // Si es email manual, agregar los datos del formulario
      if (manualData) {
        requestData = {
          ...requestData,
          subject: manualData.subject,
          htmlContent: manualData.htmlContent,
          textContent: manualData.textContent
        };
      }
      
      const sendResult = await sendContestEmailViaSupabase(requestData.emailType, requestData);
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

  // Enviar email manual usando el formulario
  const handleSendManualEmail = async (emailType) => {
    if (!manualEmailForm.subject || !manualEmailForm.htmlContent) {
      setResult({ 
        success: false, 
        message: "Por favor completa al menos el asunto y el contenido HTML" 
      });
      return;
    }
    
    await handleSendEmail(emailType, manualEmailForm);
  };

  const contestEmailTypes = [
    { type: 'new_contest', label: '🎯 Nuevo Concurso', desc: 'Email de concurso disponible' },
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

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('contest')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'contest'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 Emails de Concurso
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'manual'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📧 Emails Manuales
            </button>
          </div>
        </div>

        {/* Emails de Concurso */}
        {activeTab === 'contest' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Emails Automáticos de Concurso</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {contestEmailTypes.map((email) => (
                <div key={email.type} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">{email.label}</h4>
                  <p className="text-sm text-gray-600 mb-3">{email.desc}</p>
                  <button
                    onClick={() => handleSendEmail(email.type)}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emails Manuales */}
        {activeTab === 'manual' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Emails Manuales</h3>
            
            {/* Formulario para email manual */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Crear Email Manual</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto del Email
                  </label>
                  <input
                    type="text"
                    value={manualEmailForm.subject}
                    onChange={(e) => setManualEmailForm({...manualEmailForm, subject: e.target.value})}
                    placeholder="Ej: 📝 Nuevo artículo en el blog de Letranido"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido HTML
                  </label>
                  <textarea
                    value={manualEmailForm.htmlContent}
                    onChange={(e) => setManualEmailForm({...manualEmailForm, htmlContent: e.target.value})}
                    placeholder="<h2>Título del email</h2><p>Contenido del email...</p>"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido Texto (opcional)
                  </label>
                  <textarea
                    value={manualEmailForm.textContent}
                    onChange={(e) => setManualEmailForm({...manualEmailForm, textContent: e.target.value})}
                    placeholder="Versión en texto plano del email..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Botones para enviar */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">📝 Generales</h4>
                <p className="text-sm text-gray-600 mb-3">Tips, actualizaciones, newsletter (usuarios con notificaciones generales)</p>
                <button
                  onClick={() => handleSendManualEmail('manual_general')}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar
                </button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">📰 Newsletter</h4>
                <p className="text-sm text-gray-600 mb-3">Newsletter específico (usuarios con notificaciones generales)</p>
                <button
                  onClick={() => handleSendManualEmail('manual_newsletter')}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar
                </button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">🛡️ Esenciales</h4>
                <p className="text-sm text-gray-600 mb-3">Confirmaciones, seguridad (todos los usuarios con email)</p>
                <button
                  onClick={() => handleSendManualEmail('manual_essential')}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

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
          <h4 className="font-semibold text-green-800 mb-2">✅ Sistema Simplificado</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• ✅ <strong>3 categorías alineadas</strong> - Esenciales, Concursos, Generales</li>
            <li>• ✅ <strong>Emails de concurso</strong> - Solo a usuarios con contest_notifications = true</li>
            <li>• ✅ <strong>Emails generales</strong> - Solo a usuarios con general_notifications = true</li>
            <li>• ✅ <strong>Emails esenciales</strong> - A todos los usuarios con email válido</li>
            <li>• ✅ <strong>Modo test activo</strong> - Solo envía a cristianccggg@gmail.com</li>
            <li>• ✅ <strong>Formulario simple</strong> - Escribe tu contenido y envía</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailTester;