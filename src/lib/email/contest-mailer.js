// lib/email/contest-mailer.js - Sistema automático de emails para concursos
import { supabase } from '../supabase.js';
import { sendBulkEmails, checkEmailConfig } from './resend.js';
import { getTemplateByPhase } from './templates.js';

// Detectar la fase actual del concurso
export const getCurrentContestPhase = async (contest) => {
  // Usar el status de la base de datos directamente
  switch (contest.status) {
    case 'submission':
      return 'submission_phase';
    case 'voting':
      return 'voting_phase';
    case 'results':
      return 'results_phase';
    default:
      // Fallback: detectar por fechas si el status no está claro
      const now = new Date();
      const submissionDeadline = new Date(contest.submission_deadline);
      const votingDeadline = new Date(contest.voting_deadline);
      
      if (now < submissionDeadline) {
        return 'submission_phase';
      } else if (now >= submissionDeadline && now < votingDeadline) {
        return 'voting_phase';
      } else {
        return 'results_phase';
      }
  }
};

// Obtener todos los usuarios registrados que pueden recibir emails
export const getActiveUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('email, username')
      .not('email', 'is', null);
    
    if (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }
    
    return users.filter(user => user.email);
  } catch (error) {
    console.error('❌ Error en getActiveUsers:', error);
    return [];
  }
};

// Obtener conteo de historias para un concurso
export const getStoriesCount = async (contestId) => {
  try {
    const { count, error } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId);
    
    if (error) {
      console.error('❌ Error contando historias:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('❌ Error en getStoriesCount:', error);
    return 0;
  }
};

// Obtener ganadores de un concurso
export const getContestWinners = async (contestId, limit = 3) => {
  try {
    // Primero obtener las historias ganadoras
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, excerpt, likes_count, user_id')
      .eq('contest_id', contestId)
      .order('likes_count', { ascending: false })
      .limit(limit);
    
    if (storiesError) {
      console.error('❌ Error obteniendo historias ganadoras:', storiesError);
      return [];
    }
    
    if (!stories || stories.length === 0) {
      return [];
    }
    
    // Luego obtener los nombres de usuario de user_profiles
    const userIds = stories.map(story => story.user_id);
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, username')
      .in('user_id', userIds);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      // Continuar sin nombres de usuario
    }
    
    // Combinar datos
    return stories.map(story => {
      const user = users?.find(u => u.user_id === story.user_id);
      return {
        ...story,
        author: user?.username || 'Anónimo'
      };
    });
    
  } catch (error) {
    console.error('❌ Error en getContestWinners:', error);
    return [];
  }
};

// 1. ENVIAR EMAIL DE NUEVO CONCURSO
export const sendNewContestEmail = async (contest) => {
  try {
    console.log('📧 Enviando email de nuevo concurso:', contest.title);
    
    const users = await getActiveUsers();
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para notificar');
      return { success: true, sent: 0 };
    }
    
    const emailData = getTemplateByPhase('new_contest', { contest });
    
    const result = await sendBulkEmails({
      recipients: users.map(u => u.email),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });
    
    // Registrar el envío en la base de datos
    await logEmailSent('new_contest', contest.id, result.sent);
    
    console.log(`✅ Email de nuevo concurso enviado a ${result.sent} usuarios`);
    return result;
    
  } catch (error) {
    console.error('❌ Error enviando email de nuevo concurso:', error);
    return { success: false, error: error.message };
  }
};

// 2. ENVIAR RECORDATORIO DE ENVÍO
export const sendSubmissionReminderEmail = async (contest, daysLeft = 3) => {
  try {
    console.log(`📧 Enviando recordatorio de envío: ${daysLeft} días restantes`);
    
    const users = await getActiveUsers();
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para notificar');
      return { success: true, sent: 0 };
    }
    
    const emailData = getTemplateByPhase('submission_reminder', { 
      contest, 
      daysLeft 
    });
    
    const result = await sendBulkEmails({
      recipients: users.map(u => u.email),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });
    
    await logEmailSent('submission_reminder', contest.id, result.sent);
    
    console.log(`✅ Recordatorio enviado a ${result.sent} usuarios`);
    return result;
    
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    return { success: false, error: error.message };
  }
};

// 3. ENVIAR EMAIL DE INICIO DE VOTACIÓN
export const sendVotingStartedEmail = async (contest) => {
  try {
    console.log('📧 Enviando email de inicio de votación');
    
    const users = await getActiveUsers();
    const storiesCount = await getStoriesCount(contest.id);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para notificar');
      return { success: true, sent: 0 };
    }
    
    const emailData = getTemplateByPhase('voting_started', { 
      contest, 
      storiesCount 
    });
    
    const result = await sendBulkEmails({
      recipients: users.map(u => u.email),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });
    
    await logEmailSent('voting_started', contest.id, result.sent);
    
    console.log(`✅ Email de votación enviado a ${result.sent} usuarios`);
    return result;
    
  } catch (error) {
    console.error('❌ Error enviando email de votación:', error);
    return { success: false, error: error.message };
  }
};

// 4. ENVIAR EMAIL DE RESULTADOS
export const sendResultsEmail = async (contest) => {
  try {
    console.log('📧 Enviando email de resultados');
    
    const users = await getActiveUsers();
    const winners = await getContestWinners(contest.id);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para notificar');
      return { success: true, sent: 0 };
    }
    
    if (winners.length === 0) {
      console.log('⚠️ No hay ganadores para anunciar');
      return { success: false, error: 'No hay ganadores' };
    }
    
    const emailData = getTemplateByPhase('results', { 
      contest, 
      winners 
    });
    
    const result = await sendBulkEmails({
      recipients: users.map(u => u.email),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });
    
    await logEmailSent('results', contest.id, result.sent);
    
    console.log(`✅ Email de resultados enviado a ${result.sent} usuarios`);
    return result;
    
  } catch (error) {
    console.error('❌ Error enviando email de resultados:', error);
    return { success: false, error: error.message };
  }
};

// Registrar envío de email en la base de datos
const logEmailSent = async (emailType, contestId, recipientCount) => {
  try {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        email_type: emailType,
        contest_id: contestId,
        recipient_count: recipientCount,
        sent_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('❌ Error registrando envío de email:', error);
    }
  } catch (error) {
    console.error('❌ Error en logEmailSent:', error);
  }
};

// Función principal para automáticamente enviar emails según la fase
export const sendContestEmails = async (contest, emailType) => {
  // Verificar configuración de email antes de enviar
  const config = checkEmailConfig();
  if (!config.hasApiKey) {
    console.error('❌ No se puede enviar emails: falta API key de Resend');
    return { success: false, error: 'Falta configuración de email' };
  }
  
  console.log(`📧 Enviando email tipo: ${emailType} para concurso: ${contest.title}`);
  
  switch (emailType) {
    case 'new_contest':
      return await sendNewContestEmail(contest);
      
    case 'submission_reminder':
      // Calcular días restantes
      const daysLeft = Math.ceil(
        (new Date(contest.submission_deadline) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return await sendSubmissionReminderEmail(contest, daysLeft);
      
    case 'voting_started':
      return await sendVotingStartedEmail(contest);
      
    case 'results':
      return await sendResultsEmail(contest);
      
    default:
      console.error(`❌ Tipo de email desconocido: ${emailType}`);
      return { success: false, error: `Tipo de email no válido: ${emailType}` };
  }
};

// Función para probar el sistema de emails
export const testEmailSystem = async () => {
  try {
    console.log('🧪 Probando sistema de emails...');
    
    const config = checkEmailConfig();
    console.log('📧 Configuración:', config);
    
    // Obtener el concurso actual (cualquier concurso que no esté finalizado)
    const { data: allContests, error } = await supabase
      .from('contests')
      .select('*')
      .is('finalized_at', null)
      .order('created_at', { ascending: false });
    
    // Use hybrid logic for contest selection
    let contest = null;
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
    
    if (error || !contest) {
      console.log('⚠️ No hay concurso activo para probar');
      return { success: false, error: 'No hay concurso activo' };
    }
    
    // Detectar fase actual
    const phase = await getCurrentContestPhase(contest);
    console.log(`📅 Fase actual del concurso: ${phase}`);
    
    // Contar usuarios y historias
    const users = await getActiveUsers();
    const storiesCount = await getStoriesCount(contest.id);
    
    console.log(`👥 Usuarios activos: ${users.length}`);
    console.log(`📚 Historias en concurso: ${storiesCount}`);
    
    return {
      success: true,
      data: {
        config,
        contest: contest.title,
        phase,
        users: users.length,
        stories: storiesCount,
      }
    };
    
  } catch (error) {
    console.error('❌ Error probando sistema:', error);
    return { success: false, error: error.message };
  }
};