// hooks/useModeración.js - Hook para manejar moderación
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { analizarContenido, analizarHistoriasExistentes, getEstadisticasModeración } from '../utils/moderacion';
import { logger } from '../utils/logger';

export function useModeración() {
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  /**
   * Analiza una historia individual y guarda los resultados
   * @param {Object} historia - Historia a analizar
   * @param {boolean} saveToDatabase - Si guardar en BD (false para testing)
   */
  const analizarHistoria = useCallback(async (historia, saveToDatabase = false) => {
    try {
      setLoading(true);

      // Realizar análisis
      const analisis = analizarContenido({
        title: historia.title,
        content: historia.content,
        is_mature: historia.is_mature
      });

      // Si es solo para testing, retornar resultado sin guardar
      if (!saveToDatabase) {
        return {
          success: true,
          historia,
          analisis
        };
      }

      // Guardar en base de datos
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          moderation_score: analisis.score,
          moderation_flags: analisis.flags,
          moderation_status: analisis.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', historia.id);

      if (updateError) throw updateError;

      // Crear log de moderación
      const { error: logError } = await supabase
        .from('moderation_logs')
        .insert({
          story_id: historia.id,
          action: 'auto_analyzed',
          previous_status: 'pending',
          new_status: analisis.status,
          reason: analisis.reason,
          details: {
            score: analisis.score,
            flags: analisis.flags,
            detalles: analisis.detalles,
            autoAction: analisis.autoAction
          }
        });

      if (logError) {
        logger.warn('Error guardando log de moderación:', logError);
        // No fallar por error de log
      }

      return {
        success: true,
        historia,
        analisis
      };

    } catch (error) {
      logger.error('Error analizando historia:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Analiza todas las historias de un concurso
   */
  const analizarHistoriasConcurso = useCallback(async (contestId, saveToDatabase = false) => {
    try {
      setLoading(true);

      // Obtener historias del concurso
      const { data: historias, error } = await supabase
        .from('stories')
        .select('*')
        .eq('contest_id', contestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener autores por separado para evitar problemas de foreign key
      if (historias && historias.length > 0) {
        const userIds = [...new Set(historias.map(h => h.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('user_profiles')
            .select('id, display_name, avatar_url, email')
            .in('id', userIds);

          // Combinar datos manualmente
          historias.forEach(historia => {
            const usuario = users?.find(u => u.id === historia.user_id);
            historia.user_profiles = usuario || null;
          });
        }
      }

      if (!historias || historias.length === 0) {
        return {
          success: true,
          historias: [],
          resultados: [],
          estadisticas: getEstadisticasModeración([])
        };
      }

      // Analizar cada historia (sin usar analizarHistoria para evitar conflictos de loading)
      const resultados = [];
      for (const historia of historias) {
        try {
          // Realizar análisis directamente
          const analisis = analizarContenido({
            title: historia.title,
            content: historia.content,
            is_mature: historia.is_mature
          });

          // Si es para guardar en BD, hacerlo
          if (saveToDatabase) {
            const { error: updateError } = await supabase
              .from('stories')
              .update({
                moderation_score: analisis.score,
                moderation_flags: analisis.flags,
                moderation_status: analisis.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', historia.id);

            if (!updateError) {
              // Crear log de moderación
              await supabase
                .from('moderation_logs')
                .insert({
                  story_id: historia.id,
                  action: 'auto_analyzed',
                  previous_status: 'pending',
                  new_status: analisis.status,
                  reason: analisis.reason,
                  details: {
                    score: analisis.score,
                    flags: analisis.flags,
                    detalles: analisis.detalles,
                    autoAction: analisis.autoAction
                  }
                });
            }
          }

          resultados.push({
            success: true,
            historia,
            analisis
          });

        } catch (error) {
          console.error(`Error analizando historia ${historia.id}:`, error);
          resultados.push({
            success: false,
            historia,
            error: error.message
          });
        }
        
        // Pequeña pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calcular estadísticas
      const historiasConAnalisis = resultados.map(r => ({
        ...r.historia,
        moderation_score: r.analisis?.score || 0,
        moderation_status: r.analisis?.status || 'pending',
        moderation_flags: r.analisis?.flags || []
      }));

      const stats = getEstadisticasModeración(historiasConAnalisis);
      setEstadisticas(stats);

      return {
        success: true,
        historias,
        resultados,
        estadisticas: stats
      };

    } catch (error) {
      logger.error('Error analizando historias de concurso:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [analizarHistoria]);

  /**
   * Obtiene historias que requieren revisión manual
   */
  const obtenerHistoriasParaRevisión = useCallback(async (contestId = null) => {
    try {
      setLoading(true);

      let query = supabase
        .from('stories')
        .select(`
          *,
          user_profiles!stories_user_id_fkey(display_name, avatar_url),
          contests!stories_contest_id_fkey(title, month, year)
        `)
        .in('moderation_status', ['flagged', 'under_review'])
        .order('created_at', { ascending: false });

      if (contestId) {
        query = query.eq('contest_id', contestId);
      }

      const { data: historias, error } = await query;

      if (error) throw error;

      return {
        success: true,
        historias: historias || []
      };

    } catch (error) {
      logger.error('Error obteniendo historias para revisión:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualiza el estado de moderación de una historia (acción manual del admin)
   */
  const actualizarEstadoModeración = useCallback(async (storyId, nuevoEstado, adminUserId, notas = null) => {
    try {
      setLoading(true);

      // Obtener estado actual
      const { data: historia, error: fetchError } = await supabase
        .from('stories')
        .select('moderation_status')
        .eq('id', storyId)
        .single();

      if (fetchError) throw fetchError;

      const estadoAnterior = historia.moderation_status;

      // Actualizar estado
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          moderation_status: nuevoEstado,
          moderation_reviewed_at: new Date().toISOString(),
          moderation_reviewed_by: adminUserId,
          moderation_notes: notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Crear log de acción manual
      const { error: logError } = await supabase
        .from('moderation_logs')
        .insert({
          story_id: storyId,
          action: 'manual_review',
          previous_status: estadoAnterior,
          new_status: nuevoEstado,
          admin_user_id: adminUserId,
          reason: `Revisión manual del admin`,
          details: {
            notas,
            timestamp: new Date().toISOString()
          }
        });

      if (logError) {
        logger.warn('Error guardando log de acción manual:', logError);
      }

      return {
        success: true,
        message: `Historia ${nuevoEstado === 'approved' ? 'aprobada' : 
                   nuevoEstado === 'rejected' ? 'rechazada' : 'actualizada'} correctamente`
      };

    } catch (error) {
      logger.error('Error actualizando estado de moderación:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene estadísticas de moderación para un concurso
   */
  const obtenerEstadisticasConcurso = useCallback(async (contestId) => {
    try {
      const { data: historias, error } = await supabase
        .from('stories')
        .select('moderation_score, moderation_status, is_mature')
        .eq('contest_id', contestId);

      if (error) throw error;

      const stats = getEstadisticasModeración(historias || []);
      setEstadisticas(stats);

      return {
        success: true,
        estadisticas: stats
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  return {
    loading,
    estadisticas,
    analizarHistoria,
    analizarHistoriasConcurso,
    obtenerHistoriasParaRevisión,
    actualizarEstadoModeración,
    obtenerEstadisticasConcurso
  };
}