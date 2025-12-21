-- Script de verificación: Identificar badges "Ganador Veterano" asignados incorrectamente
-- Ejecutar ANTES de aplicar el fix para ver quiénes están afectados

-- 1. Usuarios con badge "Ganador Veterano" y sus estadísticas reales
SELECT
  up.id as user_id,
  up.display_name,
  up.email,
  -- Contar TODAS las posiciones ganadoras
  COUNT(CASE WHEN s.is_winner = true THEN 1 END) as total_winner_positions,
  -- Contar solo PRIMEROS lugares
  COUNT(CASE WHEN s.is_winner = true AND s.winner_position = 1 THEN 1 END) as first_place_wins,
  -- Contar FINALISTAS (2do y 3er lugar)
  COUNT(CASE WHEN s.is_winner = true AND s.winner_position IN (2, 3) THEN 1 END) as finalist_positions,
  -- Cuándo ganaron el badge
  ub.earned_at as veteran_badge_earned_at,
  -- Verificar si el badge fue asignado correctamente
  CASE
    WHEN COUNT(CASE WHEN s.is_winner = true AND s.winner_position = 1 THEN 1 END) >= 2
      THEN '✅ CORRECTO - Tiene 2+ victorias'
    ELSE '❌ INCORRECTO - No tiene 2+ victorias en primer lugar'
  END as badge_status
FROM public.user_badges ub
JOIN public.user_profiles up ON ub.user_id = up.id
LEFT JOIN public.stories s ON s.user_id = up.id
WHERE ub.badge_id = 'contest_winner_veteran'
GROUP BY up.id, up.display_name, up.email, ub.earned_at
ORDER BY first_place_wins DESC, finalist_positions DESC;

-- 2. Detalle de historias ganadoras por usuario con badge veterano
SELECT
  up.display_name,
  c.title as contest_title,
  s.title as story_title,
  s.winner_position,
  s.is_winner,
  s.created_at
FROM public.user_badges ub
JOIN public.user_profiles up ON ub.user_id = up.id
JOIN public.stories s ON s.user_id = up.id AND s.is_winner = true
JOIN public.contests c ON s.contest_id = c.id
WHERE ub.badge_id = 'contest_winner_veteran'
ORDER BY up.display_name, s.created_at;

-- 3. Resumen ejecutivo
SELECT
  'Total usuarios con badge Ganador Veterano' as metric,
  COUNT(DISTINCT ub.user_id) as count
FROM public.user_badges ub
WHERE ub.badge_id = 'contest_winner_veteran'
UNION ALL
SELECT
  'Usuarios con badge CORRECTO (2+ victorias)',
  COUNT(DISTINCT ub.user_id)
FROM public.user_badges ub
WHERE ub.badge_id = 'contest_winner_veteran'
  AND ub.user_id IN (
    SELECT user_id
    FROM public.stories
    WHERE is_winner = true AND winner_position = 1
    GROUP BY user_id
    HAVING COUNT(*) >= 2
  )
UNION ALL
SELECT
  'Usuarios con badge INCORRECTO',
  COUNT(DISTINCT ub.user_id)
FROM public.user_badges ub
WHERE ub.badge_id = 'contest_winner_veteran'
  AND ub.user_id NOT IN (
    SELECT user_id
    FROM public.stories
    WHERE is_winner = true AND winner_position = 1
    GROUP BY user_id
    HAVING COUNT(*) >= 2
  );
