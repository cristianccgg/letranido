// lib/email/supabase-emails.js - Cliente para Edge Functions
import { supabase } from '../supabase.js';

export const sendContestEmailViaSupabase = async (emailType, additionalData = {}) => {
  try {
    console.log(`📧 Enviando email via Supabase Edge Function: ${emailType}`);
    
    // Construir el body basado en el tipo de email
    // Determinar modo basado en el entorno actual
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const emailMode = isDevelopment ? 'test' : (import.meta.env.VITE_EMAIL_MODE || 'production');
    
    let requestBody = {
      emailType,
      emailMode: emailMode, // Pasar modo al backend
      ...additionalData
    };
    
    console.log(`📧 Modo de email determinado: ${emailMode} (isDev: ${isDevelopment})`);
    
    // Si no es un email manual, agregar contestId si existe
    if (!emailType.startsWith('manual_')) {
      requestBody.contestId = additionalData.contestId || null;
    }
    
    const { data, error } = await supabase.functions.invoke('send-contest-emails', {
      body: requestBody
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

// Función para obtener conteo de destinatarios sin enviar
export const getEmailRecipientsCount = async (emailType, additionalData = {}) => {
  try {
    console.log(`📊 Obteniendo conteo de destinatarios para: ${emailType}`);
    
    // Determinar modo basado en el entorno actual
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const emailMode = isDevelopment ? 'test' : (import.meta.env.VITE_EMAIL_MODE || 'production');
    
    const requestBody = {
      emailType,
      emailMode: emailMode,
      countOnly: true, // Solo obtener conteo
      ...additionalData
    };
    
    // Si no es un email manual, agregar contestId si existe
    if (!emailType.startsWith('manual_')) {
      requestBody.contestId = additionalData.contestId || null;
    }
    
    const { data, error } = await supabase.functions.invoke('send-contest-emails', {
      body: requestBody
    });
    
    if (error) {
      console.error('❌ Error obteniendo conteo:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conteo obtenido:', data);
    return {
      success: true,
      totalRecipients: data.totalRecipients || 0,
      details: data.details || {}
    };
    
  } catch (error) {
    console.error('❌ Error en getEmailRecipientsCount:', error);
    return { success: false, error: error.message };
  }
};

// Función para envío por lotes con límite diario
export const sendEmailBatch = async (emailType, batchOptions, additionalData = {}) => {
  const { 
    batchNumber = 1,
    batchSize = 100,
    offset = 0
  } = batchOptions;
  
  try {
    console.log(`📦 Enviando lote ${batchNumber} de ${emailType} (límite: ${batchSize}, offset: ${offset})`);
    
    // Determinar modo basado en el entorno actual
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const emailMode = isDevelopment ? 'test' : (import.meta.env.VITE_EMAIL_MODE || 'production');
    
    const requestBody = {
      emailType,
      emailMode: emailMode,
      batchLimit: batchSize,
      batchOffset: offset,
      batchNumber: batchNumber,
      ...additionalData
    };
    
    // Si no es un email manual, agregar contestId si existe
    if (!emailType.startsWith('manual_')) {
      requestBody.contestId = additionalData.contestId || null;
    }
    
    const { data, error } = await supabase.functions.invoke('send-contest-emails', {
      body: requestBody
    });
    
    if (error) {
      console.error('❌ Error enviando lote:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Lote ${batchNumber} enviado:`, data);
    return {
      ...data,
      batchNumber,
      batchSize,
      offset
    };
    
  } catch (error) {
    console.error('❌ Error en sendEmailBatch:', error);
    return { success: false, error: error.message };
  }
};