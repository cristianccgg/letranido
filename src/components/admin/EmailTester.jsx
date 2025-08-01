// components/admin/EmailTester.jsx - Componente para probar emails desde el admin
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Send, CheckCircle, AlertCircle, Clock, Edit, Eye, X } from 'lucide-react';
import { sendContestEmailViaSupabase } from '../../lib/email/supabase-emails.js';
import { useGlobalApp } from '../../contexts/GlobalAppContext';

const EmailTester = () => {
  const { currentContest, contests } = useGlobalApp();
  const [loading, setLoading] = useState({}); // Cambiar a objeto para loading individual
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('contest');
  const [manualEmailForm, setManualEmailForm] = useState({
    subject: '',
    htmlContent: '',
    textContent: ''
  });
  
  // Estados para preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState({}); // Cambiar a objeto para loading individual
  const [activePreviewTab, setActivePreviewTab] = useState('html');

  // Efecto para manejar el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = 'hidden';
      
      // Agregar listener para cerrar con ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowPreview(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showPreview]);

  // Función para generar preview del email
  const handlePreviewEmail = async (emailType, manualData = null) => {
    // Validar formulario para emails manuales
    if (manualData && (!manualData.subject || !manualData.htmlContent)) {
      setResult({ 
        success: false, 
        message: "Por favor completa al menos el asunto y el contenido HTML antes del preview" 
      });
      return;
    }

    setPreviewLoading(prev => ({ ...prev, [emailType]: true }));
    try {
      let requestData = { emailType, preview: true };
      
      // Para emails de concurso, incluir el contestId apropiado
      const isContestEmail = ["new_contest", "submission_reminder", "voting_started", "results"].includes(emailType);
      if (isContestEmail) {
        if (emailType === "results") {
          // Para emails de resultados, buscar el último concurso CERRADO (finalized_at no null)
          console.log("🏆 Buscando concurso cerrado para preview de resultados...");
          
          // Buscar concursos finalizados ordenados por fecha de finalización más reciente
          const finalizedContests = contests?.filter(c => c.finalized_at !== null) || [];
          const latestFinalized = finalizedContests.sort((a, b) => 
            new Date(b.finalized_at) - new Date(a.finalized_at)
          )[0];
          
          if (latestFinalized) {
            requestData.contestId = latestFinalized.id;
            console.log(`✅ Usando concurso cerrado: "${latestFinalized.title}" (${latestFinalized.id})`);
          } else {
            // No hay concursos finalizados, mostrar error
            throw new Error("No hay concursos finalizados para generar preview de resultados");
          }
        } else {
          // Para otros emails de concurso, usar el concurso actual
          requestData.contestId = currentContest?.id;
        }
      }
      
      // Si es email manual, agregar los datos del formulario
      if (manualData) {
        requestData = {
          ...requestData,
          subject: manualData.subject,
          htmlContent: manualData.htmlContent,
          textContent: manualData.textContent
        };
      }
      
      // Debug: Mostrar exactamente qué se está enviando
      console.log("📤 Enviando request para preview:", requestData);
      
      // Llamar a la función de Supabase con flag de preview
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contest-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      console.log("📥 Respuesta de Supabase:", result);
      
      if (result.success && result.preview) {
        setPreviewData({
          emailType,
          subject: result.preview.subject,
          htmlContent: result.preview.htmlContent,
          textContent: result.preview.textContent
        });
        setShowPreview(true);
      } else {
        // Manejar diferentes formatos de error de la API
        const errorMessage = result.error || result.message || 'Error desconocido';
        
        // ❌ PROBLEMA: La función envió email en lugar de hacer preview
        if (result.success && result.sent) {
          setResult({ 
            success: false, 
            message: `❌ ERROR CRÍTICO: El preview envió ${result.sent} emails reales en lugar de mostrar preview. Revisa la función de Supabase.` 
          });
          console.error('🚨 PREVIEW ENVIÓ EMAILS REALES:', result);
        } else {
          setResult({ success: false, message: 'No se pudo generar el preview: ' + errorMessage });
          console.error('Preview error:', result);
        }
      }
    } catch (error) {
      console.error('Network error generating preview:', error);
      setResult({ success: false, message: 'Error de conexión generando preview: ' + error.message });
    }
    setPreviewLoading(prev => ({ ...prev, [emailType]: false }));
  };

  // Función universal para enviar emails (concurso y manuales)
  const handleSendEmail = async (emailType, manualData = null) => {
    setLoading(prev => ({ ...prev, [emailType]: true }));
    try {
      let requestData = { emailType };
      
      // Para emails de concurso, incluir el contestId apropiado
      const isContestEmail = ["new_contest", "submission_reminder", "voting_started", "results"].includes(emailType);
      if (isContestEmail) {
        if (emailType === "results") {
          // Para emails de resultados, usar el último concurso cerrado
          console.log("🏆 Buscando concurso cerrado para envío de resultados...");
          
          const finalizedContests = contests?.filter(c => c.finalized_at !== null) || [];
          const latestFinalized = finalizedContests.sort((a, b) => 
            new Date(b.finalized_at) - new Date(a.finalized_at)
          )[0];
          
          if (latestFinalized) {
            requestData.contestId = latestFinalized.id;
            console.log(`✅ Enviando resultados de: "${latestFinalized.title}" (${latestFinalized.id})`);
          } else {
            throw new Error("No hay concursos finalizados para enviar resultados");
          }
        } else {
          // Para otros emails de concurso, usar el concurso actual
          requestData.contestId = currentContest?.id;
        }
      }
      
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
    setLoading(prev => ({ ...prev, [emailType]: false }));
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
    { type: 'new_contest', label: '🎯 Nuevo Concurso', desc: 'Email de concurso disponible (usa concurso actual)' },
    { type: 'submission_reminder', label: '⏰ Recordatorio', desc: 'Recordatorio de últimos días para enviar (usa concurso actual)' },
    { type: 'voting_started', label: '🗳️ Votación Iniciada', desc: 'Notificar que inició la votación (usa concurso actual)' },
    { type: 'results', label: '🏆 Resultados', desc: 'Anunciar ganadores del concurso (usa último concurso FINALIZADO)' }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 hover:border-purple-200 p-8 transition-all duration-300">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
          <Mail className="h-5 w-5 text-white" />
        </div>
        Sistema de Emails - Envío de Pruebas
      </h2>

      {/* Tabs modernizados */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('contest')}
            className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
              activeTab === 'contest'
                ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🎯 Emails de Concurso
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
              activeTab === 'manual'
                ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            📧 Emails Manuales
          </button>
        </div>
      </div>

      {/* Información sobre concursos disponibles */}
      {activeTab === 'contest' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Información de Concursos</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• <strong>Concurso Actual:</strong> {currentContest?.title || "Ninguno"} {currentContest?.finalized_at ? "(Finalizado)" : "(Activo)"}</div>
            <div>• <strong>Para emails de resultados:</strong> Se usará el último concurso finalizado</div>
            <div>• <strong>Concursos finalizados disponibles:</strong> {contests?.filter(c => c.finalized_at !== null).length || 0}</div>
            {contests?.filter(c => c.finalized_at !== null).length > 0 && (
              <div className="ml-4 text-xs">
                → Último finalizado: "{contests.filter(c => c.finalized_at !== null).sort((a, b) => new Date(b.finalized_at) - new Date(a.finalized_at))[0]?.title}"
              </div>
            )}
          </div>
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>⚠️ IMPORTANTE:</strong> Los emails de concurso solo van a usuarios con <code>contest_notifications=true</code> + newsletter subscribers.
            </p>
          </div>
        </div>
      )}

      {/* Emails de Concurso */}
      {activeTab === 'contest' && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Emails Automáticos de Concurso</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {contestEmailTypes.map((email) => (
              <div key={email.type} className="bg-white/95 backdrop-blur-sm border border-indigo-100 hover:border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <h4 className="font-bold text-gray-900 mb-2 text-lg">{email.label}</h4>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{email.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreviewEmail(email.type)}
                    disabled={previewLoading[email.type] || loading[email.type]}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center font-medium transition-all duration-300"
                  >
                    {previewLoading[email.type] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                    Preview
                  </button>
                  <button
                    onClick={() => handleSendEmail(email.type)}
                    disabled={loading[email.type] || previewLoading[email.type]}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {loading[email.type] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Enviar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emails Manuales */}
      {activeTab === 'manual' && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Emails Manuales</h3>
          
          {/* Información sobre tipos de emails */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h4 className="font-semibold text-yellow-800 mb-3">📬 Tipos de Email Manual</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold text-purple-700">📝 Generales</div>
                <div className="text-gray-600">Solo usuarios que activaron <code>general_notifications</code></div>
              </div>
              <div>
                <div className="font-semibold text-indigo-700">📰 Newsletter</div>
                <div className="text-gray-600">Solo usuarios que activaron <code>general_notifications</code></div>
              </div>
              <div>
                <div className="font-semibold text-red-700">🛡️ Esenciales</div>
                <div className="text-gray-600">TODOS los usuarios con email (ignora preferencias)</div>
              </div>
            </div>
          </div>
          
          {/* Formulario para email manual */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-2xl p-6 mb-6 shadow-lg">
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

          {/* Botones para enviar - Modernizados */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-sm border border-purple-100 hover:border-purple-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <h4 className="font-bold text-gray-900 mb-2 text-lg">📝 Generales</h4>
              <p className="text-sm text-gray-600 mb-2 leading-relaxed">Tips, actualizaciones, newsletter general</p>
              <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg mb-3">
                <strong>👥 Destinatarios:</strong> Usuarios con <code>general_notifications=true</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreviewEmail('manual_general', manualEmailForm)}
                  disabled={previewLoading['manual_general'] || loading['manual_general']}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center font-medium transition-all duration-300"
                >
                  {previewLoading['manual_general'] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                  Preview
                </button>
                <button
                  onClick={() => handleSendManualEmail('manual_general')}
                  disabled={loading['manual_general'] || previewLoading['manual_general']}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {loading['manual_general'] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Enviar
                </button>
              </div>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm border border-indigo-100 hover:border-indigo-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <h4 className="font-bold text-gray-900 mb-2 text-lg">📰 Newsletter</h4>
              <p className="text-sm text-gray-600 mb-2 leading-relaxed">Newsletter específico</p>
              <div className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg mb-3">
                <strong>👥 Destinatarios:</strong> Usuarios con <code>general_notifications=true</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreviewEmail('manual_newsletter', manualEmailForm)}
                  disabled={previewLoading['manual_newsletter'] || loading['manual_newsletter']}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center font-medium transition-all duration-300"
                >
                  {previewLoading['manual_newsletter'] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                  Preview
                </button>
                <button
                  onClick={() => handleSendManualEmail('manual_newsletter')}
                  disabled={loading['manual_newsletter'] || previewLoading['manual_newsletter']}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {loading['manual_newsletter'] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Enviar
                </button>
              </div>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm border border-red-100 hover:border-red-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <h4 className="font-bold text-gray-900 mb-2 text-lg">🛡️ Emails Esenciales</h4>
              <p className="text-sm text-gray-600 mb-2 leading-relaxed">Seguridad, términos legales, confirmaciones críticas</p>
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mb-3">
                <strong>⚠️ CUIDADO:</strong> Va a <strong>TODOS</strong> los usuarios con email válido, independientemente de sus preferencias
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreviewEmail('manual_essential', manualEmailForm)}
                  disabled={previewLoading['manual_essential'] || loading['manual_essential']}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center font-medium transition-all duration-300"
                >
                  {previewLoading['manual_essential'] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                  Preview
                </button>
                <button
                  onClick={() => handleSendManualEmail('manual_essential')}
                  disabled={loading['manual_essential'] || previewLoading['manual_essential']}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-lg hover:from-pink-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {loading['manual_essential'] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado - Modernizado */}
      {result && (
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 ${result.success ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}>
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

      {/* Información del sistema - Modernizada */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 via-blue-50 to-indigo-50 border border-green-200 rounded-2xl shadow-lg">
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

      {/* Modal de Preview usando Portal */}
      {showPreview && previewData && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            zIndex: 999999999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={(e) => {
            // Cerrar modal si se hace click en el backdrop
            if (e.target === e.currentTarget) {
              setShowPreview(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            style={{ 
              zIndex: 999999999,
              position: 'relative'
            }}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Preview del Email</h3>
                <p className="text-sm text-gray-600 mt-1">Tipo: {previewData.emailType}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="overflow-y-auto max-h-[70vh]">
              {/* Subject */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="text-sm text-gray-600 font-medium mb-1">Asunto:</div>
                <div className="text-lg font-semibold text-gray-900">{previewData.subject}</div>
              </div>

              {/* Tabs para HTML y Texto */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActivePreviewTab('html')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activePreviewTab === 'html'
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Vista HTML
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('text')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activePreviewTab === 'text'
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Vista Texto
                  </button>
                </div>
              </div>

              {/* Contenido del preview */}
              <div className="p-4">
                {activePreviewTab === 'html' ? (
                  <div className="border rounded-lg p-4 bg-white">
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewData.htmlContent }}
                      className="email-preview"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {previewData.textContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Esto es exactamente como se verá el email enviado
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleSendEmail(previewData.emailType);
                  }}
                  disabled={loading[previewData?.emailType]}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Enviar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EmailTester;