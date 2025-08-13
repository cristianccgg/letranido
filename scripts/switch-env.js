#!/usr/bin/env node
import { existsSync, renameSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ENV_LOCAL = '.env.local';
const ENV_DEV = '.env.local.development';
const ENV_PROD = '.env.local.production';

async function switchToLocal() {
  console.log('🔄 Cambiando a entorno LOCAL...');
  
  // Guardar producción si existe
  if (existsSync(ENV_LOCAL)) {
    renameSync(ENV_LOCAL, ENV_PROD);
    console.log('✅ Configuración de producción guardada');
  }
  
  // Activar desarrollo
  if (existsSync(ENV_DEV)) {
    renameSync(ENV_DEV, ENV_LOCAL);
    console.log('✅ Configuración local activada');
  } else {
    console.log('❌ No se encontró .env.local.development');
    return;
  }
  
  // Verificar que Supabase local esté corriendo
  try {
    await execAsync('supabase status');
    console.log('✅ Supabase local está corriendo');
  } catch (error) {
    console.log('🚀 Iniciando Supabase local...');
    try {
      await execAsync('supabase start');
      console.log('✅ Supabase local iniciado');
    } catch (startError) {
      console.log('❌ Error iniciando Supabase local:', startError.message);
    }
  }
  
  console.log('\n🎉 ¡Listo! Ahora estás en modo LOCAL');
  console.log('📝 API: http://127.0.0.1:54321');
  console.log('🎨 Studio: http://127.0.0.1:54323');
  console.log('\n💡 Ejecuta: npm run dev');
}

async function switchToProduction() {
  console.log('🔄 Cambiando a entorno PRODUCCIÓN...');
  
  // Guardar desarrollo si existe
  if (existsSync(ENV_LOCAL)) {
    renameSync(ENV_LOCAL, ENV_DEV);
    console.log('✅ Configuración local guardada');
  }
  
  // Activar producción
  if (existsSync(ENV_PROD)) {
    renameSync(ENV_PROD, ENV_LOCAL);
    console.log('✅ Configuración de producción activada');
  } else {
    console.log('❌ No se encontró .env.local.production');
    return;
  }
  
  console.log('\n🎉 ¡Listo! Ahora estás en modo PRODUCCIÓN');
  console.log('⚠️  CUIDADO: Estás usando datos REALES');
  console.log('\n💡 Ejecuta: npm run dev');
}

async function showStatus() {
  console.log('\n📊 Estado actual:');
  
  if (existsSync(ENV_LOCAL)) {
    // Leer primera línea para determinar el tipo
    const fs = await import('fs');
    const content = fs.readFileSync(ENV_LOCAL, 'utf8');
    const isLocal = content.includes('127.0.0.1:54321');
    
    if (isLocal) {
      console.log('🟢 Modo: LOCAL (desarrollo)');
      console.log('📝 API: http://127.0.0.1:54321');
    } else {
      console.log('🔴 Modo: PRODUCCIÓN');
      console.log('⚠️  Usando datos REALES');
    }
  } else {
    console.log('❌ No hay configuración activa');
  }
  
  console.log('\nArchivos disponibles:');
  if (existsSync(ENV_LOCAL)) console.log('✅ .env.local (activo)');
  if (existsSync(ENV_DEV)) console.log('✅ .env.local.development');
  if (existsSync(ENV_PROD)) console.log('✅ .env.local.production');
}

// Parsear argumentos
const command = process.argv[2];

(async () => {
  switch (command) {
    case 'local':
      await switchToLocal();
      break;
    case 'prod':
    case 'production':
      await switchToProduction();
      break;
    case 'status':
      await showStatus();
      break;
    default:
      console.log('🔧 Uso: npm run env [local|prod|status]');
      console.log('');
      console.log('Comandos:');
      console.log('  local      - Cambiar a desarrollo local');
      console.log('  prod       - Cambiar a producción');
      console.log('  status     - Ver estado actual');
      break;
  }
})();