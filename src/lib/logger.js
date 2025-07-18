// lib/logger.js - Sistema de logging inteligente para Letranido

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Logger inteligente que solo muestra logs en desarrollo
 * y permite filtrado por nivel y categoría
 */
class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    
    // En producción solo mostramos errores críticos
    this.currentLevel = isProduction ? this.levels.ERROR : this.levels.DEBUG;
    
    // Categorías para organizar logs
    this.categories = {
      AUTH: '🔐',
      EMAIL: '📧',
      CONTEST: '🏆',
      VOTE: '❤️',
      ADMIN: '⚙️',
      API: '🌐',
      UI: '🎨',
      PERF: '⚡',
      DB: '💾'
    };
  }

  _shouldLog(level) {
    return level <= this.currentLevel;
  }

  _formatMessage(level, category, message, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const categoryIcon = this.categories[category] || '📝';
    const levelName = Object.keys(this.levels)[level];
    
    return [`[${timestamp}] ${categoryIcon} ${levelName}:`, message, ...args];
  }

  error(category, message, ...args) {
    if (this._shouldLog(this.levels.ERROR)) {
      console.error(...this._formatMessage(this.levels.ERROR, category, message, ...args));
    }
  }

  warn(category, message, ...args) {
    if (this._shouldLog(this.levels.WARN)) {
      console.warn(...this._formatMessage(this.levels.WARN, category, message, ...args));
    }
  }

  info(category, message, ...args) {
    if (this._shouldLog(this.levels.INFO)) {
      console.info(...this._formatMessage(this.levels.INFO, category, message, ...args));
    }
  }

  debug(category, message, ...args) {
    if (this._shouldLog(this.levels.DEBUG)) {
      console.log(...this._formatMessage(this.levels.DEBUG, category, message, ...args));
    }
  }

  trace(category, message, ...args) {
    if (this._shouldLog(this.levels.TRACE)) {
      console.log(...this._formatMessage(this.levels.TRACE, category, message, ...args));
    }
  }

  // Métodos de conveniencia
  auth(message, ...args) {
    this.debug('AUTH', message, ...args);
  }

  email(message, ...args) {
    this.debug('EMAIL', message, ...args);
  }

  contest(message, ...args) {
    this.debug('CONTEST', message, ...args);
  }

  vote(message, ...args) {
    this.debug('VOTE', message, ...args);
  }

  admin(message, ...args) {
    this.debug('ADMIN', message, ...args);
  }

  api(message, ...args) {
    this.debug('API', message, ...args);
  }

  ui(message, ...args) {
    this.debug('UI', message, ...args);
  }

  perf(message, ...args) {
    this.debug('PERF', message, ...args);
  }

  db(message, ...args) {
    this.debug('DB', message, ...args);
  }

  // Método para timing de operaciones
  time(label) {
    if (isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Grupo de logs
  group(label) {
    if (isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  // Log de objetos con formato
  object(category, label, obj) {
    if (this._shouldLog(this.levels.DEBUG)) {
      this.debug(category, `${label}:`, obj);
    }
  }

  // Log para desarrollo únicamente
  dev(message, ...args) {
    if (isDevelopment) {
      console.log('🔧 DEV:', message, ...args);
    }
  }

  // Log crítico que siempre se muestra
  critical(message, ...args) {
    console.error('🚨 CRITICAL:', message, ...args);
  }
}

// Crear instancia global
const logger = new Logger();

// Función helper para migrar console.log existentes
export const devLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// Función helper para errores críticos
export const criticalError = (...args) => {
  console.error('🚨 CRITICAL ERROR:', ...args);
};

export default logger;

// Exportar categorías para uso conveniente
export const LogCategories = logger.categories;