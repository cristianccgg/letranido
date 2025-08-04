// lib/email.js - Envío de emails con Resend
import { Resend } from 'resend';
import { getNewsletterEmails } from './newsletter';

// Inicializar Resend con tu API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Enviar notificación de nuevo concurso a todos los suscriptores
 * @param {Object} contest - Datos del concurso
 * @param {string} contest.title - Título del concurso
 * @param {string} contest.description - Descripción del concurso
 * @param {string} contest.month - Mes del concurso
 * @param {string} contest.submission_deadline - Fecha límite de envío
 * @param {number} contest.word_limit - Límite de palabras
 * @returns {Promise<{success: boolean, sentCount: number, errors: string[]}>}
 */
export const sendNewContestNotification = async (contest) => {
  try {
    // 1. Obtener todos los emails para newsletter
    const { success: fetchSuccess, emails, error: fetchError } = await getNewsletterEmails();
    
    if (!fetchSuccess || !emails || emails.length === 0) {
      console.error('No se pudieron obtener emails para newsletter:', fetchError);
      return {
        success: false,
        sentCount: 0,
        errors: [fetchError || 'No hay emails para enviar']
      };
    }

    console.log(`📧 Enviando notificación de concurso a ${emails.length} suscriptores`);

    // 2. Formatear fecha para mostrar
    const submissionDate = new Date(contest.submission_deadline).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 3. Preparar el contenido del email
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Nuevo Concurso en Letranido!</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .contest-title { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 15px 0; }
        .contest-description { font-size: 16px; color: #6b7280; margin: 0 0 30px 0; line-height: 1.7; }
        .details { background: linear-gradient(135deg, #eef2ff 0%, #f3e8ff 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .detail-item { display: flex; align-items: center; margin: 12px 0; }
        .detail-icon { width: 20px; height: 20px; margin-right: 12px; color: #6366f1; }
        .detail-text { font-size: 15px; color: #374151; font-weight: 500; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 30px 0; text-align: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; }
        .footer a { color: #6366f1; text-decoration: none; }
        .unsubscribe { margin-top: 20px; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Nuevo Concurso Disponible!</h1>
            <p>Letranido - Comunidad de Escritores</p>
        </div>
        
        <div class="content">
            <h2 class="contest-title">${contest.title}</h2>
            <p class="contest-description">${contest.description}</p>
            
            <div class="details">
                <div class="detail-item">
                    <svg class="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="detail-text">Concurso de ${contest.month}</span>
                </div>
                
                <div class="detail-item">
                    <svg class="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="detail-text">Cierra: ${submissionDate}</span>
                </div>
                
                ${contest.word_limit ? `
                <div class="detail-item">
                    <svg class="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="detail-text">Límite: ${contest.word_limit} palabras</span>
                </div>
                ` : ''}
            </div>
            
            <div style="text-align: center;">
                <a href="https://letranido.com/write/${contest.id}" class="cta-button">
                    ✍️ Escribir Mi Historia
                </a>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ¡Es tu momento de brillar! Lee el prompt, deja volar tu creatividad y comparte tu historia con nuestra comunidad de escritores.
            </p>
        </div>
    </div>
    
    <div class="footer">
        <p>¿Preguntas? Contáctanos en <a href="mailto:info@letranido.com">info@letranido.com</a></p>
        <div class="unsubscribe">
            <p>Recibiste este email porque te suscribiste a las notificaciones de concursos de Letranido.</p>
            <p><a href="https://letranido.com/unsubscribe?email={{email}}&token={{unsubscribe_token}}">Cancelar suscripción</a></p>
        </div>
    </div>
</body>
</html>`;

    const emailText = `
¡Nuevo Concurso en Letranido!

${contest.title}

${contest.description}

📅 Concurso de ${contest.month}
⏰ Cierra: ${submissionDate}
${contest.word_limit ? `📝 Límite: ${contest.word_limit} palabras` : ''}

¡Participa ahora!
👉 https://letranido.com/write/${contest.id}

¡Es tu momento de brillar! Lee el prompt, deja volar tu creatividad y comparte tu historia con nuestra comunidad de escritores.

---
¿Preguntas? Contáctanos en info@letranido.com

Para cancelar suscripción: https://letranido.com/unsubscribe
`;

    // 4. Enviar emails en lotes para evitar límites de rate
    const batchSize = 50; // Ajustar según límites de Resend
    const results = [];
    const errors = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      try {
        // Enviar a cada email del lote
        const batchPromises = batch.map(async (email) => {
          try {
            const result = await resend.emails.send({
              from: 'Letranido <noreply@letranido.com>', // Cambiar por tu dominio verificado
              to: email,
              subject: `🎯 Nuevo concurso: ${contest.title}`,
              html: emailHtml.replace(/{{email}}/g, email).replace(/{{unsubscribe_token}}/g, 'temp-token'),
              text: emailText,
              tags: [
                { name: 'type', value: 'new-contest' },
                { name: 'contest-id', value: contest.id.toString() },
                { name: 'contest-month', value: contest.month }
              ]
            });

            return { success: true, email, messageId: result.data?.id };
          } catch (error) {
            console.error(`Error enviando email a ${email}:`, error);
            return { success: false, email, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Pausa entre lotes para respetar rate limits
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error procesando lote ${i / batchSize + 1}:`, error);
        errors.push(`Error en lote: ${error.message}`);
      }
    }

    // 5. Analizar resultados
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (failed.length > 0) {
      console.error(`❌ ${failed.length} emails fallaron:`, failed.map(f => f.error));
      errors.push(...failed.map(f => `${f.email}: ${f.error}`));
    }

    console.log(`✅ Notificación enviada a ${successful.length}/${emails.length} suscriptores`);

    return {
      success: successful.length > 0,
      sentCount: successful.length,
      totalCount: emails.length,
      errors: errors,
      details: {
        successful: successful.length,
        failed: failed.length,
        batchesProcessed: Math.ceil(emails.length / batchSize)
      }
    };

  } catch (error) {
    console.error('Error inesperado enviando notificación:', error);
    return {
      success: false,
      sentCount: 0,
      errors: [error.message]
    };
  }
};

/**
 * Enviar email de bienvenida a nuevo suscriptor
 * @param {string} email - Email del suscriptor
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWelcomeEmail = async (email) => {
  try {
    const result = await resend.emails.send({
      from: 'Letranido <noreply@letranido.com>',
      to: email,
      subject: '🎉 ¡Bienvenido a Letranido!',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">¡Bienvenido a Letranido!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Tu comunidad de escritores creativos</p>
          </div>
          
          <div style="color: #374151; line-height: 1.6;">
            <p>¡Hola!</p>
            
            <p>Nos alegra mucho que te hayas unido a nuestra comunidad. Ahora recibirás notificaciones cada vez que inicie un nuevo concurso de escritura.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; color: #1f2937;">¿Qué puedes esperar?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Notificaciones de nuevos concursos mensuales</li>
                <li>Prompts creativos únicos cada mes</li>
                <li>Una comunidad activa de escritores</li>
                <li>Oportunidades de recibir feedback valioso</li>
              </ul>
            </div>
            
            <p>¡Mantente atento a tu bandeja de entrada!</p>
            
            <p>Con cariño,<br>El equipo de Letranido</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>Para cancelar suscripción, <a href="https://letranido.com/unsubscribe?email=${email}" style="color: #6366f1;">haz clic aquí</a></p>
          </div>
        </div>
      `,
      text: `¡Bienvenido a Letranido!

Nos alegra mucho que te hayas unido a nuestra comunidad. Ahora recibirás notificaciones cada vez que inicie un nuevo concurso de escritura.

¿Qué puedes esperar?
- Notificaciones de nuevos concursos mensuales
- Prompts creativos únicos cada mes
- Una comunidad activa de escritores
- Oportunidades de recibir feedback valioso

¡Mantente atento a tu bandeja de entrada!

Con cariño,
El equipo de Letranido

Para cancelar suscripción: https://letranido.com/unsubscribe?email=${email}`,
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'subscriber-type', value: 'newsletter' }
      ]
    });

    return {
      success: true,
      messageId: result.data?.id
    };

  } catch (error) {
    console.error('Error enviando email de bienvenida:', error);
    return {
      success: false,
      error: error.message
    };
  }
};