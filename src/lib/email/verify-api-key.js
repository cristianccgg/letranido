// Verificar API key de Resend directamente
export const verifyResendApiKey = async () => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'No API key found' };
  }
  
  try {
    console.log('🔍 Verificando API key con Resend...');
    console.log('📧 API Key (primeros 10 chars):', apiKey.substring(0, 10));
    
    // Hacer una petición simple a Resend para verificar la key
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Status de respuesta:', response.status);
    console.log('📡 Status text:', response.statusText);
    
    if (response.status === 401) {
      return {
        success: false,
        error: 'API key inválida o sin permisos',
        status: 401,
        details: 'La API key no es válida o no tiene los permisos necesarios'
      };
    }
    
    if (response.status === 403) {
      return {
        success: false,
        error: 'API key sin permisos suficientes',
        status: 403,
        details: 'La API key existe pero no tiene permisos para esta operación'
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: `Error HTTP ${response.status}`,
        status: response.status,
        statusText: response.statusText
      };
    }
    
    const data = await response.json();
    console.log('✅ Respuesta de Resend:', data);
    
    return {
      success: true,
      message: 'API key válida',
      data: data,
      domains: data.data || []
    };
    
  } catch (error) {
    console.error('❌ Error verificando API key:', error);
    return {
      success: false,
      error: error.message,
      type: 'network_error'
    };
  }
};