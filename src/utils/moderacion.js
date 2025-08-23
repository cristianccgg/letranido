// utils/moderacion.js - Sistema de Moderación Automática

// ✅ PATRONES REALMENTE PROBLEMÁTICOS
const CONTENIDO_PROHIBIDO = [
  // Abuso de menores (combinaciones específicas)
  { pattern: /(?:sexo|sexual|desnud|erótic|penetr|masturb).{0,50}(?:niño|niña|menor|bebé|infantil)/i, reason: 'Contenido sexual con menores' },
  { pattern: /(?:niño|niña|menor|bebé|infantil).{0,50}(?:sexo|sexual|desnud|erótic|penetr|masturb)/i, reason: 'Contenido sexual con menores' },
  
  // Zoofilia específica
  { pattern: /(?:sexo|sexual|penetr|masturb).{0,30}(?:animal|perro|gato|caballo)/i, reason: 'Zoofilia/bestialismo' },
  { pattern: /(?:animal|perro|gato|caballo).{0,30}(?:sexo|sexual|penetr|masturb)/i, reason: 'Zoofilia/bestialismo' },
  
  // Información personal específica
  { pattern: /(?:mi|su|tu).{0,20}(?:dirección|teléfono|celular|email).{0,20}(?:es|:|son)/i, reason: 'Información personal específica' },
  { pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/, reason: 'Número de teléfono' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, reason: 'Dirección de email' },
  
  // Odio extremo
  { pattern: /(?:matar|eliminar|exterminar).{0,30}(?:judíos|negros|gays|musulmanes)/i, reason: 'Incitación al odio' },
  { pattern: /(?:hitler|nazi).{0,50}(?:tenía razón|era bueno)/i, reason: 'Apología del nazismo' }
];

// ✅ CONTENIDO SEXUAL EXPLÍCITO (+18) - usando patrones para evitar falsos positivos
const CONTENIDO_SEXUAL = [
  // Términos explícitos (con word boundaries)
  { pattern: /\bsexo\b/i, word: 'sexo' },
  { pattern: /\bcoito\b/i, word: 'coito' },
  { pattern: /\borgasmo\b/i, word: 'orgasmo' },
  { pattern: /\bmasturbación\b/i, word: 'masturbación' },
  { pattern: /\bpenetración\b/i, word: 'penetración' }, // "penetrante" no coincidirá
  { pattern: /\bpene\b/i, word: 'pene' }, // "penetrante" no coincidirá
  { pattern: /\bvagina\b/i, word: 'vagina' },
  { pattern: /\bclítoris\b/i, word: 'clítoris' },
  { pattern: /\bsemen\b/i, word: 'semen' },
  { pattern: /\blubricación\b/i, word: 'lubricación' },
  { pattern: /\beyaculación\b/i, word: 'eyaculación' },
  { pattern: /\berección\b/i, word: 'erección' },
  { pattern: /\bgenitales\b/i, word: 'genitales' },
  
  // Actos sexuales
  { pattern: /\bfollar\b/i, word: 'follar' },
  { pattern: /\bjoder\b/i, word: 'joder' }, // Cuidado: también es expresión
  { pattern: /\bcorrerse\b/i, word: 'correrse' },
  { pattern: /\bvenirse\b/i, word: 'venirse' },
  { pattern: /\bmamada\b/i, word: 'mamada' },
  { pattern: /\bfelación\b/i, word: 'felación' },
  { pattern: /\bcunnilingus\b/i, word: 'cunnilingus' },
  
  // Desnudez explícita
  { pattern: /desnudo completo/i, word: 'desnudo completo' },
  { pattern: /sin ropa/i, word: 'sin ropa' },
  { pattern: /completamente desnud/i, word: 'completamente desnudo' }
];

// ✅ VIOLENCIA GRÁFICA EXTREMA
const VIOLENCIA_EXTREMA = [
  // Violencia detallada
  { pattern: /\bdescuartizar\b/i, word: 'descuartizar' },
  { pattern: /\bmutilar\b/i, word: 'mutilar' },
  { pattern: /\btorturar\b/i, word: 'torturar' },
  { pattern: /\bdesollar\b/i, word: 'desollar' },
  { pattern: /sangre a borbotones/i, word: 'sangre a borbotones' },
  { pattern: /\bvísceras\b/i, word: 'vísceras' },
  { pattern: /\btripas\b/i, word: 'tripas' },
  { pattern: /arrancar los ojos/i, word: 'arrancar los ojos' },
  { pattern: /cortar dedos/i, word: 'cortar dedos' },
  
  // Métodos específicos
  { pattern: /\belectroshock\b/i, word: 'electroshock' },
  { pattern: /hierro candente/i, word: 'hierro candente' },
  { pattern: /ácido en la cara/i, word: 'ácido en la cara' }
];

// ✅ LENGUAJE FUERTE (no prohibido, solo +18)
const LENGUAJE_FUERTE = [
  { pattern: /\bmierda\b/i, word: 'mierda' },
  { pattern: /\bcoño\b/i, word: 'coño' },
  { pattern: /\bputa\b/i, word: 'puta' },
  { pattern: /\bputo\b/i, word: 'puto' },
  { pattern: /\bputos\b/i, word: 'putos' },
  { pattern: /\bpinche\b/i, word: 'pinche' },
  { pattern: /\bcabrón\b/i, word: 'cabrón' },
  { pattern: /\bjoder\b/i, word: 'joder' },
  { pattern: /\bmaldito\b/i, word: 'maldito' },
  { pattern: /\bmalditos\b/i, word: 'malditos' },
  { pattern: /\bmaldita\b/i, word: 'maldita' },
  { pattern: /\bimbéciles\b/i, word: 'imbéciles' },
  { pattern: /hijo de puta/i, word: 'hijo de puta' },
  { pattern: /\bgilipollas\b/i, word: 'gilipollas' },
  { pattern: /\bimbécil\b/i, word: 'imbécil' }
];

// ✅ TEMAS SENSIBLES (zona gris)
const TEMAS_SENSIBLES = [
  // Salud mental (solo si es muy explícito)
  { pattern: /(?:quiero|voy a|planear|decidir).{0,30}(?:suicidarme|matarme|quitarme la vida)/i, reason: 'Ideación suicida explícita' },
  { pattern: /(?:pastillas|veneno|cuerda|pistola).{0,50}(?:para matarme|para suicidarme)/i, reason: 'Método suicida específico' },
  
  // Drogas específicas (no alcohol o medicinas)
  { pattern: /(?:cocaína|heroína|metanfetamina|crack|éxtasis|lsd)/i, reason: 'Drogas ilegales específicas' },
  
  // Violencia doméstica explícita
  { pattern: /(?:golpear|pegar|maltratar).{0,30}(?:a mi|a su|a la).{0,20}(?:mujer|esposa|novia)/i, reason: 'Violencia doméstica' }
];

/**
 * Analiza el contenido de una historia para detectar posibles problemas de moderación
 * @param {Object} storyData - Datos de la historia
 * @param {string} storyData.title - Título de la historia
 * @param {string} storyData.content - Contenido de la historia
 * @param {boolean} storyData.is_mature - Si el usuario marcó como +18
 * @returns {Object} Resultado del análisis
 */
export function analizarContenido(storyData) {
  const { title, content, is_mature = false } = storyData;
  const textoCompleto = `${title} ${content}`;
  
  let score = 0;
  const flags = [];
  const detalles = [];

  try {
    // ✅ 1. DETECTAR CONTENIDO REALMENTE PROHIBIDO (patrones contextuales)
    for (const item of CONTENIDO_PROHIBIDO) {
      if (item.pattern.test(textoCompleto)) {
        score = 100; // Score máximo = rechazar inmediatamente
        flags.push('contenido_prohibido');
        detalles.push(`${item.reason}`);
        
        return {
          score,
          flags,
          status: 'rejected',
          reason: 'Contenido prohibido detectado',
          detalles,
          requiresManualReview: true,
          autoAction: 'reject'
        };
      }
    }

    // ✅ 2. DETECTAR CONTENIDO SEXUAL EXPLÍCITO
    const contenidoSexualDetectado = CONTENIDO_SEXUAL.filter(item => 
      item.pattern.test(textoCompleto)
    );

    if (contenidoSexualDetectado.length > 0) {
      if (!is_mature) {
        score += 70; // Penalización fuerte por no marcar +18
        flags.push('contenido_sexual_sin_marcar');
        detalles.push(`Contenido sexual explícito sin marcar +18: ${contenidoSexualDetectado.slice(0, 2).map(item => item.word).join(', ')}`);
      } else {
        score += 10; // Leve, está correctamente marcado
        flags.push('contenido_sexual_marcado');
        detalles.push('Contenido sexual explícito correctamente marcado como +18');
      }
    }

    // ✅ 3. DETECTAR VIOLENCIA EXTREMA
    const violenciaExtremaDetectada = VIOLENCIA_EXTREMA.filter(item => 
      item.pattern.test(textoCompleto)
    );

    if (violenciaExtremaDetectada.length > 0) {
      score += 60;
      flags.push('violencia_extrema');
      detalles.push(`Violencia gráfica extrema: ${violenciaExtremaDetectada.slice(0, 2).map(item => item.word).join(', ')}`);
    }

    // ✅ 4. DETECTAR LENGUAJE FUERTE
    const lenguajeFuerteDetectado = LENGUAJE_FUERTE.filter(item => 
      item.pattern.test(textoCompleto)
    );

    if (lenguajeFuerteDetectado.length > 0) {
      if (!is_mature) {
        score += 40; // Debería estar marcado como +18
        flags.push('lenguaje_fuerte_sin_marcar');
        detalles.push(`Lenguaje fuerte sin marcar +18: ${lenguajeFuerteDetectado.slice(0, 3).map(item => item.word).join(', ')}${lenguajeFuerteDetectado.length > 3 ? ` (+${lenguajeFuerteDetectado.length - 3} más)` : ''}`);
      } else {
        score += 5; // Muy leve, está bien marcado
        flags.push('lenguaje_fuerte_marcado');
        detalles.push(`Lenguaje fuerte correctamente marcado como +18: ${lenguajeFuerteDetectado.slice(0, 3).map(item => item.word).join(', ')}${lenguajeFuerteDetectado.length > 3 ? ` (+${lenguajeFuerteDetectado.length - 3} más)` : ''}`);
      }
    }

    // ✅ 5. DETECTAR TEMAS SENSIBLES (zona gris)
    for (const item of TEMAS_SENSIBLES) {
      if (item.pattern.test(textoCompleto)) {
        score += 45;
        flags.push('tema_sensible');
        detalles.push(`Tema sensible: ${item.reason}`);
      }
    }

    // ✅ 6. ANÁLISIS CONTEXTUAL ADICIONAL
    
    // Historias muy cortas con contenido problemático
    if (content.length < 300 && score > 30) {
      score += 20;
      flags.push('historia_corta_problematica');
      detalles.push('Historia muy corta con contenido sensible');
    }

    // Repetición excesiva de contenido sexual/violento
    const palabrasProblematicas = [...CONTENIDO_SEXUAL, ...VIOLENCIA_EXTREMA, ...LENGUAJE_FUERTE];
    let totalProblematicas = 0;
    palabrasProblematicas.forEach(item => {
      const matches = textoCompleto.match(item.pattern);
      if (matches) totalProblematicas += matches.length;
    });

    if (totalProblematicas > 10) {
      score += 30;
      flags.push('exceso_contenido_problematico');
      detalles.push(`Exceso de contenido problemático: ${totalProblematicas} ocurrencias`);
    }

    // ✅ 7. DETERMINAR ACCIÓN FINAL
    let status = 'approved';
    let requiresManualReview = false;
    let autoAction = 'approve';

    if (score >= 80) {
      status = 'flagged';
      requiresManualReview = true;
      autoAction = 'flag_for_review';
    } else if (score >= 50) {
      status = 'approved';
      requiresManualReview = false;
      autoAction = 'approve_and_notify';
    }

    // ✅ 8. CASOS ESPECIALES
    
    // Siempre revisar historias marcadas como +18 (pero sin penalización)
    if (is_mature) {
      requiresManualReview = true;
      flags.push('marcado_como_adulto');
      detalles.push('Historia marcada como +18 - revisión de rutina');
    }

    return {
      score,
      flags,
      status,
      reason: getReasonByScore(score),
      detalles,
      requiresManualReview,
      autoAction,
      analysisDate: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en análisis de moderación:', error);
    
    // En caso de error, marcar para revisión manual
    return {
      score: 50, // Reducido de 75
      flags: ['error_analisis'],
      status: 'flagged',
      reason: 'Error en análisis automático',
      detalles: ['Error técnico - requiere revisión manual'],
      requiresManualReview: true,
      autoAction: 'flag_for_review',
      error: error.message
    };
  }
}

/**
 * Obtiene la razón basada en el score
 */
function getReasonByScore(score) {
  if (score >= 80) return 'Contenido requiere revisión manual';
  if (score >= 50) return 'Contenido aprobado con observaciones';
  if (score >= 20) return 'Contenido aprobado con observaciones menores';
  return 'Contenido aprobado sin problemas';
}

/**
 * Analiza específicamente si una historia necesita marcarse como +18
 */
export function necesitaMarcajeAdulto(storyData) {
  const { title, content } = storyData;
  const textoCompleto = `${title} ${content}`;
  
  const contenidoSexual = CONTENIDO_SEXUAL.filter(item => 
    item.pattern.test(textoCompleto)
  );
  
  const lenguajeFuerte = LENGUAJE_FUERTE.filter(item => 
    item.pattern.test(textoCompleto)
  );
  
  const violenciaExtrema = VIOLENCIA_EXTREMA.filter(item => 
    item.pattern.test(textoCompleto)
  );
  
  const necesita = contenidoSexual.length > 0 || lenguajeFuerte.length > 2 || violenciaExtrema.length > 0;
  
  let razon = null;
  if (contenidoSexual.length > 0) razon = `Contenido sexual: ${contenidoSexual.slice(0, 2).map(item => item.word).join(', ')}`;
  else if (violenciaExtrema.length > 0) razon = `Violencia extrema: ${violenciaExtrema.slice(0, 2).map(item => item.word).join(', ')}`;
  else if (lenguajeFuerte.length > 2) razon = `Lenguaje fuerte repetitivo: ${lenguajeFuerte.length} palabras`;
  
  return {
    necesita,
    razon
  };
}

/**
 * Estadísticas del análisis para dashboard admin
 */
export function getEstadisticasModeración(historias) {
  const stats = {
    total: historias.length,
    aprobadas: 0,
    flaggeadas: 0,
    rechazadas: 0,
    pendientes: 0,
    marcadas18: 0,
    scorePromedio: 0
  };

  let scoreTotal = 0;

  historias.forEach(historia => {
    scoreTotal += historia.moderation_score || 0;
    
    if (historia.is_mature) stats.marcadas18++;
    
    switch (historia.moderation_status) {
      case 'approved':
        stats.aprobadas++;
        break;
      case 'flagged':
      case 'under_review':
        stats.flaggeadas++;
        break;
      case 'rejected':
        stats.rechazadas++;
        break;
      default:
        stats.pendientes++;
    }
  });

  stats.scorePromedio = stats.total > 0 ? Math.round(scoreTotal / stats.total) : 0;

  return stats;
}

/**
 * Función para pruebas - analizar historias existentes
 */
export function analizarHistoriasExistentes(historias) {
  return historias.map(historia => {
    const analisis = analizarContenido({
      title: historia.title,
      content: historia.content,
      is_mature: historia.is_mature
    });
    
    return {
      ...historia,
      analisisModeración: analisis
    };
  });
}