// lib/storyCategories.js - Categorías literarias para historias

export const STORY_CATEGORIES = [
  {
    id: 'ficcion',
    name: 'Ficción',
    description: 'Narrativa imaginativa y creativa'
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Historias centradas en relaciones amorosas'
  },
  {
    id: 'fantastico',
    name: 'Fantástico',
    description: 'Elementos mágicos o sobrenaturales'
  },
  {
    id: 'terror',
    name: 'Terror',
    description: 'Historias de miedo y suspenso'
  },
  {
    id: 'misterio',
    name: 'Misterio/Thriller',
    description: 'Enigmas, detective y suspenso'
  },
  {
    id: 'historico',
    name: 'Histórico',
    description: 'Ambientado en épocas pasadas'
  },
  {
    id: 'aventuras',
    name: 'Aventuras',
    description: 'Acción y experiencias emocionantes'
  },
  {
    id: 'humor',
    name: 'Humor/Comedia',
    description: 'Historias divertidas y cómicas'
  },
  {
    id: 'realista',
    name: 'Realista/Contemporáneo',
    description: 'Situaciones cercanas a la realidad actual'
  },
  {
    id: 'no-ficcion',
    name: 'No ficción',
    description: 'Ensayos, crónicas, textos autobiográficos'
  },
  {
    id: 'experimental',
    name: 'Experimental',
    description: 'Técnicas narrativas innovadoras'
  }
];

export const DEFAULT_STORY_CATEGORY = 'ficcion';

// Helper functions
export const getCategoryById = (id) => {
  return STORY_CATEGORIES.find(cat => cat.id === id) || STORY_CATEGORIES[0];
};

export const getCategoryName = (id) => {
  const category = getCategoryById(id);
  return category ? category.name : 'Ficción';
};

export const getCategoryOptions = () => {
  return STORY_CATEGORIES.map(cat => ({
    value: cat.id,
    label: cat.name,
    description: cat.description
  }));
};