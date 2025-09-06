// utils/textAnalysis.js - Herramientas de análisis de texto para escritores

// Palabras débiles comunes en español
const WEAK_WORDS = [
  'muy', 'bastante', 'algo', 'quizás', 'tal', 'vez', 'creo', 
  'parece', 'supongo', 'pienso', 'posible', 'puede', 'podría',
  'poco', 'medio', 'como', 'más', 'menos', 'prácticamente',
  'realmente', 'verdaderamente', 'ciertamente', 'posiblemente'
];

// Adverbios en -mente (pueden ser excesivos)
const MENTE_ADVERBS_REGEX = /\b\w+mente\b/gi;

// Muletillas y palabras de relleno
const FILLER_WORDS = [
  'bueno', 'entonces', 'pues', 'o sea', 'digamos', 'en realidad',
  'la verdad', 'realmente', 'obviamente', 'claramente', 'básicamente',
  'literalmente', 'totalmente', 'completamente'
];

/**
 * Análisis completo de texto para escritores
 * @param {string} text - Texto a analizar
 * @returns {object} Objeto con análisis completo
 */
export const analyzeText = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      issues: [],
      stats: {
        readabilityScore: 0,
        avgWordsPerSentence: 0,
        avgSentencesPerParagraph: 0,
        longParagraphs: 0,
        longSentences: 0,
        weakWords: 0,
        menteAdverbs: 0,
        fillerWords: 0
      }
    };
  }

  // Limpiar HTML si existe y normalizar saltos de línea
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Quitar HTML
    .replace(/&nbsp;/g, ' ') // Quitar &nbsp;
    .replace(/\r\n/g, '\n') // Normalizar Windows line breaks
    .replace(/\r/g, '\n') // Normalizar Mac line breaks
    .trim();
  
  if (!cleanText) {
    return {
      issues: [],
      stats: {
        readabilityScore: 0,
        avgWordsPerSentence: 0,
        avgSentencesPerParagraph: 0,
        longParagraphs: 0,
        longSentences: 0,
        weakWords: 0,
        menteAdverbs: 0,
        fillerWords: 0
      }
    };
  }

  const issues = [];
  
  // 1. Análisis de párrafos (detección inteligente)
  let paragraphs = [];
  
  // Método 1: Doble salto de línea
  paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Método 2: Salto simple si no hay dobles
  if (paragraphs.length === 1) {
    paragraphs = cleanText.split(/\n/).filter(p => p.trim().length > 0);
  }
  
  // Método 3: Detectar párrafos por puntos seguidos de mayúscula (heurística)
  if (paragraphs.length === 1 && cleanText.length > 200) {
    // Buscar patrones como ". [Mayúscula]" que indican nuevo párrafo
    const sentences = cleanText.split(/\.\s+(?=[A-ZÁÉÍÓÚÑ])/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 3) {
      // Agrupar oraciones en párrafos estimados (2-4 oraciones por párrafo)
      paragraphs = [];
      let currentParagraph = '';
      let sentenceCount = 0;
      
      sentences.forEach((sentence, index) => {
        currentParagraph += (index === sentences.length - 1 ? sentence : sentence + '. ');
        sentenceCount++;
        
        // Crear nuevo párrafo cada 2-4 oraciones O si la siguiente es muy diferente
        if (sentenceCount >= 2 && (sentenceCount >= 4 || index === sentences.length - 1)) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
          sentenceCount = 0;
        }
      });
    }
  }
  
  // Método 4: Si todo falla, dividir por longitud (cada ~100 palabras)
  if (paragraphs.length === 1 && cleanText.split(/\s+/).length > 100) {
    const words = cleanText.split(/\s+/);
    paragraphs = [];
    let currentChunk = [];
    
    words.forEach((word, index) => {
      currentChunk.push(word);
      
      // Cada 80-120 palabras, buscar un punto para cortar
      if (currentChunk.length >= 80) {
        const nextFewWords = words.slice(index + 1, index + 6).join(' ');
        if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?') || index === words.length - 1) {
          paragraphs.push(currentChunk.join(' '));
          currentChunk = [];
        } else if (currentChunk.length >= 120) {
          // Forzar corte si es muy largo
          paragraphs.push(currentChunk.join(' '));
          currentChunk = [];
        }
      }
    });
    
    if (currentChunk.length > 0) {
      paragraphs.push(currentChunk.join(' '));
    }
  }
  
  // Debug: mostrar párrafos detectados
  console.log('🔍 Párrafos detectados:', paragraphs.length);
  console.log('📝 Método usado:', paragraphs.length === 1 ? 'Sin división' : paragraphs.length <= 3 ? 'Heurística' : 'División automática');
  paragraphs.forEach((p, i) => {
    const wordCount = p.split(/\s+/).length;
    console.log(`Párrafo ${i + 1}: "${p.substring(0, 50)}..." (${wordCount} palabras)`);
  });
  const paragraphAnalysis = analyzeParagraphs(paragraphs, issues);
  
  // 2. Análisis de oraciones
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceAnalysis = analyzeSentences(sentences, issues);
  
  // 3. Análisis de palabras (incluyendo acentos y ñ)
  const words = cleanText.toLowerCase().match(/\b[\w\u00C0-\u017F]+\b/g) || [];
  const wordAnalysis = analyzeWords(words, cleanText, issues, paragraphs);
  
  // 4. Cálculo de legibilidad (Flesch adaptado para español)
  const readabilityScore = calculateReadabilityScore(words.length, sentences.length, cleanText);
  
  // 5. Estadísticas generales
  const stats = {
    readabilityScore: Math.round(readabilityScore),
    avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    avgSentencesPerParagraph: paragraphs.length > 0 ? Math.round(sentences.length / paragraphs.length) : 0,
    longParagraphs: paragraphAnalysis.longCount,
    longSentences: sentenceAnalysis.longCount,
    weakWords: wordAnalysis.weakCount,
    menteAdverbs: wordAnalysis.menteCount,
    fillerWords: wordAnalysis.fillerCount
  };

  return { issues, stats };
};

/**
 * Análisis de párrafos
 */
const analyzeParagraphs = (paragraphs, issues) => {
  let longCount = 0;
  
  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.match(/\b[\w\u00C0-\u017F]+\b/g) || [];
    const wordCount = words.length;
    
    // Mostrar preview del párrafo (primeras 12 palabras + ...)
    const preview = words.slice(0, 12).join(' ') + (wordCount > 12 ? '...' : '');
    
    // Párrafos muy largos (>150 palabras)
    if (wordCount > 150) {
      longCount++;
      issues.push({
        type: 'long_paragraph',
        severity: 'warning',
        message: `Párrafo ${index + 1} muy extenso (${wordCount} palabras): "${preview}"`,
        suggestion: 'Considera dividir en párrafos más pequeños para mejorar la legibilidad.',
        icon: '📝'
      });
    }
    
    // Párrafos extremadamente largos (>250 palabras)
    if (wordCount > 250) {
      issues.push({
        type: 'very_long_paragraph',
        severity: 'error',
        message: `Párrafo ${index + 1} extremadamente largo (${wordCount} palabras): "${preview}"`,
        suggestion: 'Este párrafo es difícil de leer. Divídelo en varios párrafos.',
        icon: '⚠️'
      });
    }
  });
  
  return { longCount };
};

/**
 * Análisis de oraciones
 */
const analyzeSentences = (sentences, issues) => {
  let longCount = 0;
  
  sentences.forEach((sentence, index) => {
    const cleanSentence = sentence.trim();
    const words = cleanSentence.match(/\b[\w\u00C0-\u017F]+\b/g) || [];
    const wordCount = words.length;
    
    // Mostrar preview de la oración (primeras 15 palabras + ...)
    const preview = words.slice(0, 15).join(' ') + (wordCount > 15 ? '...' : '');
    
    // Oraciones largas (>35 palabras) - umbral más alto
    if (wordCount > 35) {
      longCount++;
      issues.push({
        type: 'long_sentence',
        severity: 'info', // Cambiado de warning a info
        message: `Oración larga (${wordCount} palabras): "${preview}"`,
        suggestion: 'Si buscas claridad, considera dividir. Para efectos literarios puede estar bien.',
        icon: '📏'
      });
    }
    
    // Oraciones muy largas (>60 palabras) - umbral más alto
    if (wordCount > 60) {
      issues.push({
        type: 'very_long_sentence',
        severity: 'warning', // Cambiado de error a warning
        message: `Oración muy larga (${wordCount} palabras): "${preview}"`,
        suggestion: 'Oración compleja. Asegúrate de que la complejidad sirva tu propósito narrativo.',
        icon: '📏'
      });
    }
  });
  
  return { longCount };
};

/**
 * Análisis de palabras
 */
const analyzeWords = (words, originalText, issues, paragraphs) => {
  const wordFrequency = {};
  let weakCount = 0;
  let menteCount = 0;
  let fillerCount = 0;
  
  // Contar frecuencia de palabras
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Detectar palabras repetidas por proximidad (más inteligente)
  const detectProximityRepetitions = (paragraphsArray) => {
    // Usar los párrafos ya detectados correctamente
    
    paragraphsArray.forEach((paragraph, pIndex) => {
      const paragraphWords = paragraph.toLowerCase().match(/\b[\w\u00C0-\u017F]+\b/g) || [];
      const wordPositions = {};
      
      // Mapear posiciones de cada palabra en el párrafo
      paragraphWords.forEach((word, position) => {
        if (!wordPositions[word]) wordPositions[word] = [];
        wordPositions[word].push(position);
      });
      
      // Detectar repeticiones problemáticas en el mismo párrafo
      Object.entries(wordPositions).forEach(([word, positions]) => {
        // Ignorar palabras muy comunes
        const commonWords = ['que', 'con', 'para', 'por', 'una', 'del', 'las', 'los', 'esta', 'este', 'pero', 'como', 'más', 'todo', 'bien', 'año', 'dos', 'día', 'vez', 'ser', 'estar', 'hacer', 'tener', 'decir', 'muy', 'puede', 'debe'];
        
        if (word.length > 4 && !commonWords.includes(word)) {
          // Problema: 3+ veces en el mismo párrafo
          if (positions.length >= 3) {
            issues.push({
              type: 'repeated_word_proximity',
              severity: positions.length > 4 ? 'warning' : 'info',
              message: `"${word}" se repite ${positions.length} veces en el párrafo ${pIndex + 1}`,
              suggestion: 'Repetición muy cercana. Considera usar sinónimos o reestructurar.',
              icon: '🔄'
            });
          }
          // Problema menor: 2 veces muy cerca (menos de 10 palabras de distancia)
          else if (positions.length === 2) {
            const distance = positions[1] - positions[0];
            if (distance < 10) {
              issues.push({
                type: 'repeated_word_close',
                severity: 'info',
                message: `"${word}" se repite 2 veces muy cerca en párrafo ${pIndex + 1}`,
                suggestion: 'Repetición muy próxima. Considera variar.',
                icon: '🔄'
              });
            }
          }
        }
      });
    });
  };
  
  detectProximityRepetitions(paragraphs);
  
  // Detectar palabras débiles con inteligencia de contexto
  WEAK_WORDS.forEach(weakWord => {
    const count = wordFrequency[weakWord] || 0;
    if (count > 0) {
      weakCount += count;
      
      // Solo alertar si:
      // - Se usa 3+ veces en total, O
      // - Se usa 2+ veces en párrafos cortos (menos de 4 párrafos totales)
      const shouldAlert = count >= 3 || (count >= 2 && paragraphs.length <= 3);
      
      if (shouldAlert) {
        issues.push({
          type: 'weak_word',
          severity: count > 5 ? 'warning' : 'info',
          message: `"${weakWord}" usado ${count} veces`,
          suggestion: count > 5 
            ? 'Esta palabra se repite demasiado. Usa sinónimos más específicos.'
            : 'Considera alternativas más específicas y contundentes.',
          icon: '💡'
        });
      }
    }
  });
  
  // Detectar adverbios en -mente excesivos
  const menteMatches = originalText.match(MENTE_ADVERBS_REGEX) || [];
  menteCount = menteMatches.length;
  if (menteCount > 8) {
    issues.push({
      type: 'excessive_adverbs',
      severity: 'warning',
      message: `${menteCount} adverbios terminados en "-mente"`,
      suggestion: 'Demasiados adverbios pueden debilitar la narrativa. Usa verbos más descriptivos.',
      icon: '⚡'
    });
  }
  
  // Detectar muletillas (solo mostrar si se usan 2+ veces)
  FILLER_WORDS.forEach(fillerWord => {
    const count = wordFrequency[fillerWord] || 0;
    if (count > 0) {
      fillerCount += count;
      // Solo mostrar si se usa 2+ veces (no molestar por 1 uso)
      if (count >= 2) {
        issues.push({
          type: 'filler_word',
          severity: count > 3 ? 'warning' : 'info',
          message: `Muletilla "${fillerWord}" usada ${count} veces`,
          suggestion: count > 3 
            ? 'Esta muletilla se repite demasiado y afecta la fluidez.'
            : 'Las muletillas pueden hacer el texto menos fluido.',
          icon: '🎯'
        });
      }
    }
  });
  
  return { weakCount, menteCount, fillerCount };
};

/**
 * Cálculo de legibilidad adaptado para español
 * Basado en el índice Flesch adaptado
 */
const calculateReadabilityScore = (wordCount, sentenceCount, text) => {
  if (wordCount === 0 || sentenceCount === 0) return 0;
  
  // Contar sílabas aproximadamente (método simplificado para español)
  const syllableCount = estimateSyllables(text);
  
  // Fórmula de Flesch adaptada para español
  // Puntuación más alta = más fácil de leer
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  const score = 206.84 - (1.02 * avgSentenceLength) - (60 * avgSyllablesPerWord);
  
  // Ajustar para rango 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Estimación de sílabas para español
 */
const estimateSyllables = (text) => {
  const words = text.toLowerCase().match(/\b[\w\u00C0-\u017F]+\b/g) || [];
  let syllableCount = 0;
  
  words.forEach(word => {
    // Contar vocales como aproximación de sílabas (incluyendo acentuadas)
    const vowels = word.match(/[aeiouáéíóúüàèìòù]/g) || [];
    let wordSyllables = vowels.length;
    
    // Ajustes para diptongos y hiatos comunes
    const diphthongs = word.match(/[aeiou][iu]|[iu][aeiou]/g) || [];
    wordSyllables -= diphthongs.length * 0.5;
    
    // Mínimo una sílaba por palabra
    syllableCount += Math.max(1, Math.round(wordSyllables));
  });
  
  return syllableCount;
};

/**
 * Obtener interpretación de la puntuación de legibilidad
 */
export const getReadabilityInterpretation = (score) => {
  if (score >= 90) return { level: 'Muy fácil', color: 'text-green-600', description: 'Perfecto para todo público' };
  if (score >= 80) return { level: 'Fácil', color: 'text-green-500', description: 'Lectura fluida y accesible' };
  if (score >= 70) return { level: 'Moderado', color: 'text-yellow-500', description: 'Requiere atención moderada' };
  if (score >= 60) return { level: 'Algo difícil', color: 'text-orange-500', description: 'Para lectores experimentados' };
  if (score >= 50) return { level: 'Difícil', color: 'text-red-500', description: 'Requiere concentración' };
  return { level: 'Muy difícil', color: 'text-red-600', description: 'Solo para expertos' };
};

export default analyzeText;