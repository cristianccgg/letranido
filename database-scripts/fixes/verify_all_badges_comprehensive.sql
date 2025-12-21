-- Script completo de verificación de TODOS los badges del sistema
-- Para identificar posibles problemas similares al bug de "Ganador Veterano"
-- Ejecutar en Supabase SQL Editor para auditoría completa

-- 1. Ver todas las definiciones de badges
SELECT
  id,
  name,
  description,
  criteria,
  tier
FROM public.badge_definitions
ORDER BY tier, id;

-- 2. Verificar badges de conteo de historias (story_count)
-- Estos badges dependen de contar historias publicadas
SELECT
  bd.id as badge_id,
  bd.name,
  bd.criteria->>'threshold' as required_threshold,
  COUNT(DISTINCT ub.user_id) as users_with_badge,
  -- Verificar usuarios que NO deberían tener el badge
  COUNT(DISTINCT CASE
    WHEN story_count < (bd.criteria->>'threshold')::INTEGER
    THEN ub.user_id
  END) as incorrect_badges
FROM public.badge_definitions bd
LEFT JOIN public.user_badges ub ON ub.badge_id = bd.id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as story_count
  FROM public.stories
  WHERE published_at IS NOT NULL
  GROUP BY user_id
) story_counts ON story_counts.user_id = ub.user_id
WHERE bd.criteria->>'type' = 'story_count'
GROUP BY bd.id, bd.name, bd.criteria
ORDER BY bd.id;

-- 3. Verificar badges de victorias (contest_wins)
-- Estos badges dependen de contar SOLO victorias en primer lugar
SELECT
  bd.id as badge_id,
  bd.name,
  bd.criteria->>'threshold' as required_threshold,
  COUNT(DISTINCT ub.user_id) as users_with_badge,
  -- Verificar usuarios que NO deberían tener el badge
  COUNT(DISTINCT CASE
    WHEN win_count < (bd.criteria->>'threshold')::INTEGER
    THEN ub.user_id
  END) as incorrect_badges
FROM public.badge_definitions bd
LEFT JOIN public.user_badges ub ON ub.badge_id = bd.id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as win_count
  FROM public.stories
  WHERE is_winner = true AND winner_position = 1
  GROUP BY user_id
) win_counts ON win_counts.user_id = ub.user_id
WHERE bd.criteria->>'type' = 'contest_wins'
GROUP BY bd.id, bd.name, bd.criteria
ORDER BY bd.id;

-- 4. Verificar badges de ganadores individuales (contest_winner, contest_finalist)
-- Estos se asignan manualmente al finalizar concursos
SELECT
  bd.id as badge_id,
  bd.name,
  COUNT(DISTINCT ub.user_id) as total_users,
  COUNT(DISTINCT ub.id) as total_badges_given
FROM public.badge_definitions bd
LEFT JOIN public.user_badges ub ON ub.badge_id = bd.id
WHERE bd.id IN ('contest_winner', 'contest_finalist')
GROUP BY bd.id, bd.name;

-- 5. Detalle de badges especiales (Ko-fi, etc)
SELECT
  bd.id,
  bd.name,
  COUNT(DISTINCT ub.user_id) as users_with_badge
FROM public.badge_definitions bd
LEFT JOIN public.user_badges ub ON ub.badge_id = bd.id
WHERE bd.id NOT IN ('first_story', 'writer_5', 'writer_15', 'contest_winner', 'contest_finalist', 'contest_winner_veteran', 'contest_winner_legend')
GROUP BY bd.id, bd.name;

-- 6. Usuarios con badges incorrectos de story_count
-- Lista detallada de usuarios con badges de historias que no deberían tener
SELECT
  up.display_name,
  up.email,
  ub.badge_id,
  bd.name as badge_name,
  (bd.criteria->>'threshold')::INTEGER as required,
  COALESCE(story_counts.story_count, 0) as actual_stories,
  CASE
    WHEN COALESCE(story_counts.story_count, 0) >= (bd.criteria->>'threshold')::INTEGER
    THEN '✅ CORRECTO'
    ELSE '❌ INCORRECTO'
  END as status
FROM public.user_badges ub
JOIN public.badge_definitions bd ON bd.id = ub.badge_id
JOIN public.user_profiles up ON up.id = ub.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as story_count
  FROM public.stories
  WHERE published_at IS NOT NULL
  GROUP BY user_id
) story_counts ON story_counts.user_id = ub.user_id
WHERE bd.criteria->>'type' = 'story_count'
  AND COALESCE(story_counts.story_count, 0) < (bd.criteria->>'threshold')::INTEGER
ORDER BY ub.badge_id, up.display_name;

-- 7. Usuarios con badges incorrectos de contest_wins
-- Lista detallada de usuarios con badges de victorias que no deberían tener
SELECT
  up.display_name,
  up.email,
  ub.badge_id,
  bd.name as badge_name,
  (bd.criteria->>'threshold')::INTEGER as required_wins,
  COALESCE(win_counts.win_count, 0) as actual_wins,
  CASE
    WHEN COALESCE(win_counts.win_count, 0) >= (bd.criteria->>'threshold')::INTEGER
    THEN '✅ CORRECTO'
    ELSE '❌ INCORRECTO'
  END as status
FROM public.user_badges ub
JOIN public.badge_definitions bd ON bd.id = ub.badge_id
JOIN public.user_profiles up ON up.id = ub.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as win_count
  FROM public.stories
  WHERE is_winner = true AND winner_position = 1
  GROUP BY user_id
) win_counts ON win_counts.user_id = ub.user_id
WHERE bd.criteria->>'type' = 'contest_wins'
  AND COALESCE(win_counts.win_count, 0) < (bd.criteria->>'threshold')::INTEGER
ORDER BY ub.badge_id, up.display_name;

-- 8. Resumen ejecutivo de badges
SELECT
  'Total badge definitions' as metric,
  COUNT(*) as count
FROM public.badge_definitions
UNION ALL
SELECT
  'Total badges awarded',
  COUNT(*)
FROM public.user_badges
UNION ALL
SELECT
  'Unique users with badges',
  COUNT(DISTINCT user_id)
FROM public.user_badges;
