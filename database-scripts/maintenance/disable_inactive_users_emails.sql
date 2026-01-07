-- ============================================================================
-- Script para desactivar notificaciones de usuarios completamente inactivos
-- ============================================================================
-- Propósito: Optimizar el límite de emails diarios desactivando notificaciones
--            a usuarios que NUNCA han participado en la plataforma
--
-- Criterios de inactividad:
--   - NO han publicado ninguna historia
--   - NO han dado ningún voto
--   - NO han escrito ningún comentario
--   - NO son Ko-fi supporters
--
-- NOTA: NO elimina cuentas, solo desactiva emails para liberar cuota
-- ============================================================================

-- 1️⃣ ANALIZAR PRIMERO: Ver cuántos usuarios se verían afectados
SELECT
  COUNT(*) as total_usuarios_inactivos,
  COUNT(CASE WHEN email_notifications = true THEN 1 END) as con_notificaciones_activas,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '30 days' THEN 1 END) as registrados_hace_mas_30_dias
FROM user_profiles up
WHERE
  -- No ha publicado historias
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  -- No ha votado
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  -- No ha comentado
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  -- No es Ko-fi supporter
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  -- Tiene email configurado (usuarios que podrían recibir emails)
  AND email IS NOT NULL
  AND email != '';

-- 2️⃣ VER DETALLES: Listar usuarios que serían afectados
SELECT
  up.email,
  up.display_name,
  up.created_at,
  EXTRACT(DAY FROM NOW() - up.created_at) as dias_desde_registro,
  up.email_notifications,
  up.contest_notifications,
  up.general_notifications
FROM user_profiles up
WHERE
  -- Mismos criterios de arriba
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  AND email IS NOT NULL
  AND email != ''
ORDER BY up.created_at DESC;

-- 3️⃣ EJECUTAR: Desactivar notificaciones a usuarios inactivos
-- ⚠️ COMENTADO POR SEGURIDAD - Descomentar solo cuando estés seguro
/*
UPDATE user_profiles up
SET
  email_notifications = false,
  contest_notifications = false,
  general_notifications = false,
  newsletter_contests = false,
  updated_at = NOW()
WHERE
  -- No ha publicado historias
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  -- No ha votado
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  -- No ha comentado
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  -- No es Ko-fi supporter
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  -- Tiene email configurado
  AND email IS NOT NULL
  AND email != ''
  -- Actualmente tiene notificaciones activas (no tocar si ya están desactivadas)
  AND email_notifications = true;
*/

-- 4️⃣ VERIFICAR DESPUÉS: Contar usuarios activos que recibirán emails
SELECT
  COUNT(*) as usuarios_que_recibiran_emails
FROM user_profiles
WHERE
  email IS NOT NULL
  AND email != ''
  AND email_notifications = true;

-- 5️⃣ VARIANTE MÁS AGRESIVA (OPCIONAL): Incluir usuarios inactivos por 60+ días
-- ⚠️ Descomentar solo si necesitas reducir MÁS la lista
/*
SELECT
  COUNT(*) as usuarios_inactivos_60_dias,
  COUNT(CASE WHEN email_notifications = true THEN 1 END) as con_notificaciones_activas
FROM user_profiles up
WHERE
  -- No ha publicado historias
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  -- No ha votado
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  -- No ha comentado
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  -- No es Ko-fi supporter
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  -- Registrado hace más de 60 días
  AND created_at < NOW() - INTERVAL '60 days'
  -- Tiene email configurado
  AND email IS NOT NULL
  AND email != '';
*/

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script NO elimina cuentas, solo desactiva notificaciones
-- 2. Los usuarios pueden reactivar sus notificaciones en cualquier momento
--    desde su página de preferencias
-- 3. Si un usuario empieza a participar, puedes reactivar sus notificaciones
--    manualmente o esperar a que lo haga desde sus preferencias
-- 4. SIEMPRE ejecuta primero el análisis (paso 1 y 2) antes de desactivar
-- 5. Considera enviar un email de aviso antes de desactivar (opcional)
-- ============================================================================

-- 6️⃣ REACTIVAR NOTIFICACIONES (si necesitas hacerlo después)
-- Ejemplo: Reactivar para usuarios que han participado recientemente
/*
UPDATE user_profiles up
SET
  email_notifications = true,
  contest_notifications = true,
  updated_at = NOW()
WHERE
  email_notifications = false
  AND (
    -- Ha publicado historias en los últimos 30 días
    EXISTS (
      SELECT 1 FROM stories
      WHERE user_id = up.id
      AND published_at > NOW() - INTERVAL '30 days'
    )
    -- O ha votado recientemente
    OR EXISTS (
      SELECT 1 FROM votes
      WHERE user_id = up.id
      AND created_at > NOW() - INTERVAL '30 days'
    )
    -- O ha comentado recientemente
    OR EXISTS (
      SELECT 1 FROM comments
      WHERE user_id = up.id
      AND created_at > NOW() - INTERVAL '30 days'
    )
  );
*/
