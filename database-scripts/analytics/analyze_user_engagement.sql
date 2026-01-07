-- ============================================================================
-- Análisis completo de engagement de usuarios
-- ============================================================================
-- Propósito: Entender qué usuarios realmente usan la plataforma
--            para tomar decisiones informadas sobre emails
-- ============================================================================

-- 📊 1. RESUMEN GENERAL
SELECT
  'Total usuarios registrados' as metrica,
  COUNT(*) as cantidad
FROM user_profiles
WHERE email IS NOT NULL AND email != ''

UNION ALL

SELECT
  'Usuarios con emails activos',
  COUNT(*)
FROM user_profiles
WHERE email IS NOT NULL
  AND email != ''
  AND email_notifications = true

UNION ALL

SELECT
  'Usuarios que han escrito historias',
  COUNT(DISTINCT user_id)
FROM stories
WHERE published_at IS NOT NULL

UNION ALL

SELECT
  'Usuarios que han votado',
  COUNT(DISTINCT user_id)
FROM votes

UNION ALL

SELECT
  'Usuarios que han comentado',
  COUNT(DISTINCT user_id)
FROM comments

UNION ALL

SELECT
  'Ko-fi supporters',
  COUNT(DISTINCT user_id)
FROM user_badges
WHERE badge_id = 'kofi_supporter';

-- 📈 2. SEGMENTACIÓN POR NIVEL DE ACTIVIDAD
WITH user_activity AS (
  SELECT
    up.id,
    up.email,
    up.display_name,
    up.created_at,
    up.email_notifications,
    -- Contadores de actividad
    (SELECT COUNT(*) FROM stories WHERE user_id = up.id AND published_at IS NOT NULL) as stories_count,
    (SELECT COUNT(*) FROM votes WHERE user_id = up.id) as votes_count,
    (SELECT COUNT(*) FROM comments WHERE user_id = up.id) as comments_count,
    -- Flags de actividad
    EXISTS(SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter') as is_supporter,
    -- Última actividad
    GREATEST(
      COALESCE((SELECT MAX(published_at) FROM stories WHERE user_id = up.id), '1970-01-01'),
      COALESCE((SELECT MAX(created_at) FROM votes WHERE user_id = up.id), '1970-01-01'),
      COALESCE((SELECT MAX(created_at) FROM comments WHERE user_id = up.id), '1970-01-01')
    ) as last_activity
  FROM user_profiles up
  WHERE email IS NOT NULL AND email != ''
)
SELECT
  CASE
    WHEN is_supporter THEN '🎖️ Ko-fi Supporter'
    WHEN stories_count >= 3 THEN '✍️ Escritor activo (3+ historias)'
    WHEN stories_count >= 1 THEN '📝 Escritor (1-2 historias)'
    WHEN votes_count >= 5 OR comments_count >= 5 THEN '👍 Participante activo'
    WHEN votes_count >= 1 OR comments_count >= 1 THEN '👀 Participante ocasional'
    ELSE '😴 Sin actividad'
  END as segmento,
  COUNT(*) as cantidad_usuarios,
  COUNT(CASE WHEN email_notifications = true THEN 1 END) as con_emails_activos,
  ROUND(AVG(stories_count), 1) as promedio_historias,
  ROUND(AVG(votes_count), 1) as promedio_votos,
  ROUND(AVG(comments_count), 1) as promedio_comentarios
FROM user_activity
GROUP BY
  CASE
    WHEN is_supporter THEN '🎖️ Ko-fi Supporter'
    WHEN stories_count >= 3 THEN '✍️ Escritor activo (3+ historias)'
    WHEN stories_count >= 1 THEN '📝 Escritor (1-2 historias)'
    WHEN votes_count >= 5 OR comments_count >= 5 THEN '👍 Participante activo'
    WHEN votes_count >= 1 OR comments_count >= 1 THEN '👀 Participante ocasional'
    ELSE '😴 Sin actividad'
  END
ORDER BY
  CASE
    WHEN segmento = '🎖️ Ko-fi Supporter' THEN 1
    WHEN segmento = '✍️ Escritor activo (3+ historias)' THEN 2
    WHEN segmento = '📝 Escritor (1-2 historias)' THEN 3
    WHEN segmento = '👍 Participante activo' THEN 4
    WHEN segmento = '👀 Participante ocasional' THEN 5
    ELSE 6
  END;

-- 📅 3. ANÁLISIS TEMPORAL: ¿Cuándo se registraron los usuarios inactivos?
SELECT
  CASE
    WHEN up.created_at > NOW() - INTERVAL '7 days' THEN '🆕 Última semana'
    WHEN up.created_at > NOW() - INTERVAL '30 days' THEN '📅 Último mes'
    WHEN up.created_at > NOW() - INTERVAL '90 days' THEN '📆 Últimos 3 meses'
    WHEN up.created_at > NOW() - INTERVAL '180 days' THEN '📋 Últimos 6 meses'
    ELSE '🗓️ Más de 6 meses'
  END as periodo_registro,
  COUNT(*) as usuarios_inactivos,
  COUNT(CASE WHEN email_notifications = true THEN 1 END) as con_emails_activos
FROM user_profiles up
WHERE
  email IS NOT NULL
  AND email != ''
  AND NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
GROUP BY
  CASE
    WHEN up.created_at > NOW() - INTERVAL '7 days' THEN '🆕 Última semana'
    WHEN up.created_at > NOW() - INTERVAL '30 days' THEN '📅 Último mes'
    WHEN up.created_at > NOW() - INTERVAL '90 days' THEN '📆 Últimos 3 meses'
    WHEN up.created_at > NOW() - INTERVAL '180 days' THEN '📋 Últimos 6 meses'
    ELSE '🗓️ Más de 6 meses'
  END
ORDER BY
  CASE
    WHEN periodo_registro = '🆕 Última semana' THEN 1
    WHEN periodo_registro = '📅 Último mes' THEN 2
    WHEN periodo_registro = '📆 Últimos 3 meses' THEN 3
    WHEN periodo_registro = '📋 Últimos 6 meses' THEN 4
    ELSE 5
  END;

-- 🎯 4. USUARIOS PRIORITARIOS: NUNCA desactivar emails de estos usuarios
SELECT
  up.email,
  up.display_name,
  COALESCE(s.stories, 0) as historias,
  COALESCE(v.votes, 0) as votos,
  COALESCE(c.comments, 0) as comentarios,
  CASE
    WHEN EXISTS(SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
      THEN '❤️ Supporter'
    ELSE ''
  END as badges_especiales,
  up.created_at as fecha_registro
FROM user_profiles up
LEFT JOIN (
  SELECT user_id, COUNT(*) as stories
  FROM stories WHERE published_at IS NOT NULL
  GROUP BY user_id
) s ON s.user_id = up.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as votes
  FROM votes GROUP BY user_id
) v ON v.user_id = up.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as comments
  FROM comments GROUP BY user_id
) c ON c.user_id = up.id
WHERE
  email IS NOT NULL
  AND email != ''
  AND (
    -- Ha escrito al menos 1 historia
    COALESCE(s.stories, 0) >= 1
    -- O ha votado al menos 3 veces
    OR COALESCE(v.votes, 0) >= 3
    -- O ha comentado al menos 2 veces
    OR COALESCE(c.comments, 0) >= 2
    -- O es Ko-fi supporter
    OR EXISTS(SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  )
ORDER BY COALESCE(s.stories, 0) DESC, COALESCE(v.votes, 0) DESC;

-- 💡 5. RECOMENDACIÓN: ¿Cuántos emails ahorrarías?
WITH inactive_users AS (
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
)
SELECT
  (SELECT total FROM active_users) as emails_actuales,
  (SELECT total FROM inactive_users) as emails_a_desactivar,
  (SELECT total FROM active_users) - (SELECT total FROM inactive_users) as emails_despues,
  ROUND(
    100.0 * (SELECT total FROM inactive_users) / NULLIF((SELECT total FROM active_users), 0),
    1
  ) as porcentaje_reduccion;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- 📊 Resumen General: Te muestra el estado actual de la plataforma
-- 📈 Segmentación: Identifica quiénes son tus usuarios más valiosos
-- 📅 Análisis Temporal: ¿Los inactivos son nuevos o antiguos?
-- 🎯 Usuarios Prioritarios: Lista blanca - NUNCA desactivar sus emails
-- 💡 Recomendación: Cuánto ahorrarás en tu cuota de emails
-- ============================================================================
