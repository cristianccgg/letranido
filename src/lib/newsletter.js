// lib/newsletter.js - Lógica de newsletter inteligente
import { supabase } from './supabase';

/**
 * Suscribir email a newsletter con deduplicación inteligente
 * @param {string} email - Email a suscribir
 * @returns {Promise<{success: boolean, message: string, isNewSubscription: boolean}>}
 */
export const subscribeToNewsletter = async (email) => {
  try {
    // 1. Validar email básico
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Por favor ingresa un email válido',
        isNewSubscription: false
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Verificar si ya existe un usuario registrado con este email
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, newsletter_contests')
      .eq('email', normalizedEmail)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // Error diferente a "no encontrado"
      console.error('Error checking existing user:', userError);
      return {
        success: false,
        message: 'Error verificando usuario existente',
        isNewSubscription: false
      };
    }

    // 3. Si existe usuario registrado, actualizar sus preferencias
    if (existingUser) {
      // Verificar si ya tiene activadas las notificaciones de concursos
      if (existingUser.newsletter_contests) {
        return {
          success: true,
          message: 'Ya estás suscrito a las notificaciones de concursos en tu cuenta',
          isNewSubscription: false
        };
      }

      // Activar notificaciones en su perfil
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ newsletter_contests: true })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user preferences:', updateError);
        return {
          success: false,
          message: 'Error activando notificaciones en tu cuenta',
          isNewSubscription: false
        };
      }

      return {
        success: true,
        message: 'Notificaciones activadas en tu cuenta existente',
        isNewSubscription: true
      };
    }

    // 4. Verificar si ya existe en newsletter_subscribers
    const { data: existingSubscriber, error: subscriberError } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (subscriberError && subscriberError.code !== 'PGRST116') {
      console.error('Error checking existing subscriber:', subscriberError);
      return {
        success: false,
        message: 'Error verificando suscripción existente',
        isNewSubscription: false
      };
    }

    // 5. Si ya está suscrito pero inactivo, reactivar
    if (existingSubscriber && !existingSubscriber.is_active) {
      const { error: reactivateError } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);

      if (reactivateError) {
        console.error('Error reactivating subscription:', reactivateError);
        return {
          success: false,
          message: 'Error reactivando suscripción',
          isNewSubscription: false
        };
      }

      return {
        success: true,
        message: 'Suscripción reactivada exitosamente',
        isNewSubscription: true
      };
    }

    // 6. Si ya está suscrito y activo
    if (existingSubscriber && existingSubscriber.is_active) {
      return {
        success: true,
        message: 'Ya estás suscrito a las notificaciones de concursos',
        isNewSubscription: false
      };
    }

    // 7. Crear nueva suscripción
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        source: 'landing_page',
        is_active: true
      });

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      
      // Manejar error de email duplicado (por si acaso)
      if (insertError.code === '23505') {
        return {
          success: true,
          message: 'Ya estás suscrito a las notificaciones',
          isNewSubscription: false
        };
      }

      return {
        success: false,
        message: 'Error creando suscripción',
        isNewSubscription: false
      };
    }

    return {
      success: true,
      message: 'Suscripción exitosa. Te notificaremos cuando inicie el próximo concurso',
      isNewSubscription: true
    };

  } catch (error) {
    console.error('Unexpected error in subscribeToNewsletter:', error);
    return {
      success: false,
      message: 'Error inesperado. Inténtalo de nuevo en unos minutos',
      isNewSubscription: false
    };
  }
};

/**
 * Obtener todos los emails para notificaciones de concursos
 * (Combina usuarios registrados + suscriptores de newsletter)
 * @returns {Promise<{success: boolean, emails: string[], error?: string}>}
 */
export const getNewsletterEmails = async () => {
  try {
    // 1. Obtener emails de usuarios registrados con newsletter activado
    const { data: registeredUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('newsletter_contests', true);

    if (usersError) {
      console.error('Error fetching registered users for newsletter:', usersError);
      return {
        success: false,
        emails: [],
        error: 'Error obteniendo usuarios registrados'
      };
    }

    // 2. Obtener emails de suscriptores de newsletter activos
    const { data: newsletterSubscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true);

    if (subscribersError) {
      console.error('Error fetching newsletter subscribers:', subscribersError);
      return {
        success: false,
        emails: [],
        error: 'Error obteniendo suscriptores de newsletter'
      };
    }

    // 3. Combinar y deduplicar emails
    const registeredEmails = registeredUsers?.map(u => u.email.toLowerCase()) || [];
    const subscriberEmails = newsletterSubscribers?.map(s => s.email.toLowerCase()) || [];
    
    // Usar Set para eliminar duplicados automáticamente
    const allEmails = [...new Set([...registeredEmails, ...subscriberEmails])];

    return {
      success: true,
      emails: allEmails,
      stats: {
        registeredUsers: registeredEmails.length,
        newsletterSubscribers: subscriberEmails.length,
        totalUnique: allEmails.length,
        duplicatesRemoved: (registeredEmails.length + subscriberEmails.length) - allEmails.length
      }
    };

  } catch (error) {
    console.error('Unexpected error in getNewsletterEmails:', error);
    return {
      success: false,
      emails: [],
      error: 'Error inesperado obteniendo emails'
    };
  }
};

/**
 * Migrar suscriptor de newsletter a usuario registrado
 * (Llamar cuando alguien se registra)
 * @param {string} email - Email del nuevo usuario
 * @param {string} userId - ID del usuario recién creado
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const migrateNewsletterToUser = async (email, userId) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verificar si existe en newsletter_subscribers
    const { data: subscriber, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking newsletter subscriber:', fetchError);
      return {
        success: false,
        message: 'Error verificando suscripción existente'
      };
    }

    // 2. Si no existe en newsletter, no hay nada que migrar
    if (!subscriber) {
      return {
        success: true,
        message: 'No había suscripción previa de newsletter'
      };
    }

    // 3. Si existía y estaba activo, activar newsletter en el perfil de usuario
    if (subscriber.is_active) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ newsletter_contests: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Error activating newsletter for new user:', updateError);
        return {
          success: false,
          message: 'Error activando newsletter en nuevo usuario'
        };
      }
    }

    // 4. Desactivar la suscripción de newsletter (no eliminar para historial)
    const { error: deactivateError } = await supabase
      .from('newsletter_subscribers')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', normalizedEmail);

    if (deactivateError) {
      console.error('Error deactivating newsletter subscription:', deactivateError);
      // No retornar error porque el usuario ya tiene newsletter activado
    }

    return {
      success: true,
      message: 'Newsletter migrado a cuenta de usuario exitosamente'
    };

  } catch (error) {
    console.error('Unexpected error in migrateNewsletterToUser:', error);
    return {
      success: false,
      message: 'Error inesperado migrando newsletter'
    };
  }
};