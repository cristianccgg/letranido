-- Script para eliminar notificaciones de comentarios
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar trigger de comentarios
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;

-- 2. Eliminar función de notificaciones de comentarios
DROP FUNCTION IF EXISTS notify_new_comment();

-- 3. (Opcional) Eliminar notificaciones existentes de tipo 'comment'
-- DELETE FROM notifications WHERE type = 'comment';

-- ✅ Notificaciones de comentarios eliminadas de la base de datos