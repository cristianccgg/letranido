// lib/email/templates.js - Templates de email para Letranido
import { EMAIL_CONFIG } from './resend.js';

// Estilo base para todos los emails
const baseStyle = `
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
      color: white; 
      text-align: center; 
      padding: 40px 20px; 
      border-radius: 10px 10px 0 0; 
    }
    .content { 
      background: white; 
      padding: 30px; 
      border: 1px solid #e5e7eb; 
      border-top: none; 
    }
    .footer { 
      background: #f9fafb; 
      padding: 20px; 
      text-align: center; 
      border: 1px solid #e5e7eb; 
      border-top: none; 
      border-radius: 0 0 10px 10px; 
      font-size: 14px; 
      color: #6b7280; 
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold; 
      margin: 20px 0; 
    }
    .highlight { 
      background: #fef3c7; 
      padding: 15px; 
      border-radius: 8px; 
      border-left: 4px solid #f59e0b; 
      margin: 20px 0; 
    }
  </style>
`;

// Template base
const createEmailTemplate = (title, content, ctaButton = '') => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${baseStyle}
  </head>
  <body>
    <div class="header">
      <h1>🪶 Letranido</h1>
      <p style="margin: 0; opacity: 0.9;">Donde nacen las palabras</p>
    </div>
    
    <div class="content">
      ${content}
      ${ctaButton}
    </div>
    
    <div class="footer">
      <p>Este email fue enviado por <strong>Letranido</strong></p>
      <p>
        <a href="${EMAIL_CONFIG.siteUrl}/profile" style="color: #6366f1;">Gestionar preferencias</a> | 
        <a href="mailto:info@letranido.com" style="color: #6366f1;">Contacto</a>
      </p>
      <p style="margin-top: 15px; font-size: 12px;">
        © 2024 Letranido. Hecho con ❤️ para la comunidad escritora.
      </p>
    </div>
  </body>
  </html>
`;

// 1. NUEVO CONCURSO
export const newContestTemplate = (contest) => {
  const content = `
    <h2>🎯 ¡Nuevo concurso disponible!</h2>
    
    <p>¡Hola, escritor/a!</p>
    
    <p>Nos emociona anunciarte que ya está disponible el <strong>concurso de ${contest.month}</strong>:</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">"${contest.title}"</h3>
      <p style="margin-bottom: 0;">${contest.description}</p>
    </div>
    
    <p><strong>Detalles del concurso:</strong></p>
    <ul>
      <li>📝 <strong>Extensión:</strong> ${contest.min_words} - ${contest.max_words} palabras</li>
      <li>📅 <strong>Envío hasta:</strong> ${new Date(contest.submission_deadline).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
      })}</li>
    </ul>
    
    <p>¿Estás listo/a para el desafío? ¡Deja volar tu imaginación y crea algo increíble!</p>
  `;
  
  const button = `
    <div style="text-align: center;">
      <a href="${EMAIL_CONFIG.siteUrl}/write/${contest.id}" class="button">
        ✍️ Escribir mi historia
      </a>
    </div>
  `;
  
  return createEmailTemplate(`Nuevo concurso: ${contest.title}`, content, button);
};

// 2. RECORDATORIO DE ENVÍO
export const submissionReminderTemplate = (contest, daysLeft) => {
  const content = `
    <h2>⏰ ¡Últimos días para participar!</h2>
    
    <p>¡Hola!</p>
    
    <p>Te recordamos que quedan <strong>solo ${daysLeft} días</strong> para enviar tu historia al concurso de ${contest.month}:</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">"${contest.title}"</h3>
      <p style="margin-bottom: 0;">Cierre de envíos: <strong>${new Date(contest.submission_deadline).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
      })}</strong></p>
    </div>
    
    <p>Si ya tienes una idea, ¡este es el momento perfecto para plasmarla! Si aún no sabes qué escribir, recuerda que las mejores historias a veces nacen de la presión del último momento. 😉</p>
    
    <p><strong>Recuerda:</strong></p>
    <ul>
      <li>📝 Entre ${contest.min_words} y ${contest.max_words} palabras</li>
      <li>🎯 Usa el prompt como inspiración (síguelo exactamente, adaptalo o reinterpretalo)</li>
      <li>✨ ¡Total libertad creativa!</li>
    </ul>
  `;
  
  const button = `
    <div style="text-align: center;">
      <a href="${EMAIL_CONFIG.siteUrl}/write/${contest.id}" class="button">
        ✍️ Escribir ahora
      </a>
    </div>
  `;
  
  return createEmailTemplate(`Últimos días: ${contest.title}`, content, button);
};

// 3. INICIO DE VOTACIÓN
export const votingStartedTemplate = (contest, storiesCount) => {
  const content = `
    <h2>🗳️ ¡La votación ha comenzado!</h2>
    
    <p>¡Escritor/a increíble!</p>
    
    <p>La fase de envíos del concurso <strong>"${contest.title}"</strong> ha terminado y ahora comienza lo más emocionante: <strong>¡la votación!</strong></p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">📚 ${storiesCount} historias increíbles</h3>
      <p style="margin-bottom: 0;">Los escritores de Letranido han creado ${storiesCount} historias únicas. ¡Es hora de leerlas y votar por tus favoritas!</p>
    </div>
    
    <p><strong>¿Cómo funciona la votación?</strong></p>
    <ul>
      <li>📖 Lee las historias que más te llamen la atención</li>
      <li>❤️ Da "like" a las que más te gusten</li>
      <li>💬 Opcionalmente, deja comentarios constructivos</li>
      <li>🏆 Ayuda a elegir a los ganadores</li>
    </ul>
    
    <p>Tu voto es importante y ayuda a reconocer el talento de nuestra comunidad. ¡Cada historia merece ser leída!</p>
    
    <p><strong>Votación hasta:</strong> ${new Date(contest.voting_deadline).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    })}</p>
  `;
  
  const button = `
    <div style="text-align: center;">
      <a href="${EMAIL_CONFIG.siteUrl}/contest/current" class="button">
        📚 Leer y votar
      </a>
    </div>
  `;
  
  return createEmailTemplate(`¡Votación iniciada: ${contest.title}!`, content, button);
};

// 4. RESULTADOS - TEMPLATE REMOVIDO POR SEGURIDAD
// ⚠️ Este template fue removido porque mostraba ganadores directamente en el email
// El sistema ahora usa templates integrados en la función de Supabase que NO muestran ganadores
// Solo incluyen un link para ver los resultados en el sitio web
// 
// RAZÓN: Por política de privacidad y para crear expectativa, los emails NO deben
// mostrar información de ganadores directamente. Solo deben invitar a visitar el sitio.

// Función para obtener el template correcto según la fase
export const getTemplateByPhase = (phase, data) => {
  switch (phase) {
    case 'new_contest':
      return {
        subject: `🎯 Nuevo concurso disponible: "${data.contest.title}"`,
        html: newContestTemplate(data.contest),
        text: `Nuevo concurso disponible: "${data.contest.title}". Visita ${EMAIL_CONFIG.siteUrl}/write/${data.contest.id} para participar.`
      };
      
    case 'submission_reminder':
      return {
        subject: `⏰ Últimos ${data.daysLeft} días para participar en "${data.contest.title}"`,
        html: submissionReminderTemplate(data.contest, data.daysLeft),
        text: `Quedan ${data.daysLeft} días para participar en "${data.contest.title}". Visita ${EMAIL_CONFIG.siteUrl}/write/${data.contest.id}`
      };
      
    case 'voting_started':
      return {
        subject: `🗳️ ¡Votación iniciada! Lee y vota por las mejores historias`,
        html: votingStartedTemplate(data.contest, data.storiesCount),
        text: `La votación para "${data.contest.title}" ha comenzado. ${data.storiesCount} historias esperan tu voto. Visita ${EMAIL_CONFIG.siteUrl}/contest/current`
      };
      
    case 'results':
      return {
        subject: `🏆 ¡Resultados del concurso "${data.contest.title}"!`,
        html: resultsTemplate(data.contest, data.winners),
        text: `Resultados del concurso "${data.contest.title}" disponibles. Visita ${EMAIL_CONFIG.siteUrl}/contest/current`
      };
      
    default:
      throw new Error(`Template no encontrado para la fase: ${phase}`);
  }
};