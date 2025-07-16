// lib/admin-newsletter.js - Funciones de administrador para newsletters
import { sendNewContestNotification } from './email';
import { supabase } from './supabase';

/**
 * Enviar notificación de nuevo concurso (solo para admins)
 * @param {string} contestId - ID del concurso
 * @param {string} adminUserId - ID del usuario admin que ejecuta la acción
 * @returns {Promise<{success: boolean, result?: object, error?: string}>}
 */
export const adminSendContestNotification = async (contestId, adminUserId) => {
  try {
    // 1. Verificar que el usuario es admin
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_founder')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser || (!adminUser.is_admin && !adminUser.is_founder)) {
      console.error('Usuario no autorizado intentando enviar newsletter:', { adminUserId, adminUser });
      return {
        success: false,
        error: 'Usuario no autorizado para enviar notificaciones'
      };
    }

    // 2. Obtener datos del concurso
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      console.error('Error obteniendo datos del concurso:', contestError);
      return {
        success: false,
        error: 'Concurso no encontrado'
      };
    }

    // 3. Verificar que el concurso está en estado válido para envío
    if (contest.status !== 'active' && contest.status !== 'submission') {
      return {
        success: false,
        error: `El concurso debe estar activo para enviar notificaciones (estado actual: ${contest.status})`
      };
    }

    // 4. Verificar que no se haya enviado notificación recientemente
    // (opcional: agregar campo last_notification_sent al contest)
    const now = new Date();
    const contestStart = new Date(contest.created_at);
    const hoursSinceCreation = (now - contestStart) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      console.warn(`Enviando notificación para concurso creado hace ${hoursSinceCreation.toFixed(1)} horas`);
    }

    // 5. Enviar notificación
    console.log(`📧 Admin ${adminUserId} enviando notificación para concurso: ${contest.title}`);
    
    const result = await sendNewContestNotification(contest);

    // 6. Registrar la acción en logs (opcional)
    if (result.success) {
      try {
        await supabase
          .from('admin_actions') // Crear esta tabla si no existe
          .insert({
            admin_user_id: adminUserId,
            action_type: 'send_contest_notification',
            target_id: contestId,
            details: {
              sentCount: result.sentCount,
              totalCount: result.totalCount,
              errors: result.errors?.length || 0
            },
            performed_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Error registrando acción de admin:', logError);
        // No fallar por esto
      }
    }

    return {
      success: result.success,
      result: {
        sentCount: result.sentCount,
        totalCount: result.totalCount,
        successRate: result.totalCount > 0 ? (result.sentCount / result.totalCount * 100).toFixed(1) : 0,
        errors: result.errors,
        contest: {
          id: contest.id,
          title: contest.title,
          month: contest.month
        }
      }
    };

  } catch (error) {
    console.error('Error inesperado enviando notificación de concurso:', error);
    return {
      success: false,
      error: 'Error inesperado enviando notificación'
    };
  }
};

/**
 * Obtener estadísticas de newsletter (solo para admins)
 * @param {string} adminUserId - ID del usuario admin
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getNewsletterStats = async (adminUserId) => {
  try {
    // 1. Verificar permisos de admin
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_founder')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser || (!adminUser.is_admin && !adminUser.is_founder)) {
      return {
        success: false,
        error: 'Usuario no autorizado'
      };
    }

    // 2. Obtener estadísticas de usuarios registrados con newsletter
    const { data: registeredUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('newsletter_contests')
      .eq('newsletter_contests', true);

    // 3. Obtener estadísticas de suscriptores de newsletter
    const { data: newsletterSubscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('is_active, created_at')
      .eq('is_active', true);

    // 4. Obtener suscriptores inactivos para análisis
    const { data: inactiveSubscribers, error: inactiveError } = await supabase
      .from('newsletter_subscribers')
      .select('is_active')
      .eq('is_active', false);

    if (usersError || subscribersError || inactiveError) {
      console.error('Error obteniendo estadísticas:', { usersError, subscribersError, inactiveError });
      return {
        success: false,
        error: 'Error obteniendo estadísticas'
      };
    }

    // 5. Calcular métricas
    const registeredCount = registeredUsers?.length || 0;
    const newsletterCount = newsletterSubscribers?.length || 0;
    const inactiveCount = inactiveSubscribers?.length || 0;
    const totalActive = registeredCount + newsletterCount;

    // Análisis de crecimiento (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubscribers = newsletterSubscribers?.filter(
      sub => new Date(sub.created_at) > thirtyDaysAgo
    ).length || 0;

    return {
      success: true,
      stats: {
        totalActiveSubscribers: totalActive,
        breakdown: {
          registeredUsers: registeredCount,
          newsletterOnly: newsletterCount,
          inactive: inactiveCount
        },
        growth: {
          last30Days: recentSubscribers,
          growthRate: newsletterCount > 0 ? ((recentSubscribers / newsletterCount) * 100).toFixed(1) : 0
        },
        estimatedReach: {
          emails: totalActive,
          openRate: '25-35%', // Estimado típico
          clickRate: '3-5%'   // Estimado típico
        },
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error inesperado obteniendo estadísticas:', error);
    return {
      success: false,
      error: 'Error inesperado obteniendo estadísticas'
    };
  }
};

/**
 * Previsualizar email de concurso (solo para admins)
 * @param {string} contestId - ID del concurso
 * @param {string} adminUserId - ID del usuario admin
 * @returns {Promise<{success: boolean, preview?: object, error?: string}>}
 */
export const previewContestEmail = async (contestId, adminUserId) => {
  try {
    // 1. Verificar permisos
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_founder')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser || (!adminUser.is_admin && !adminUser.is_founder)) {
      return {
        success: false,
        error: 'Usuario no autorizado'
      };
    }

    // 2. Obtener datos del concurso
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return {
        success: false,
        error: 'Concurso no encontrado'
      };
    }

    // 3. Formatear fecha para preview
    const submissionDate = new Date(contest.submission_deadline).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 4. Retornar preview con datos formateados
    return {
      success: true,
      preview: {
        subject: `🎯 Nuevo concurso: ${contest.title}`,
        contest: {
          title: contest.title,
          description: contest.description,
          month: contest.month,
          submissionDeadline: submissionDate,
          wordLimit: contest.word_limit,
          link: `https://letranido.com/write/${contest.id}`
        },
        metadata: {
          estimatedRecipients: 'Calculando...',
          estimatedDelivery: 'Inmediato',
          priority: 'Normal'
        }
      }
    };

  } catch (error) {
    console.error('Error generando preview:', error);
    return {
      success: false,
      error: 'Error generando preview'
    };
  }
};