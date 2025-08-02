// lib/email/local-test-mailer.js - Sistema de test 100% seguro
import { EMAIL_CONFIG } from './resend.js';

// Función de test que NUNCA envía emails reales
export const sendTestEmailLocal = async ({ subject, htmlContent, textContent }) => {
  try {
    console.log('🧪 MODO TEST LOCAL - NO SE ENVÍA EMAIL REAL');
    console.log('=====================================');
    console.log('📧 Subject:', subject);
    console.log('👤 TO (solo test):', EMAIL_CONFIG.adminEmail);
    console.log('📝 HTML length:', htmlContent?.length || 0);
    console.log('📄 Text length:', textContent?.length || 0);
    console.log('=====================================');
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // NUNCA hacer fetch real - solo simulación
    return {
      success: true,
      sent: 1,
      mode: 'LOCAL_TEST',
      recipients: [EMAIL_CONFIG.adminEmail],
      message: `EMAIL DE PRUEBA - Solo mostrado en consola, NO enviado realmente`,
      data: {
        id: 'local-test-' + Date.now(),
        subject,
        to: EMAIL_CONFIG.adminEmail,
        testMode: true
      }
    };
    
  } catch (error) {
    console.error('❌ Error en test local:', error);
    return {
      success: false,
      error: error.message,
      mode: 'LOCAL_TEST'
    };
  }
};

// Función para mostrar preview visual en nueva ventana
export const showEmailPreview = ({ subject, htmlContent, textContent }) => {
  const previewWindow = window.open('', '_blank', 'width=800,height=600');
  
  const previewHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Preview: ${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        .content { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        .tabs { margin-bottom: 20px; }
        .tab { display: inline-block; padding: 10px 20px; background: #eee; margin-right: 10px; cursor: pointer; }
        .tab.active { background: #007cba; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📧 PREVIEW DE EMAIL - MODO TEST</h2>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Para:</strong> ${EMAIL_CONFIG.adminEmail} (solo test)</p>
        <p style="color: red;"><strong>⚠️ ESTO ES SOLO PREVIEW - NO SE ENVÍA EMAIL REAL</strong></p>
      </div>
      
      <div class="tabs">
        <div class="tab active" onclick="showTab('html')">Vista HTML</div>
        <div class="tab" onclick="showTab('text')">Vista Texto</div>
      </div>
      
      <div id="html-content" class="tab-content active">
        <div class="content">
          ${htmlContent}
        </div>
      </div>
      
      <div id="text-content" class="tab-content">
        <div class="content">
          <pre style="white-space: pre-wrap;">${textContent || 'No hay versión texto'}</pre>
        </div>
      </div>
      
      <script>
        function showTab(tab) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
          document.querySelector(\`[onclick="showTab('\${tab}')"]\`).classList.add('active');
          document.getElementById(tab + '-content').classList.add('active');
        }
      </script>
    </body>
    </html>
  `;
  
  previewWindow.document.write(previewHTML);
  previewWindow.document.close();
  
  return {
    success: true,
    message: 'Preview abierto en nueva ventana'
  };
};

export default { sendTestEmailLocal, showEmailPreview };