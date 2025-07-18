import { useCallback } from 'react';

/**
 * Hook para manejar errores de manera consistente en toda la aplicación
 */
export const useErrorHandler = () => {
  
  const logError = useCallback((error, context = '') => {
    console.error('❌ Error:', error);
    
    if (import.meta.env.PROD) {
      // En producción, enviar a servicio de monitoreo
      const errorData = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      console.log('📊 Error logged for monitoring:', errorData);
      // TODO: Integrar con Sentry, LogRocket, etc.
    }
  }, []);

  const handleError = useCallback((error, context = '') => {
    logError(error, context);
    
    // Mostrar notificación amigable al usuario
    const message = getErrorMessage(error);
    
    // TODO: Integrar con sistema de notificaciones/toast
    console.warn('⚠️ User-friendly error:', message);
    
    return message;
  }, [logError]);

  const handleAsyncError = useCallback(async (asyncOperation, context = '') => {
    try {
      return await asyncOperation();
    } catch (error) {
      const message = handleError(error, context);
      throw new Error(message);
    }
  }, [handleError]);

  const safeAsync = useCallback(async (asyncOperation, context = '', fallback = null) => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error, context);
      return fallback;
    }
  }, [handleError]);

  return {
    logError,
    handleError,
    handleAsyncError,
    safeAsync
  };
};

/**
 * Convierte errores técnicos en mensajes amigables para el usuario
 */
function getErrorMessage(error) {
  if (!error) return 'Ha ocurrido un error inesperado';
  
  const message = error.message || error.toString();
  
  // Errores de red
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return 'Error de conexión. Verifica tu internet y vuelve a intentar.';
  }
  
  // Errores de autenticación
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'Error de autenticación. Por favor, inicia sesión de nuevo.';
  }
  
  // Errores de Supabase
  if (message.includes('supabase') || message.includes('postgres')) {
    return 'Error del servidor. Inténtalo de nuevo en unos momentos.';
  }
  
  // Errores de email
  if (message.includes('email') || message.includes('resend')) {
    return 'Error enviando email. Verifica tu dirección de correo.';
  }
  
  // Errores de validación
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Los datos ingresados no son válidos. Verifica la información.';
  }
  
  // Errores de permisos
  if (message.includes('permission') || message.includes('access denied')) {
    return 'No tienes permisos para realizar esta acción.';
  }
  
  // Errores de límites
  if (message.includes('limit') || message.includes('quota') || message.includes('too many')) {
    return 'Has alcanzado el límite permitido. Inténtalo más tarde.';
  }
  
  // Error genérico para casos no contemplados
  if (import.meta.env.DEV) {
    return `Error de desarrollo: ${message}`;
  }
  
  return 'Ha ocurrido un error inesperado. Si persiste, contacta al soporte.';
}

export default useErrorHandler;