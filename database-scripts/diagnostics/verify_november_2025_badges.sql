-- VERIFICACIÓN RÁPIDA: Badges de Noviembre 2025
-- Contest ID: ff77e982-4c99-48c9-afa2-1f4a07213b74
-- Ejecutar en: Supabase SQL Editor

-- ============================================
-- PASO 1: Ver ganadores de Noviembre 2025
-- ============================================
SELECT
  '=== GANADORES NOVIEMBRE 2025 ===' as seccion,
  s.winner_position,
  up.display_name,
  up.email,
  s.title as historia,
  s.likes_count as votos,
  up.wins_count as wins_count_actual
FROM stories s
JOIN user_profiles up ON s.user_id = up.id
WHERE s.contest_id = 'ff77e982-4c99-48c9-afa2-1f4a07213b74'::uuid
  AND s.is_winner = true
ORDER BY s.winner_position;

-- ============================================
-- PASO 2: Verificar badges de cada ganador
-- ============================================
WITH noviembre_contest AS (
  SELECT 'ff77e982-4c99-48c9-afa2-1f4a07213b74'::uuid as id
)
SELECT
  '=== BADGES ASIGNADOS A GANADORES DE NOVIEMBRE ===' as titulo,
  up.display_name,
  s.winner_position,
  bd.name as badge_name,
  ub.earned_at,
  ub.metadata->>'contest_id' = (SELECT id::text FROM noviembre_contest) as es_de_noviembre
FROM stories s
JOIN user_profiles up ON s.user_id = up.id
LEFT JOIN user_badges ub ON ub.user_id = s.user_id
LEFT JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE s.contest_id = (SELECT id FROM noviembre_contest)
  AND s.is_winner = true
ORDER BY s.winner_position, bd.name;

-- ============================================
-- PASO 3: Detectar badges FALTANTES
-- ============================================
WITH noviembre_contest AS (
  SELECT 'ff77e982-4c99-48c9-afa2-1f4a07213b74'::uuid as id
)
SELECT
  '=== BADGES QUE DEBERÍAN EXISTIR ===' as titulo,
  up.display_name,
  s.winner_position,
  CASE
    WHEN s.winner_position = 1 THEN 'contest_winner'
    ELSE 'contest_finalist'
  END as badge_esperado,
  EXISTS(
    SELECT 1
    FROM user_badges ub
    WHERE ub.user_id = s.user_id
      AND ub.badge_id = CASE WHEN s.winner_position = 1 THEN 'contest_winner' ELSE 'contest_finalist' END
      AND ub.metadata->>'contest_id' = (SELECT id::text FROM noviembre_contest)
  ) as tiene_badge_noviembre,
  CASE
    WHEN EXISTS(
      SELECT 1
      FROM user_badges ub
      WHERE ub.user_id = s.user_id
        AND ub.badge_id = CASE WHEN s.winner_position = 1 THEN 'contest_winner' ELSE 'contest_finalist' END
        AND ub.metadata->>'contest_id' = (SELECT id::text FROM noviembre_contest)
    ) THEN '✅ OK'
    ELSE '❌ FALTA'
  END as estado
FROM stories s
JOIN user_profiles up ON s.user_id = up.id
WHERE s.contest_id = (SELECT id FROM noviembre_contest)
  AND s.is_winner = true
ORDER BY s.winner_position;

-- ============================================
-- PASO 4: Verificar badge VETERANO para 1er lugar
-- ============================================
SELECT
  '=== VERIFICACIÓN BADGE VETERANO (1ER LUGAR) ===' as titulo,
  up.display_name,
  up.wins_count as victorias_totales,
  EXISTS(
    SELECT 1
    FROM user_badges
    WHERE user_id = up.id
      AND badge_id = 'contest_winner_veteran'
  ) as tiene_badge_veterano,
  CASE
    WHEN up.wins_count >= 2 AND EXISTS(SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'contest_winner_veteran')
      THEN '✅ CORRECTO'
    WHEN up.wins_count >= 2 AND NOT EXISTS(SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'contest_winner_veteran')
      THEN '❌ FALTA BADGE'
    ELSE '✅ No califica aún (menos de 2 victorias)'
  END as estado
FROM user_profiles up
WHERE EXISTS(
  SELECT 1
  FROM stories s
  WHERE s.user_id = up.id
    AND s.contest_id = 'ff77e982-4c99-48c9-afa2-1f4a07213b74'::uuid
    AND s.is_winner = true
    AND s.winner_position = 1
);
