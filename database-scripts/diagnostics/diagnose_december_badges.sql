-- DIAGNÓSTICO COMPLETO: Badges de Diciembre 2024
-- Ejecutar en Supabase SQL Editor
-- Fecha: Enero 4, 2026

-- ============================================
-- PASO 1: Verificar datos de T.Ántalo
-- ============================================
SELECT
  '=== DATOS DE T.ÁNTALO ===' as seccion,
  up.id as user_id,
  up.display_name,
  up.email,
  up.wins_count as wins_count_profile,
  (SELECT COUNT(*)
   FROM stories
   WHERE user_id = up.id
     AND is_winner = true
     AND winner_position = 1) as victorias_1er_lugar_reales
FROM user_profiles up
WHERE up.email = 'cristianccgg@hotmail.com';

-- ============================================
-- PASO 2: Ver sus historias ganadoras
-- ============================================
SELECT
  '=== HISTORIAS GANADORAS DE T.ÁNTALO ===' as seccion,
  s.title,
  s.is_winner,
  s.winner_position,
  c.month as concurso,
  c.finalized_at,
  s.created_at as enviada_el
FROM stories s
JOIN contests c ON s.contest_id = c.id
WHERE s.user_id = (SELECT id FROM user_profiles WHERE email = 'cristianccgg@hotmail.com')
  AND s.is_winner = true
ORDER BY c.finalized_at DESC;

-- ============================================
-- PASO 3: Ver sus badges actuales
-- ============================================
SELECT
  '=== BADGES ACTUALES DE T.ÁNTALO ===' as seccion,
  bd.id as badge_id,
  bd.name as badge_name,
  bd.description,
  ub.earned_at,
  ub.metadata
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id = (SELECT id FROM user_profiles WHERE email = 'cristianccgg@hotmail.com')
ORDER BY ub.earned_at DESC;

-- ============================================
-- PASO 4: Verificar reto de Diciembre 2024
-- ============================================
SELECT
  '=== CONCURSO DE DICIEMBRE 2024 ===' as seccion,
  id as contest_id,
  title,
  month,
  finalized_at,
  status
FROM contests
WHERE month ILIKE '%diciembre%2024%'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- PASO 5: Ver ganadores del reto de Diciembre
-- ============================================
WITH diciembre_contest AS (
  SELECT id
  FROM contests
  WHERE month ILIKE '%diciembre%2024%'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  '=== GANADORES DICIEMBRE 2024 ===' as seccion,
  s.winner_position,
  up.display_name,
  up.email,
  s.title as historia,
  s.likes_count as votos,
  s.is_winner,
  up.wins_count as wins_count_actual
FROM stories s
JOIN user_profiles up ON s.user_id = up.id
WHERE s.contest_id = (SELECT id FROM diciembre_contest)
  AND s.is_winner = true
ORDER BY s.winner_position;

-- ============================================
-- PASO 6: Verificar badges que DEBERÍAN tener los ganadores de Diciembre
-- ============================================
WITH diciembre_contest AS (
  SELECT id
  FROM contests
  WHERE month ILIKE '%diciembre%2024%'
  ORDER BY created_at DESC
  LIMIT 1
),
ganadores AS (
  SELECT
    s.user_id,
    s.winner_position,
    up.display_name,
    s.id as story_id
  FROM stories s
  JOIN user_profiles up ON s.user_id = up.id
  WHERE s.contest_id = (SELECT id FROM diciembre_contest)
    AND s.is_winner = true
)
SELECT
  '=== BADGES ESPERADOS VS REALES (DICIEMBRE) ===' as seccion,
  g.display_name,
  g.winner_position,
  CASE
    WHEN g.winner_position = 1 THEN 'contest_winner'
    ELSE 'contest_finalist'
  END as badge_esperado,
  EXISTS(
    SELECT 1
    FROM user_badges ub
    WHERE ub.user_id = g.user_id
      AND ub.badge_id = CASE WHEN g.winner_position = 1 THEN 'contest_winner' ELSE 'contest_finalist' END
      AND ub.metadata->>'contest_id' = (SELECT id::text FROM diciembre_contest)
  ) as tiene_badge_diciembre
FROM ganadores g
ORDER BY g.winner_position;

-- ============================================
-- PASO 7: Verificar badge VETERANO para T.Ántalo
-- ============================================
SELECT
  '=== VERIFICAR BADGE VETERANO T.ÁNTALO ===' as seccion,
  (SELECT wins_count FROM user_profiles WHERE email = 'cristianccgg@hotmail.com') as wins_count,
  EXISTS(
    SELECT 1
    FROM user_badges
    WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'cristianccgg@hotmail.com')
      AND badge_id = 'contest_winner_veteran'
  ) as tiene_badge_veterano,
  CASE
    WHEN (SELECT wins_count FROM user_profiles WHERE email = 'cristianccgg@hotmail.com') >= 2 THEN 'DEBERÍA TENER VETERANO'
    ELSE 'No califica aún'
  END as estado_esperado;
