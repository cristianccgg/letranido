// Debug para verificar configuración de Resend
export const debugResendConfig = () => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  
  console.log('🔍 Debug de configuración Resend:');
  console.log('- API Key existe:', !!apiKey);
  console.log('- API Key válida:', apiKey?.startsWith('re_') || false);
  
  // Verificar todas las variables de entorno relacionadas
  console.log('📧 Variables de entorno:');
  console.log('- VITE_RESEND_API_KEY:', !!import.meta.env.VITE_RESEND_API_KEY);
  console.log('- VITE_FROM_EMAIL:', import.meta.env.VITE_FROM_EMAIL);
  console.log('- VITE_EMAIL_MODE:', import.meta.env.VITE_EMAIL_MODE);
  console.log('- VITE_ADMIN_EMAIL:', import.meta.env.VITE_ADMIN_EMAIL);
  
  return {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    isValidFormat: apiKey?.startsWith('re_') || false,
    from: import.meta.env.VITE_FROM_EMAIL,
    mode: import.meta.env.VITE_EMAIL_MODE,
    admin: import.meta.env.VITE_ADMIN_EMAIL
  };
};