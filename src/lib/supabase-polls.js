// src/lib/supabase-polls.js
import { supabase } from './supabase.js';

/**
 * Obtiene la encuesta activa para el siguiente mes
 * @returns {Object|null} Encuesta activa con sus opciones o null si no hay ninguna
 */
export const getActivePoll = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_active_poll_for_next_month');

    if (error) {
      console.error('Error obteniendo encuesta activa:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error en getActivePoll:', error);
    return null;
  }
};

/**
 * Función que obtiene poll activo con conteos reales (sin restricciones RLS)
 */
export const getActivePollWithRealCounts = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_active_poll_with_real_counts');

    if (error) {
      console.error('Error obteniendo poll con conteos reales:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getActivePollWithRealCounts:', error);
    return null;
  }
};


/**
 * Obtiene una encuesta específica por ID con sus opciones
 * @param {string} pollId - ID de la encuesta
 * @returns {Object|null} Encuesta con opciones o null
 */
export const getPollById = async (pollId) => {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      console.error('Error obteniendo encuesta:', pollError);
      return null;
    }

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('display_order');

    if (optionsError) {
      console.error('Error obteniendo opciones:', optionsError);
      return { ...poll, options: [] };
    }

    return { ...poll, options };
  } catch (error) {
    console.error('Error en getPollById:', error);
    return null;
  }
};

/**
 * Obtiene el voto actual del usuario para una encuesta específica
 * @param {string} pollId - ID de la encuesta
 * @param {string} userId - ID del usuario
 * @returns {Object|null} Voto del usuario o null
 */
export const getUserVoteForPoll = async (pollId, userId) => {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id, created_at, updated_at')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error obteniendo voto del usuario:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getUserVoteForPoll:', error);
    return null;
  }
};

/**
 * Envía un voto para una encuesta
 * @param {string} pollId - ID de la encuesta
 * @param {string} optionId - ID de la opción elegida
 * @param {string} userId - ID del usuario
 * @returns {Object} Resultado del voto
 */
export const submitPollVote = async (pollId, optionId, userId) => {
  try {
    // Verificar si el usuario ya votó
    const existingVote = await getUserVoteForPoll(pollId, userId);

    if (existingVote) {
      // Actualizar voto existente
      const { data, error } = await supabase
        .from('poll_votes')
        .update({ 
          option_id: optionId,
          updated_at: new Date().toISOString()
        })
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error actualizando voto:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data, action: 'updated' };
    } else {
      // Crear nuevo voto
      const { data, error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: userId
        })
        .select();

      if (error) {
        console.error('Error creando voto:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data, action: 'created' };
    }
  } catch (error) {
    console.error('Error en submitPollVote:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Elimina el voto del usuario para una encuesta
 * @param {string} pollId - ID de la encuesta
 * @param {string} userId - ID del usuario
 * @returns {Object} Resultado de la eliminación
 */
export const removePollVote = async (pollId, userId) => {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error eliminando voto:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en removePollVote:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// FUNCIONES DE ADMINISTRACIÓN
// ===================================

/**
 * Crea una nueva encuesta (solo para admins)
 * @param {Object} pollData - Datos de la encuesta
 * @returns {Object} Resultado de la creación
 */
export const createPoll = async (pollData) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description,
        target_month: pollData.target_month,
        target_contest_month: pollData.target_contest_month,
        voting_deadline: pollData.voting_deadline,
        created_by: pollData.created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando encuesta:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en createPoll:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Agrega opciones a una encuesta
 * @param {string} pollId - ID de la encuesta
 * @param {Array} options - Array de opciones
 * @returns {Object} Resultado de la creación
 */
export const addPollOptions = async (pollId, options) => {
  try {
    const optionsToInsert = options.map((option, index) => ({
      poll_id: pollId,
      option_title: option.title,
      option_description: option.description,
      option_text: option.text,
      display_order: index + 1
    }));

    const { data, error } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)
      .select();

    if (error) {
      console.error('Error agregando opciones:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en addPollOptions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene resultados detallados de una encuesta (solo para admins)
 * @param {string} pollId - ID de la encuesta
 * @returns {Object} Resultados de la encuesta
 */
export const getPollResults = async (pollId) => {
  try {
    // Obtener encuesta con opciones y conteos
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_title,
          option_description,
          option_text,
          vote_count,
          display_order
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError) {
      console.error('Error obteniendo resultados:', pollError);
      return { success: false, error: pollError.message };
    }

    // Obtener detalles de votos
    const { data: votes, error: votesError } = await supabase
      .from('poll_votes')
      .select(`
        id,
        option_id,
        created_at,
        user_profiles (
          display_name
        )
      `)
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (votesError) {
      console.error('Error obteniendo votos:', votesError);
      return { success: false, error: votesError.message };
    }

    return { 
      success: true, 
      data: {
        poll,
        votes,
        summary: {
          total_votes: poll.total_votes,
          winning_option: poll.poll_options?.reduce((prev, current) => 
            prev.vote_count > current.vote_count ? prev : current
          )
        }
      }
    };
  } catch (error) {
    console.error('Error en getPollResults:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cierra una encuesta manualmente (solo para admins)
 * @param {string} pollId - ID de la encuesta
 * @returns {Object} Resultado de la operación
 */
export const closePoll = async (pollId) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .update({ 
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', pollId)
      .select();

    if (error) {
      console.error('Error cerrando encuesta:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en closePoll:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene todas las encuestas (para panel admin)
 * @returns {Array} Lista de encuestas
 */
export const getAllPolls = async () => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_title,
          vote_count
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo todas las encuestas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getAllPolls:', error);
    return [];
  }
};

/**
 * Convierte una encuesta cerrada en un concurso usando la función de base de datos
 * @param {string} pollId - ID de la encuesta
 * @returns {Object} Resultado de la conversión
 */
export const convertPollToContest = async (pollId) => {
  try {
    const { data, error } = await supabase
      .rpc('manually_convert_poll', { poll_uuid: pollId });

    if (error) {
      console.error('Error convirtiendo encuesta:', error);
      return { success: false, error: error.message };
    }

    // La función RPC retorna un JSONB con el resultado
    if (data && data.success) {
      return { 
        success: true, 
        data: {
          contest_id: data.contest_id,
          winning_option: data.winning_option,
          message: data.message
        }
      };
    } else {
      return { 
        success: false, 
        error: data?.error || 'Error desconocido en la conversión' 
      };
    }
  } catch (error) {
    console.error('Error en convertPollToContest:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Procesa encuestas expiradas en lote
 * @returns {Object} Resultado del procesamiento
 */
export const processExpiredPolls = async () => {
  try {
    const { data, error } = await supabase
      .rpc('process_expired_polls');

    if (error) {
      console.error('Error procesando encuestas expiradas:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: data || [],
      processed: data?.length || 0
    };
  } catch (error) {
    console.error('Error en processExpiredPolls:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza una encuesta existente
 * @param {string} pollId - ID de la encuesta
 * @param {Object} pollData - Datos actualizados de la encuesta
 * @returns {Object} Resultado de la operación
 */
export const updatePoll = async (pollId, pollData) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .update({
        title: pollData.title,
        description: pollData.description,
        target_month: pollData.target_month,
        target_contest_month: pollData.target_contest_month?.toLowerCase(),
        voting_deadline: pollData.voting_deadline,
        updated_at: new Date().toISOString()
      })
      .eq('id', pollId)
      .select();

    if (error) {
      console.error('Error actualizando encuesta:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error en updatePoll:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza una opción de encuesta existente
 * @param {string} optionId - ID de la opción
 * @param {Object} optionData - Datos actualizados de la opción
 * @returns {Object} Resultado de la operación
 */
export const updatePollOption = async (optionId, optionData) => {
  try {
    console.log('updatePollOption llamada con:', { optionId, optionData });
    
    const { data, error } = await supabase
      .from('poll_options')
      .update({
        option_title: optionData.title,
        option_description: optionData.description,
        option_text: optionData.text,
        updated_at: new Date().toISOString()
      })
      .eq('id', optionId)
      .select();

    console.log('updatePollOption respuesta Supabase:', { data, error });

    if (error) {
      console.error('Error actualizando opción:', error);
      return { success: false, error: error.message };
    }

    console.log('updatePollOption retornando:', { success: true, data: data?.[0] });
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error en updatePollOption:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Elimina una opción de encuesta
 * @param {string} optionId - ID de la opción a eliminar
 * @returns {Object} Resultado de la operación
 */
export const deletePollOption = async (optionId) => {
  try {
    const { error } = await supabase
      .from('poll_options')
      .delete()
      .eq('id', optionId);

    if (error) {
      console.error('Error eliminando opción:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en deletePollOption:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Agrega una nueva opción a una encuesta existente
 * @param {string} pollId - ID de la encuesta
 * @param {Object} optionData - Datos de la nueva opción
 * @returns {Object} Resultado de la operación
 */
export const addSinglePollOption = async (pollId, optionData) => {
  try {
    // Obtener el siguiente display_order
    const { data: maxOrder } = await supabase
      .from('poll_options')
      .select('display_order')
      .eq('poll_id', pollId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrder && maxOrder.length > 0 ? maxOrder[0].display_order + 1 : 1;

    const { data, error } = await supabase
      .from('poll_options')
      .insert({
        poll_id: pollId,
        option_title: optionData.title,
        option_description: optionData.description,
        option_text: optionData.text,
        display_order: nextOrder
      })
      .select();

    if (error) {
      console.error('Error agregando opción:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error en addSinglePollOption:', error);
    return { success: false, error: error.message };
  }
};