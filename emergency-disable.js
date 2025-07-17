// EMERGENCIA: Script para desactivar modo mantenimiento
// Ejecuta: node emergency-disable.js

const { createClient } = require('@supabase/supabase-js');

// Configura tu Supabase (usa las mismas credenciales que en tu .env)
const supabaseUrl = 'TU_SUPABASE_URL';
const supabaseKey = 'TU_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyDisableMaintenance() {
  try {
    console.log('🚨 Desactivando modo mantenimiento de emergencia...');
    
    const { data, error } = await supabase
      .rpc('toggle_maintenance_mode', {
        active: false,
        custom_message: 'Mantenimiento desactivado de emergencia',
        duration: null,
        admin_email: 'emergency-disable'
      });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Modo mantenimiento desactivado exitosamente');
    console.log('📊 Estado actual:', data);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

emergencyDisableMaintenance();