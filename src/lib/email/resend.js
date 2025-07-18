// lib/email/resend.js - Configuración de Resend para Letranido
import { Resend } from 'resend';

// Configuración de Resend
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// Configuración de emails
export const EMAIL_CONFIG = {
  from: import.meta.env.VITE_FROM_EMAIL || 'noreply@letranido.com',
  mode: import.meta.env.VITE_EMAIL_MODE || 'test', // 'test' | 'production'
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'admin@letranido.com',
  replyTo: 'info@letranido.com',
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://letranido.com',
};

// Función para determinar destinatarios según el modo
export const getEmailRecipients = (users) => {
  if (EMAIL_CONFIG.mode === 'test') {
    console.log(`📧 [EMAIL TEST MODE] Enviando a admin en lugar de ${users.length} usuarios`);
    return [EMAIL_CONFIG.adminEmail];
  }
  
  return users.map(user => user.email).filter(email => email);
};

// Función principal para enviar emails
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log(`📧 Enviando email: "${subject}" a ${Array.isArray(to) ? to.length : 1} destinatario(s)`);
    
    // TEMPORAL: Como estamos en frontend, simular el envío para desarrollo
    if (EMAIL_CONFIG.mode === 'test') {
      console.log('🧪 MODO TEST: Simulando envío de email');
      console.log('📧 Email simulado:');
      console.log('- From:', EMAIL_CONFIG.from);
      console.log('- To:', Array.isArray(to) ? to : [to]);
      console.log('- Subject:', subject);
      console.log('- HTML length:', html?.length || 0);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const simulatedResult = {
        id: 'test-' + Date.now(),
        from: EMAIL_CONFIG.from,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        created_at: new Date().toISOString()
      };
      
      console.log(`✅ Email simulado enviado:`, simulatedResult);
      return { success: true, data: simulatedResult };
    }
    
    // En modo producción, intentar envío real (requiere backend)
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: EMAIL_CONFIG.replyTo,
    });

    console.log(`✅ Email enviado exitosamente:`, result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error(`❌ Error enviando email:`, error);
    return { success: false, error: error.message };
  }
};

// Función para enviar emails en lote (para notificaciones masivas)
export const sendBulkEmails = async ({ recipients, subject, html, text }) => {
  try {
    const actualRecipients = getEmailRecipients(
      recipients.map(email => ({ email }))
    );

    if (actualRecipients.length === 0) {
      console.log('📧 No hay destinatarios válidos para enviar emails');
      return { success: true, sent: 0 };
    }

    const result = await sendEmail({
      to: actualRecipients,
      subject,
      html,
      text,
    });

    return {
      success: result.success,
      sent: actualRecipients.length,
      mode: EMAIL_CONFIG.mode,
      data: result.data,
      error: result.error,
    };
    
  } catch (error) {
    console.error('❌ Error en envío masivo:', error);
    return { success: false, error: error.message };
  }
};

// Función para verificar configuración
export const checkEmailConfig = () => {
  const config = {
    hasApiKey: !!import.meta.env.VITE_RESEND_API_KEY,
    mode: EMAIL_CONFIG.mode,
    from: EMAIL_CONFIG.from,
    adminEmail: EMAIL_CONFIG.adminEmail,
  };
  
  console.log('📧 Configuración de email:', config);
  return config;
};

export default resend;