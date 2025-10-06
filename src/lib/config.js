// lib/config.js - Configuración centralizada de la aplicación

// Configuración del sitio
export const SITE_CONFIG = {
  name: 'Letranido',
  title: 'Letranido - Tu nido creativo de escritura',
  description: 'Participa en concursos mensuales de escritura y conecta con una comunidad apasionada por las historias. Recibe feedback real, mantén tus derechos y crece como escritor.',
  url: import.meta.env.VITE_SITE_URL || 'https://www.letranido.com',
  domain: 'letranido.com',
  keywords: 'escritura creativa, concursos de escritura, comunidad escritores, historias originales, ficción, narrativa, letranido',
};

// Configuración de Supabase
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
};

// Configuración de Email
export const EMAIL_CONFIG = {
  apiKey: import.meta.env.VITE_RESEND_API_KEY,
  from: import.meta.env.VITE_FROM_EMAIL || 'info@letranido.com',
  mode: import.meta.env.VITE_EMAIL_MODE || 'test',
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'cristianccggg@gmail.com',
  replyTo: 'info@letranido.com',
};

// Configuración de Analytics
export const ANALYTICS_CONFIG = {
  gaId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  enableInDevelopment: import.meta.env.DEV ? false : true,
};

// Configuración de aplicación
export const APP_CONFIG = {
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  version: '1.0.0',
};

// Feature flags para desarrollo gradual
export const FEATURES = {
  // 🚫 PREMIUM FEATURES - Desactivadas temporalmente (Octubre 2024)
  // Se reactivarán cuando haya suficiente masa crítica de usuarios
  // Para reactivar: cambiar false a import.meta.env.DEV
  PREMIUM_PLANS: import.meta.env.VITE_ENABLE_PREMIUM === 'true', // Desactivado
  PORTFOLIO_STORIES: import.meta.env.VITE_ENABLE_PORTFOLIO === 'true', // Desactivado
  PREMIUM_EDITOR: import.meta.env.VITE_ENABLE_PREMIUM_EDITOR === 'true', // Desactivado
  BETA_ROUTES: import.meta.env.VITE_BETA_ROUTES === 'true', // Desactivado

  // ✅ FEATURES ACTIVAS
  FEEDBACK_SYSTEM: import.meta.env.VITE_ENABLE_FEEDBACK === 'true',
};

// URLs importantes
export const URLS = {
  home: SITE_CONFIG.url,
  contest: `${SITE_CONFIG.url}/contest/current`,
  write: `${SITE_CONFIG.url}/write`,
  terms: `${SITE_CONFIG.url}/terms`,
  privacy: `${SITE_CONFIG.url}/privacy`,
  guidelines: `${SITE_CONFIG.url}/community-guidelines`,
};

// Validar configuración crítica
export const validateConfig = () => {
  const errors = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (EMAIL_CONFIG.mode === 'production' && !EMAIL_CONFIG.apiKey) {
    errors.push('VITE_RESEND_API_KEY is required for production email mode');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:', errors);
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
  
  console.log('✅ Configuration validation passed');
  return true;
};

// Configuración por defecto para desarrollo
export const DEV_DEFAULTS = {
  siteUrl: 'http://localhost:5173',
  fromEmail: 'noreply@letranido.com',
  adminEmail: 'admin@letranido.com',
};

export default {
  SITE_CONFIG,
  SUPABASE_CONFIG,
  EMAIL_CONFIG,
  ANALYTICS_CONFIG,
  APP_CONFIG,
  URLS,
  validateConfig,
};