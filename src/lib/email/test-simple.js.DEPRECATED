// Prueba simple de email sin depender de la base de datos
import { sendEmail } from './resend.js';
import { newContestTemplate } from './templates.js';

export const testSimpleEmail = async () => {
  try {
    console.log('🧪 Enviando email de prueba simple...');
    
    // Crear un concurso ficticio para la prueba
    const mockContest = {
      id: 'test-123',
      title: 'Concurso de Prueba - Sistema de Emails',
      description: 'Esta es una prueba del sistema de emails de Letranido. Si recibes este email, ¡todo funciona correctamente!',
      month: 'Enero',
      category: 'Prueba',
      min_words: 500,
      max_words: 1500,
      submission_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
      voting_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 días desde ahora
    };
    
    // Generar template
    const emailTemplate = newContestTemplate(mockContest);
    
    // Enviar solo al admin usando onboarding@resend.dev (dominio verificado por defecto)
    const result = await sendEmail({
      to: 'cristianccggg@gmail.com',
      subject: '🧪 [PRUEBA] ' + emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    });
    
    if (result.success) {
      console.log('✅ Email de prueba enviado exitosamente');
      return {
        success: true,
        message: 'Email de prueba enviado a cristianccggg@gmail.com',
        data: result.data
      };
    } else {
      console.error('❌ Error enviando email de prueba:', result.error);
      return {
        success: false,
        message: 'Error enviando email: ' + result.error
      };
    }
    
  } catch (error) {
    console.error('❌ Error en testSimpleEmail:', error);
    return {
      success: false,
      message: error.message
    };
  }
};