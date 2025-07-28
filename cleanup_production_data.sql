-- Script para limpiar datos de prueba antes de producción
-- ⚠️ CUIDADO: Este script elimina datos permanentemente
-- Ejecutar en Supabase SQL Editor SOLO en ambiente de desarrollo/staging

-- 1. Eliminar todos los comentarios
DELETE FROM comments;
COMMENT ON TABLE comments IS 'Tabla limpiada - todos los comentarios eliminados';

-- 2. Eliminar todos los votos
DELETE FROM votes;
COMMENT ON TABLE votes IS 'Tabla limpiada - todos los votos eliminados';

-- 3. Eliminar solo notificaciones de comentarios y likes (conservar badges)
DELETE FROM notifications WHERE type IN ('comment', 'like');
COMMENT ON TABLE notifications IS 'Notificaciones de comentarios y likes eliminadas - badges conservados';

-- 4. (Opcional) Resetear contadores de likes y comentarios en historias
UPDATE stories SET 
  likes_count = 0,
  comments_count = 0,
  votes_count = 0
WHERE likes_count > 0 OR comments_count > 0 OR votes_count > 0;

-- 5. (Opcional) Resetear vistas si quieres empezar desde cero
-- UPDATE stories SET views_count = 0 WHERE views_count > 0;

-- ✅ Base de datos limpia para producción
SELECT 
  'Limpieza completada:' as status,
  (SELECT COUNT(*) FROM comments) as comments_restantes,
  (SELECT COUNT(*) FROM votes) as votes_restantes,
  (SELECT COUNT(*) FROM notifications WHERE type IN ('comment', 'like')) as notificaciones_eliminadas,
  (SELECT COUNT(*) FROM notifications WHERE type = 'badge') as badges_conservados;