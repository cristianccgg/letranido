// portfolio-constants.js - Constantes para el sistema de historias libres

// Categorías disponibles para historias libres
export const STORY_CATEGORIES = [
  { value: 'romance', label: 'Romance', emoji: '💝', color: 'pink' },
  { value: 'drama', label: 'Drama', emoji: '🎭', color: 'blue' },
  { value: 'terror', label: 'Terror', emoji: '👻', color: 'red' },
  { value: 'sci-fi', label: 'Ciencia Ficción', emoji: '🚀', color: 'purple' },
  { value: 'fantasy', label: 'Fantasía', emoji: '🧙‍♂️', color: 'indigo' },
  { value: 'mystery', label: 'Misterio', emoji: '🔍', color: 'gray' },
  { value: 'comedy', label: 'Comedia', emoji: '😄', color: 'yellow' },
  { value: 'adventure', label: 'Aventura', emoji: '🗺️', color: 'green' },
  { value: 'slice-of-life', label: 'Vida Cotidiana', emoji: '☕', color: 'orange' },
  { value: 'historical', label: 'Histórico', emoji: '📜', color: 'amber' },
  { value: 'other', label: 'Otro', emoji: '✨', color: 'slate' }
];

// Helper para obtener categoría por valor
export const getCategoryByValue = (value) => {
  return STORY_CATEGORIES.find(cat => cat.value === value) || STORY_CATEGORIES[STORY_CATEGORIES.length - 1];
};

// Colores Tailwind para las categorías
export const CATEGORY_COLORS = {
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200'
};

// Límites para historias libres
export const PORTFOLIO_LIMITS = {
  MAX_TITLE_LENGTH: 100,
  MAX_WORD_COUNT_BASIC: 0, // Usuarios básicos no pueden publicar historias libres
  MAX_WORD_COUNT_PREMIUM: 3000,
  MIN_WORD_COUNT: 50,
  MAX_STORIES_PER_DAY: 3 // Límite anti-spam
};

// Mensajes para el sistema
export const PORTFOLIO_MESSAGES = {
  PREMIUM_REQUIRED: 'Solo los usuarios Premium pueden publicar historias libres',
  WORD_LIMIT_EXCEEDED: 'Has excedido el límite de palabras para historias libres',
  DAILY_LIMIT_EXCEEDED: 'Has alcanzado el límite diario de historias libres',
  CATEGORY_REQUIRED: 'Debes seleccionar una categoría para tu historia libre',
  SUCCESS_PUBLISHED: '¡Historia libre publicada exitosamente!',
  SUCCESS_UPDATED: '¡Historia libre actualizada exitosamente!'
};

// Configuración para el feed de historias libres
export const FEED_CONFIG = {
  STORIES_PER_PAGE: 12,
  DEFAULT_SORT: 'recent', // recent, popular, views
  SHOW_EXCERPT_LENGTH: 150
};

// Estadísticas del portafolio
export const PORTFOLIO_STATS = {
  EXCELLENT_ENGAGEMENT: 15, // % engagement considerado excelente
  GOOD_ENGAGEMENT: 8, // % engagement considerado bueno
  MIN_VIEWS_FOR_TRENDING: 50 // views mínimas para considerar trending
};