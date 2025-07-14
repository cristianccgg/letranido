// Archivo temporal para debuggear la tabla de concursos
import { supabase } from './supabase.js';

export const debugContests = async () => {
  try {
    console.log('🔍 Verificando tabla contests...');
    
    // 1. Verificar todos los concursos
    const { data: allContests, error: allError } = await supabase
      .from('contests')
      .select('*');
    
    if (allError) {
      console.error('❌ Error obteniendo todos los concursos:', allError);
      return { error: allError };
    }
    
    console.log('📊 Todos los concursos:', allContests);
    
    // 2. Verificar específicamente concursos activos (no finalizados)
    const { data: activeContests, error: activeError } = await supabase
      .from('contests')
      .select('*')
      .is('finalized_at', null);
    
    if (activeError) {
      console.error('❌ Error obteniendo concursos activos:', activeError);
      return { error: activeError };
    }
    
    console.log('🎯 Concursos activos:', activeContests);
    
    // 3. Verificar la estructura de la tabla
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'contests' })
      .catch(() => {
        // Si no existe esa función, intentar otra forma
        return { data: null, error: 'No se pudo obtener info de tabla' };
      });
    
    return {
      allContests,
      activeContests,
      totalContests: allContests?.length || 0,
      activeCount: activeContests?.length || 0,
      tableInfo: tableInfo || 'No disponible'
    };
    
  } catch (error) {
    console.error('❌ Error general en debug:', error);
    return { error: error.message };
  }
};

// Función para verificar si existe la columna is_active
export const checkContestSchema = async () => {
  try {
    // Intentar una consulta simple para ver qué columnas existen
    const { data, error } = await supabase
      .from('contests')
      .select('id, title, status, finalized_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Error verificando esquema:', error);
      // Si falla, tal vez is_active no existe
      const { data: withoutActive, error: error2 } = await supabase
        .from('contests')
        .select('id, title')
        .limit(1);
        
      if (error2) {
        console.error('❌ Error incluso sin is_active:', error2);
        return { hasIsActive: false, error: error2.message };
      }
      
      return { 
        hasStatus: false, 
        message: 'Error en esquema de contests',
        sampleData: withoutActive 
      };
    }
    
    return { 
      hasStatus: true, 
      message: 'Esquema OK - usando status en lugar de is_active',
      sampleData: data 
    };
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    return { error: error.message };
  }
};