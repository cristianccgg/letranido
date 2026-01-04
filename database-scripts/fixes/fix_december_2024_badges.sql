-- FIX BADGES DE DICIEMBRE 2025
-- Problema: Los badges NO se asignaron automáticamente
-- Causa raíz: Bug de ambigüedad SQL en award_specific_badge() desde Dic 21, 2024
--             Variable local `badge_id` tenía mismo nombre que columna de tabla
-- Solución: Primero ejecutar fix_award_specific_badge_ambiguity.sql, luego este script
-- Fecha: Enero 4, 2026
-- Ejecutar en: Supabase SQL Editor
-- Contest ID: 0388fb71-a211-4f75-b020-dfd220fb4a33 (Diciembre 2025)

-- ============================================
-- PASO 1: Identificar el concurso de Diciembre 2025
-- ============================================
DO $$
DECLARE
  diciembre_id UUID := '0388fb71-a211-4f75-b020-dfd220fb4a33'; -- ID del concurso de Diciembre 2025
  ganador_record RECORD;
  badge_asignado BOOLEAN;
BEGIN
  RAISE NOTICE '📅 Usando concurso de Diciembre 2025 ID: %', diciembre_id;

  -- ============================================
  -- PASO 2: Asignar badges a TODOS los ganadores
  -- ============================================
  FOR ganador_record IN
    SELECT
      s.user_id,
      s.winner_position,
      up.display_name,
      up.wins_count
    FROM stories s
    JOIN user_profiles up ON s.user_id = up.id
    WHERE s.contest_id = diciembre_id
      AND s.is_winner = true
    ORDER BY s.winner_position
  LOOP
    RAISE NOTICE '---';
    RAISE NOTICE '👤 Procesando: % (posición %)', ganador_record.display_name, ganador_record.winner_position;

    -- Asignar badge de ganador/finalista
    IF ganador_record.winner_position = 1 THEN
      -- Badge de ganador (1er lugar)
      SELECT award_specific_badge(
        ganador_record.user_id,
        'contest_winner',
        diciembre_id
      ) INTO badge_asignado;

      IF badge_asignado THEN
        RAISE NOTICE '✅ Badge GANADOR asignado a %', ganador_record.display_name;
      ELSE
        RAISE NOTICE 'ℹ️ Badge GANADOR ya existía para %', ganador_record.display_name;
      END IF;

      -- Verificar si califica para VETERANO (2+ victorias)
      IF ganador_record.wins_count >= 2 THEN
        SELECT award_specific_badge(
          ganador_record.user_id,
          'contest_winner_veteran',
          diciembre_id
        ) INTO badge_asignado;

        IF badge_asignado THEN
          RAISE NOTICE '🏆 Badge VETERANO asignado a % (% victorias)', ganador_record.display_name, ganador_record.wins_count;
        ELSE
          RAISE NOTICE 'ℹ️ Badge VETERANO ya existía para %', ganador_record.display_name;
        END IF;
      ELSE
        RAISE NOTICE 'ℹ️ % no califica para veterano (% victoria/s)', ganador_record.display_name, ganador_record.wins_count;
      END IF;

      -- Verificar si califica para LEYENDA (5+ victorias)
      IF ganador_record.wins_count >= 5 THEN
        SELECT award_specific_badge(
          ganador_record.user_id,
          'contest_winner_legend',
          diciembre_id
        ) INTO badge_asignado;

        IF badge_asignado THEN
          RAISE NOTICE '👑 Badge LEYENDA asignado a % (% victorias)', ganador_record.display_name, ganador_record.wins_count;
        ELSE
          RAISE NOTICE 'ℹ️ Badge LEYENDA ya existía para %', ganador_record.display_name;
        END IF;
      END IF;

    ELSE
      -- Badge de finalista (2º o 3º lugar)
      SELECT award_specific_badge(
        ganador_record.user_id,
        'contest_finalist',
        diciembre_id
      ) INTO badge_asignado;

      IF badge_asignado THEN
        RAISE NOTICE '🥈 Badge FINALISTA asignado a %', ganador_record.display_name;
      ELSE
        RAISE NOTICE 'ℹ️ Badge FINALISTA ya existía para %', ganador_record.display_name;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '---';
  RAISE NOTICE '✅ Proceso completado';

END $$;

-- ============================================
-- PASO 3: VERIFICAR que se asignaron correctamente
-- ============================================
WITH diciembre_contest AS (
  SELECT '0388fb71-a211-4f75-b020-dfd220fb4a33'::uuid as id
)
SELECT
  '=== BADGES ASIGNADOS A GANADORES DE DICIEMBRE ===' as titulo,
  up.display_name,
  s.winner_position,
  bd.name as badge_name,
  ub.earned_at,
  ub.metadata->>'contest_id' = (SELECT id::text FROM diciembre_contest) as es_de_diciembre
FROM stories s
JOIN user_profiles up ON s.user_id = up.id
LEFT JOIN user_badges ub ON ub.user_id = s.user_id
LEFT JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE s.contest_id = (SELECT id FROM diciembre_contest)
  AND s.is_winner = true
ORDER BY s.winner_position, bd.name;

-- ============================================
-- PASO 4: Verificar badge VETERANO específicamente
-- ============================================
SELECT
  '=== VERIFICACIÓN BADGE VETERANO ===' as titulo,
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
    ELSE '✅ No califica aún'
  END as estado
FROM user_profiles up
WHERE EXISTS(
  SELECT 1
  FROM stories s
  WHERE s.user_id = up.id
    AND s.contest_id = '0388fb71-a211-4f75-b020-dfd220fb4a33'::uuid
    AND s.is_winner = true
    AND s.winner_position = 1
);
