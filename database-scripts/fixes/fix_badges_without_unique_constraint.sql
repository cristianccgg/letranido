-- Fix completo del sistema de badges SIN constraint UNIQUE
-- Problema: El constraint UNIQUE(user_id, badge_id) no permite múltiples badges de concursos
-- Solución: Usar lógica diferente para badges únicos vs badges repetibles
-- Fecha: Diciembre 21, 2024
--
-- ⚠️ ADVERTENCIA: Este script contiene un bug de ambigüedad SQL
-- Bug: Variable local `badge_id` tiene mismo nombre que columna de tabla
-- Resultado: award_specific_badge() NO funcionó correctamente desde este fix
-- Corregido en: fix_award_specific_badge_ambiguity.sql (Enero 4, 2026)
-- NO EJECUTAR ESTE SCRIPT - Usar fix_award_specific_badge_ambiguity.sql en su lugar

-- PASO 1: Recrear check_and_award_badges sin ON CONFLICT
DROP FUNCTION IF EXISTS check_and_award_badges(UUID);

CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  story_count INTEGER;
  contest_wins INTEGER;
  new_badges JSONB := '[]'::JSONB;
  badge_record RECORD;
  badge_exists BOOLEAN;
BEGIN
  -- Obtener estadísticas del usuario
  SELECT COUNT(*) INTO story_count
  FROM public.stories
  WHERE user_id = target_user_id AND published_at IS NOT NULL;

  -- Contar solo victorias en PRIMER lugar (winner_position = 1)
  SELECT COUNT(*) INTO contest_wins
  FROM public.stories
  WHERE user_id = target_user_id
    AND is_winner = true
    AND winner_position = 1;

  -- Verificar badges de conteo de historias (ÚNICOS - solo uno por usuario)
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'story_count'
  LOOP
    IF story_count >= (badge_record.criteria->>'threshold')::INTEGER THEN
      -- Verificar si el usuario ya tiene este badge
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      -- Solo insertar si NO existe
      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  -- Verificar badges de victorias en concursos (ÚNICOS - solo uno por usuario)
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'contest_wins'
  LOOP
    IF contest_wins >= (badge_record.criteria->>'threshold')::INTEGER THEN
      -- Verificar si el usuario ya tiene este badge
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      -- Solo insertar si NO existe
      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  RETURN new_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Recrear award_specific_badge para badges de concursos (REPETIBLES)
DROP FUNCTION IF EXISTS award_specific_badge(UUID, VARCHAR, UUID);

CREATE OR REPLACE FUNCTION award_specific_badge(target_user_id UUID, badge_type VARCHAR, contest_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  badge_id VARCHAR;
  badge_exists BOOLEAN;
BEGIN
  -- Determinar qué badge otorgar
  CASE badge_type
    WHEN 'contest_winner' THEN
      badge_id := 'contest_winner';
    WHEN 'contest_finalist' THEN
      badge_id := 'contest_finalist';
    WHEN 'contest_winner_veteran' THEN
      badge_id := 'contest_winner_veteran';
    WHEN 'contest_winner_legend' THEN
      badge_id := 'contest_winner_legend';
    ELSE
      RETURN false;
  END CASE;

  -- Para badges de concursos individuales (contest_winner, contest_finalist):
  -- Verificar si ya existe para ESTE concurso específico
  IF badge_type IN ('contest_winner', 'contest_finalist') AND contest_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_badges
      WHERE user_id = target_user_id
        AND badge_id = badge_id
        AND metadata->>'contest_id' = contest_id::text
    ) INTO badge_exists;

    -- Solo insertar si NO existe para este concurso
    IF NOT badge_exists THEN
      INSERT INTO public.user_badges (user_id, badge_id, metadata)
      VALUES (target_user_id, badge_id, jsonb_build_object('contest_id', contest_id));
      RETURN true;
    END IF;

    RETURN false;
  END IF;

  -- Para badges únicos (veteran, legend): verificar si ya existe SIN contest_id
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges
    WHERE user_id = target_user_id AND badge_id = badge_id
  ) INTO badge_exists;

  IF NOT badge_exists THEN
    INSERT INTO public.user_badges (user_id, badge_id, metadata)
    VALUES (target_user_id, badge_id,
      CASE WHEN contest_id IS NOT NULL THEN
        jsonb_build_object('contest_id', contest_id)
      ELSE
        '{}'::jsonb
      END);
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Función helper para asignar badges manualmente
CREATE OR REPLACE FUNCTION assign_badge_manual(target_user_id UUID, target_badge_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  badge_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges
    WHERE user_id = target_user_id AND badge_id = target_badge_id
  ) INTO badge_exists;

  -- Solo insertar si NO existe
  IF NOT badge_exists THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (target_user_id, target_badge_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Comentarios actualizados
COMMENT ON FUNCTION check_and_award_badges IS 'Verifica y otorga badges automáticos (story_count, contest_wins). NO usa UNIQUE constraint. Retorna JSONB.';
COMMENT ON FUNCTION award_specific_badge IS 'Otorga badges de concursos (pueden repetirse por contest_id). Incluye veteran/legend (únicos).';
COMMENT ON FUNCTION assign_badge_manual IS 'Función helper para asignar badges manualmente (bypassa RLS).';

-- PASO 5: Asignar badge "Primera Pluma" a Jorge Torrealta
SELECT assign_badge_manual('6ba81384-7ee1-4611-adcd-ac202c9b9f8e'::uuid, 'first_story');

-- PASO 6: Verificar que se asignó correctamente
SELECT
  up.display_name,
  bd.name as badge_name,
  ub.earned_at
FROM public.user_badges ub
JOIN public.user_profiles up ON ub.user_id = up.id
JOIN public.badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id = '6ba81384-7ee1-4611-adcd-ac202c9b9f8e'
ORDER BY ub.earned_at DESC;
