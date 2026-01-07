-- ============================================================================
-- ANÁLISIS RÁPIDO DE IMPACTO - Ejecutar primero
-- ============================================================================
-- Este script te da la respuesta en 30 segundos:
-- ¿Cuántos usuarios puedo desactivar sin afectar mi comunidad activa?
-- ============================================================================

-- 🎯 RESULTADO FINAL - LA RESPUESTA QUE NECESITAS
WITH
  current_state AS (
    SELECT COUNT(*) as total
    FROM user_profiles
    WHERE email IS NOT NULL
      AND email != ''
      AND email_notifications = true
  ),
  inactive_users AS (
    SELECT COUNT(*) as total
    FROM user_profiles up
    WHERE
      email IS NOT NULL
      AND email != ''
      AND email_notifications = true
      AND NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
      AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
      AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  ),
  active_users AS (
    SELECT COUNT(*) as total
    FROM user_profiles up
    WHERE
      email IS NOT NULL
      AND email != ''
      AND email_notifications = true
      AND (
        EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
        OR EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
        OR EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
        OR EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
      )
  )
SELECT
  '📊 ESTADO ACTUAL' as seccion,
  NULL::text as metrica,
  NULL::int as valor,
  NULL::text as status
UNION ALL
SELECT
  '',
  '📧 Emails que envías actualmente',
  (SELECT total FROM current_state),
  CASE
    WHEN (SELECT total FROM current_state) > 100 THEN '❌ Excede límite'
    ELSE '✅ Dentro del límite'
  END
UNION ALL
SELECT
  '',
  '✅ Usuarios activos (participan)',
  (SELECT total FROM active_users),
  '🎯 MANTENER'
UNION ALL
SELECT
  '',
  '😴 Usuarios inactivos (nunca participaron)',
  (SELECT total FROM inactive_users),
  '⚠️ CANDIDATOS A DESACTIVAR'
UNION ALL
SELECT
  '',
  NULL,
  NULL,
  NULL
UNION ALL
SELECT
  '🎯 DESPUÉS DE OPTIMIZAR',
  NULL,
  NULL,
  NULL
UNION ALL
SELECT
  '',
  '📧 Emails después de desactivar inactivos',
  (SELECT total FROM active_users),
  CASE
    WHEN (SELECT total FROM active_users) <= 100 THEN '✅ Problema resuelto'
    ELSE '⚠️ Revisar más criterios'
  END
UNION ALL
SELECT
  '',
  '📈 Espacio para nuevos usuarios',
  100 - (SELECT total FROM active_users),
  '💪 Margen de crecimiento'
UNION ALL
SELECT
  '',
  '💾 Reducción de emails',
  (SELECT total FROM inactive_users),
  CONCAT(
    ROUND(100.0 * (SELECT total FROM inactive_users) / NULLIF((SELECT total FROM current_state), 0), 0),
    '% menos emails'
  );

-- 📋 DETALLE: Quiénes son estos usuarios inactivos
SELECT
  '😴 USUARIOS INACTIVOS - CANDIDATOS A DESACTIVAR' as titulo;

SELECT
  up.email,
  up.display_name,
  up.created_at as fecha_registro,
  EXTRACT(DAY FROM NOW() - up.created_at)::int as dias_registrado,
  CASE
    WHEN up.created_at > NOW() - INTERVAL '7 days' THEN '⚠️ Muy reciente (esperar)'
    WHEN up.created_at > NOW() - INTERVAL '30 days' THEN '⚡ Reciente (considerar)'
    ELSE '✅ Antiguo (desactivar seguro)'
  END as recomendacion
FROM user_profiles up
WHERE
  email IS NOT NULL
  AND email != ''
  AND email_notifications = true
  AND NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
ORDER BY up.created_at ASC
LIMIT 50;

-- 🎖️ USUARIOS PROTEGIDOS - NUNCA DESACTIVAR
SELECT
  '🎖️ USUARIOS PROTEGIDOS - LISTA BLANCA' as titulo;

SELECT
  up.email,
  up.display_name,
  COALESCE(
    (SELECT COUNT(*) FROM stories WHERE user_id = up.id AND published_at IS NOT NULL),
    0
  ) as historias,
  COALESCE(
    (SELECT COUNT(*) FROM votes WHERE user_id = up.id),
    0
  ) as votos,
  COALESCE(
    (SELECT COUNT(*) FROM comments WHERE user_id = up.id),
    0
  ) as comentarios,
  CASE
    WHEN EXISTS(SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
      THEN '❤️ Supporter'
    ELSE ''
  END as especial
FROM user_profiles up
WHERE
  email IS NOT NULL
  AND email != ''
  AND email_notifications = true
  AND (
    EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
    OR EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
    OR EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
    OR EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  )
ORDER BY
  COALESCE((SELECT COUNT(*) FROM stories WHERE user_id = up.id AND published_at IS NOT NULL), 0) DESC,
  COALESCE((SELECT COUNT(*) FROM votes WHERE user_id = up.id), 0) DESC
LIMIT 50;

-- ✅ COMANDO LISTO PARA COPIAR Y PEGAR
SELECT
  '🚀 COMANDO DE DESACTIVACIÓN' as titulo;

SELECT
  '⚠️ ANTES DE EJECUTAR: Revisa las listas de arriba' as advertencia;

SELECT
  '✅ Si estás de acuerdo, ejecuta el siguiente UPDATE:' as instruccion;

SELECT
  '
UPDATE user_profiles up
SET
  email_notifications = false,
  contest_notifications = false,
  general_notifications = false,
  newsletter_contests = false,
  updated_at = NOW()
WHERE
  -- Solo inactivos totales
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = ''kofi_supporter'')
  -- Registrados hace más de 30 días (seguro)
  AND created_at < NOW() - INTERVAL ''30 days''
  -- Con email activo
  AND email IS NOT NULL
  AND email != ''''
  AND email_notifications = true;
' as comando_sql;

-- 📊 PREDICCIÓN: ¿Cuántos usuarios desactivará?
SELECT
  COUNT(*) as usuarios_que_se_desactivaran
FROM user_profiles up
WHERE
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  AND created_at < NOW() - INTERVAL '30 days'
  AND email IS NOT NULL
  AND email != ''
  AND email_notifications = true;
