// lib/email/supabase-emails.js - Cliente para Edge Functions
import { supabase } from '../supabase.js';

export const sendContestEmailViaSupabase = async (emailType, contestId = null) => {
  try {
    console.log(`📧 Enviando email via Supabase Edge Function: ${emailType}`);
    
    const { data, error } = await supabase.functions.invoke('send-contest-emails', {
      body: {
        emailType,
        contestId
      }
    });
    
    if (error) {
      console.error('❌ Error llamando Edge Function:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Respuesta de Edge Function:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error en sendContestEmailViaSupabase:', error);
    return { success: false, error: error.message };
  }
};

// Función de prueba simple
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Probando conexión con Supabase Edge Functions...');
    
    const { data, error } = await supabase.functions.invoke('dynamic-handler', {
      body: { 
        action: 'test',
        message: 'Testing connection from Letranido' 
      }
    });
    
    if (error) {
      console.error('❌ Error llamando dynamic-handler:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Respuesta de dynamic-handler:', data);
    return {
      success: true,
      message: 'Conexión con Supabase Edge Functions exitosa',
      data: data
    };
    
  } catch (error) {
    console.error('❌ Error en testSupabaseConnection:', error);
    return { success: false, error: error.message };
  }
};

export const testSupabaseEmail = async () => {
  try {
    console.log('🧪 Probando email via Supabase...');
    
    const result = await sendContestEmailViaSupabase('new_contest');
    
    if (result.success) {
      return {
        success: true,
        message: `Email enviado a ${result.sent} usuarios en modo ${result.mode}`,
        data: result
      };
    } else {
      return {
        success: false,
        message: 'Error enviando email: ' + result.error
      };
    }
    
  } catch (error) {
    console.error('❌ Error en testSupabaseEmail:', error);
    return {
      success: false,
      message: error.message
    };
  }
};