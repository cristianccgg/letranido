// utils/test-moderacion.js - Script para probar el sistema de moderación
import { supabase } from '../lib/supabase';
import { analizarContenido, analizarHistoriasExistentes, getEstadisticasModeración } from './moderacion';

/**
 * Prueba el sistema de moderación con historias existentes
 * NO modifica la base de datos - solo análisis
 */
export async function probarSistemaModeración(contestId = null) {
  console.log('🧪 Iniciando prueba del sistema de moderación...');
  
  try {
    // 1. Obtener historias del concurso actual o todas
    let query = supabase
      .from('stories')
      .select(`
        id,
        title,
        content,
        word_count,
        is_mature,
        user_id,
        contest_id,
        created_at,
        user_profiles!stories_user_id_fkey(display_name),
        contests!stories_contest_id_fkey(title, month, year)
      `)
      .order('created_at', { ascending: false });

    if (contestId) {
      query = query.eq('contest_id', contestId);
    }

    const { data: historias, error } = await query;

    if (error) {
      throw error;
    }

    if (!historias || historias.length === 0) {
      console.log('❌ No se encontraron historias para analizar');
      return {
        success: false,
        message: 'No hay historias disponibles'
      };
    }

    console.log(`📚 Analizando ${historias.length} historias...`);

    // 2. Analizar cada historia
    const resultados = [];
    const estadisticasCategoria = {
      sinProblemas: 0,
      conObservaciones: 0,
      requierenRevisión: 0,
      marcadas18: 0,
      contenidoProhibido: 0
    };

    for (const historia of historias) {
      const analisis = analizarContenido({
        title: historia.title,
        content: historia.content,
        is_mature: historia.is_mature
      });

      const resultado = {
        ...historia,
        analisisModeración: analisis
      };

      resultados.push(resultado);

      // Categorizar
      if (analisis.score >= 80 || analisis.flags.includes('contenido_prohibido')) {
        estadisticasCategoria.contenidoProhibido++;
      } else if (analisis.score >= 50 || analisis.requiresManualReview) {
        estadisticasCategoria.requierenRevisión++;
      } else if (analisis.score >= 20) {
        estadisticasCategoria.conObservaciones++;
      } else {
        estadisticasCategoria.sinProblemas++;
      }

      if (historia.is_mature) {
        estadisticasCategoria.marcadas18++;
      }
    }

    // 3. Generar reportes
    const estadisticasGenerales = getEstadisticasModeración(
      resultados.map(r => ({
        ...r,
        moderation_score: r.analisisModeración.score,
        moderation_status: r.analisisModeración.status
      }))
    );

    console.log('\n📊 RESULTADOS DEL ANÁLISIS:');
    console.log('================================');
    console.log(`📚 Total de historias: ${historias.length}`);
    console.log(`🟢 Sin problemas: ${estadisticasCategoria.sinProblemas}`);
    console.log(`🟡 Con observaciones: ${estadisticasCategoria.conObservaciones}`);
    console.log(`🔴 Requieren revisión: ${estadisticasCategoria.requierenRevisión}`);
    console.log(`🟣 Marcadas +18: ${estadisticasCategoria.marcadas18}`);
    console.log(`⛔ Contenido prohibido: ${estadisticasCategoria.contenidoProhibido}`);
    console.log(`📈 Score promedio: ${estadisticasGenerales.scorePromedio}`);

    // 4. Mostrar casos que requieren atención
    const casosProblematicos = resultados.filter(r => 
      r.analisisModeración.score >= 50 || 
      r.analisisModeración.requiresManualReview ||
      r.is_mature
    );

    if (casosProblematicos.length > 0) {
      console.log('\n🚨 CASOS QUE REQUIEREN ATENCIÓN:');
      console.log('================================');
      
      casosProblematicos.forEach((caso, index) => {
        const analisis = caso.analisisModeración;
        console.log(`\n${index + 1}. "${caso.title}"`);
        console.log(`   📊 Score: ${analisis.score}`);
        console.log(`   🏷️ Flags: ${analisis.flags.join(', ')}`);
        console.log(`   👤 Autor: ${caso.user_profiles?.display_name || 'Anónimo'}`);
        console.log(`   🔞 Marcado +18: ${caso.is_mature ? 'Sí' : 'No'}`);
        console.log(`   📝 Estado: ${analisis.status}`);
        
        if (analisis.detalles && analisis.detalles.length > 0) {
          console.log(`   ℹ️ Detalles: ${analisis.detalles.join('; ')}`);
        }
      });
    }

    // 5. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('====================');
    
    if (estadisticasCategoria.contenidoProhibido > 0) {
      console.log(`⚠️ ${estadisticasCategoria.contenidoProhibido} historias contienen contenido potencialmente prohibido`);
    }
    
    if (estadisticasCategoria.requierenRevisión > 0) {
      console.log(`👀 ${estadisticasCategoria.requierenRevisión} historias requieren revisión manual`);
    }
    
    if (estadisticasCategoria.marcadas18 > 0) {
      console.log(`🔞 ${estadisticasCategoria.marcadas18} historias están marcadas como +18 - revisar todas`);
    }

    const porcentajeProblematico = ((estadisticasCategoria.requierenRevisión + estadisticasCategoria.contenidoProhibido) / historias.length * 100).toFixed(1);
    console.log(`📈 ${porcentajeProblematico}% de las historias requieren atención`);

    return {
      success: true,
      totalHistorias: historias.length,
      resultados,
      estadisticas: estadisticasGenerales,
      categorizacion: estadisticasCategoria,
      casosProblematicos,
      porcentajeProblematico: parseFloat(porcentajeProblematico)
    };

  } catch (error) {
    console.error('❌ Error en prueba de moderación:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Simula qué habría pasado si el sistema estuviera activo
 */
export function simularModeraciónActiva(resultados) {
  console.log('\n🔮 SIMULACIÓN - Si el sistema estuviera activo:');
  console.log('===============================================');

  let aprobadas = 0;
  let flaggeadas = 0;
  let rechazadas = 0;
  let notificacionesAdmin = 0;

  resultados.forEach(resultado => {
    const analisis = resultado.analisisModeración;
    
    if (analisis.autoAction === 'approve') {
      aprobadas++;
    } else if (analisis.autoAction === 'approve_and_notify') {
      aprobadas++;
      notificacionesAdmin++;
    } else if (analisis.autoAction === 'flag_for_review') {
      flaggeadas++;
    } else if (analisis.autoAction === 'reject') {
      rechazadas++;
    }
  });

  console.log(`✅ Aprobadas automáticamente: ${aprobadas}`);
  console.log(`⚠️ Flaggeadas para revisión: ${flaggeadas}`);
  console.log(`❌ Rechazadas automáticamente: ${rechazadas}`);
  console.log(`📧 Notificaciones al admin: ${notificacionesAdmin}`);
  
  const eficiencia = ((aprobadas + rechazadas) / resultados.length * 100).toFixed(1);
  console.log(`🎯 Eficiencia automática: ${eficiencia}%`);

  return {
    aprobadas,
    flaggeadas,
    rechazadas,
    notificacionesAdmin,
    eficiencia: parseFloat(eficiencia)
  };
}

/**
 * Función para usar desde la consola del navegador
 */
window.probarModeración = probarSistemaModeración;
window.simularModeración = simularModeraciónActiva;