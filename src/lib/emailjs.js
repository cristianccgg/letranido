import emailjs from '@emailjs/browser';

// Configuración de EmailJS
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

// Inicializar EmailJS (llamar una vez al cargar la app)
export const initEmailJS = () => {
  console.log('🔧 Inicializando EmailJS...');
  console.log('🔧 Service ID:', EMAILJS_CONFIG.serviceId ? 'CONFIGURADO' : 'FALTANTE');
  console.log('🔧 Template ID:', EMAILJS_CONFIG.templateId ? 'CONFIGURADO' : 'FALTANTE');
  console.log('🔧 Public Key:', EMAILJS_CONFIG.publicKey ? 'CONFIGURADO' : 'FALTANTE');
  
  if (EMAILJS_CONFIG.publicKey) {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log('✅ EmailJS inicializado correctamente');
  } else {
    console.error('❌ EmailJS Public Key no encontrada en las variables de entorno');
    console.error('❌ Variables necesarias: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY');
  }
};

// Función para enviar feedback
export const sendFeedback = async (feedbackData) => {
  const { email, type, message } = feedbackData;

  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId) {
    throw new Error('Configuración de EmailJS incompleta');
  }

  const templateParams = {
    user_email: email,
    feedback_type: type,
    message: message,
    timestamp: new Date().toLocaleString('es-ES', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    user_agent: navigator.userAgent,
    page_url: window.location.href,
    // Información adicional del contexto
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
  };

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('Feedback enviado exitosamente:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error enviando feedback:', error);
    throw error;
  }
};

// Validación de email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Tipos de feedback disponibles
export const FEEDBACK_TYPES = [
  {
    id: 'bug',
    label: 'Reportar Bug',
    description: 'Algo no funciona correctamente',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  },
  {
    id: 'suggestion',
    label: 'Sugerencia',
    description: 'Ideas para mejorar la plataforma',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200'
  },
  {
    id: 'general',
    label: 'Feedback General',
    description: 'Comentarios generales',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'contest',
    label: 'Idea de Concurso',
    description: 'Propuesta para futuros prompts',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200'
  }
];

export default {
  initEmailJS,
  sendFeedback,
  validateEmail,
  FEEDBACK_TYPES
};