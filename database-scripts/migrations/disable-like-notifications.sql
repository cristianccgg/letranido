-- disable-like-notifications.sql
-- Deshabilitar notificaciones automáticas de likes/votos

-- 1. Eliminar el trigger de notificaciones de votos
DROP TRIGGER IF EXISTS trigger_notify_new_vote ON votes;

-- 2. Eliminar la función asociada (opcional, pero recomendado para limpiar)
DROP FUNCTION IF EXISTS notify_new_vote();

-- 3. Limpiar notificaciones de likes existentes (opcional)
-- Descomentar la siguiente línea si quieres eliminar las notificaciones de likes existentes
-- DELETE FROM notifications WHERE type = 'like';

-- 4. Verificar que el trigger fue eliminado
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'votes'
  AND t.tgname LIKE '%notify%';

-- Si no devuelve filas, el trigger fue eliminado exitosamente

COMMENT ON TABLE votes IS 'Tabla de votos - SIN triggers de notificaciones automáticas para evitar spam';