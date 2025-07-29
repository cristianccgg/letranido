// lib/console-replacer.js - Herramienta para reemplazar console.logs en producción

const isDevelopment = import.meta.env.DEV;

/**
 * Wrapper inteligente para console que se desactiva en producción
 * manteniendo solo errores críticos
 */
export const devConsole = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  error: (...args) => {
    // Los errores siempre se muestran
    console.error(...args);
  },
  
  group: (...args) => {
    if (isDevelopment) {
      console.group(...args);
    }
  },
  
  groupEnd: (...args) => {
    if (isDevelopment) {
      console.groupEnd(...args);
    }
  },
  
  time: (...args) => {
    if (isDevelopment) {
      console.time(...args);
    }
  },
  
  timeEnd: (...args) => {
    if (isDevelopment) {
      console.timeEnd(...args);
    }
  }
};

/**
 * Override global console en producción para limpiar logs automáticamente
 */
export const overrideConsoleForProduction = () => {
  if (!isDevelopment) {
    // En producción, mantener solo errores
    const originalError = console.error;
    
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.trace = () => {};
    console.group = () => {};
    console.groupEnd = () => {};
    console.time = () => {};
    console.timeEnd = () => {};
    
    // Mantener errores pero filtrar algunos
    console.error = (...args) => {
      // Solo mostrar errores realmente críticos
      const message = args.join(' ').toLowerCase();
      
      // Filtrar errores conocidos no críticos
      const nonCriticalErrors = [
        'warning:',
        'deprecated',
        'development only',
        'dev mode'
      ];
      
      const isCritical = !nonCriticalErrors.some(filter => 
        message.includes(filter)
      );
      
      if (isCritical) {
        originalError(...args);
      }
    };
  }
};

export default devConsole;