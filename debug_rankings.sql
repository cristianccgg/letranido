-- 🔍 Script para diagnosticar por qué faltan 35 usuarios en el ranking sidebar

-- 1️⃣ Ver cuántos usuarios hay en cached_rankings vs total de usuarios
SELECT
  'cached_rankings' as tabla,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN total_karma > 0 THEN 1 END) as usuarios_con_karma,
  COUNT(CASE WHEN total_karma = 0 THEN 1 END) as usuarios_sin_karma
FROM cached_rankings

UNION ALL

SELECT
  'user_profiles' as tabla,
  COUNT(*) as total_usuarios,
  NULL as usuarios_con_karma,
  NULL as usuarios_sin_karma
FROM user_profiles;

-- 2️⃣ Ver usuarios que NO están en cached_rankings pero SÍ en user_profiles
SELECT
  up.id,
  up.display_name,
  up.created_at,
  CASE
    WHEN EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL) THEN 'Tiene historias'
    WHEN EXISTS (SELECT 1 FROM votes WHERE user_id = up.id) THEN 'Ha votado'
    WHEN EXISTS (SELECT 1 FROM comments WHERE user_id = up.id) THEN 'Ha comentado'
    ELSE 'Sin actividad'
  END as actividad
FROM user_profiles up
LEFT JOIN cached_rankings cr ON cr.user_id = up.id
WHERE cr.user_id IS NULL
ORDER BY up.created_at DESC;

-- 3️⃣ Ver distribución de karma en cached_rankings
SELECT
  CASE
    WHEN total_karma = 0 THEN '0 karma'
    WHEN total_karma BETWEEN 1 AND 10 THEN '1-10 karma'
    WHEN total_karma BETWEEN 11 AND 50 THEN '11-50 karma'
    WHEN total_karma > 50 THEN '>50 karma'
  END as rango_karma,
  COUNT(*) as cantidad_usuarios
FROM cached_rankings
GROUP BY
  CASE
    WHEN total_karma = 0 THEN '0 karma'
    WHEN total_karma BETWEEN 1 AND 10 THEN '1-10 karma'
    WHEN total_karma BETWEEN 11 AND 50 THEN '11-50 karma'
    WHEN total_karma > 50 THEN '>50 karma'
  END
ORDER BY rango_karma;

-- 4️⃣ Ver última actualización de rankings
SELECT
  last_updated,
  contest_period,
  total_users,
  updated_by_admin
FROM ranking_metadata
ORDER BY last_updated DESC
LIMIT 5;

-- 5️⃣ Usuarios con karma = 0 en cache (estos NO aparecen en sidebar por línea 265)
SELECT
  user_name,
  total_karma,
  total_stories,
  votes_given,
  comments_given
FROM cached_rankings
WHERE total_karma = 0
ORDER BY user_name;
