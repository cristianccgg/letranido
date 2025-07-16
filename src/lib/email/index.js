// lib/email/index.js - Punto de entrada principal para el sistema de emails
export { 
  sendEmail, 
  sendBulkEmails, 
  getEmailRecipients, 
  checkEmailConfig,
  EMAIL_CONFIG 
} from './resend.js';

export { 
  newContestTemplate,
  submissionReminderTemplate,
  votingStartedTemplate,
  resultsTemplate,
  getTemplateByPhase
} from './templates.js';

export {
  getCurrentContestPhase,
  getActiveUsers,
  getStoriesCount,
  getContestWinners,
  sendNewContestEmail,
  sendSubmissionReminderEmail,
  sendVotingStartedEmail,
  sendResultsEmail,
  sendContestEmails,
  testEmailSystem
} from './contest-mailer.js';

// Función de utilidad para envío rápido desde cualquier parte de la app
export const quickSendContestEmail = async (emailType, contestId = null) => {
  const { supabase } = await import('../supabase.js');
  
  try {
    // Obtener concurso actual si no se especifica ID
    let contest;
    if (contestId) {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single();
      
      if (error) throw error;
      contest = data;
    } else {
      const { data: allContests, error } = await supabase
        .from('contests')
        .select('*')
        .is('finalized_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Use hybrid logic for contest selection
      if (allContests && allContests.length > 0) {
        const now = new Date();
        
        // Separate test and production contests
        const testContests = allContests.filter(c => 
          c.title && (c.title.toLowerCase().includes('test') || 
                     c.title.toLowerCase().includes('prueba') || 
                     c.title.toLowerCase().includes('demo'))
        );
        const productionContests = allContests.filter(c => 
          !testContests.includes(c)
        );
        
        // Priority 1: Test contests (most recent)
        if (testContests.length > 0) {
          contest = testContests[0];
        }
        // Priority 2: Production contests (by dates)
        else if (productionContests.length > 0) {
          const activeNow = productionContests.filter(c => {
            const votingDeadline = new Date(c.voting_deadline);
            return now <= votingDeadline;
          });
          
          if (activeNow.length > 0) {
            contest = activeNow.sort((a, b) => 
              new Date(a.submission_deadline) - new Date(b.submission_deadline)
            )[0];
          } else {
            contest = productionContests[0];
          }
        }
        // Fallback
        else {
          contest = allContests[0];
        }
      }
    }
    
    if (!contest) {
      throw new Error('No se encontró concurso para enviar email');
    }
    
    const { sendContestEmails } = await import('./contest-mailer.js');
    return await sendContestEmails(contest, emailType);
    
  } catch (error) {
    console.error('❌ Error en quickSendContestEmail:', error);
    return { success: false, error: error.message };
  }
};

// Configuración y verificación del sistema
export const setupEmailSystem = () => {
  const { checkEmailConfig } = require('./resend.js');
  
  console.log('📧 Inicializando sistema de emails de Letranido...');
  const config = checkEmailConfig();
  
  if (!config.hasApiKey) {
    console.warn('⚠️ ADVERTENCIA: No se encontró API key de Resend. Los emails no funcionarán.');
    console.log('💡 Agrega VITE_RESEND_API_KEY a tu archivo .env');
  } else {
    console.log(`✅ Sistema de emails configurado en modo: ${config.mode}`);
    if (config.mode === 'test') {
      console.log(`📧 Emails de prueba se enviarán a: ${config.adminEmail}`);
    }
  }
  
  return config;
};