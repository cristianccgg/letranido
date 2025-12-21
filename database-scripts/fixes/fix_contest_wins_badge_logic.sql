-- Fix para el badge "Ganador Veterano" (contest_winner_veteran)
-- Problema: Se otorgaba a usuarios con 2+ finalistas, cuando debería ser solo para 2+ VICTORIAS (primer lugar)
-- Fecha: Diciembre 2024

-- PASO 1: Revisar función actual y el problema
-- La función check_and_award_badges cuenta TODAS las historias con is_winner=true
-- Pero is_winner=true se marca para 1er, 2do y 3er lugar
-- El badge "Ganador Veterano" debería ser solo para 2+ victorias en PRIMER lugar

-- PASO 2: Actualizar la función check_and_award_badges
-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS check_and_award_badges(UUID);

-- Crear la nueva versión corregida
CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  story_count INTEGER;
  contest_wins INTEGER; -- Solo primer lugar (winner_position = 1)
  new_badges JSON := '[]'::JSON;
  badge_record RECORD;
BEGIN
  -- Obtener estadísticas del usuario
  SELECT COUNT(*) INTO story_count
  FROM public.stories
  WHERE user_id = target_user_id AND published_at IS NOT NULL;

  -- ✅ FIX: Contar solo victorias en PRIMER lugar (winner_position = 1)
  -- Antes contaba: WHERE is_winner = true (incluía 1º, 2º y 3º lugar)
  -- Ahora cuenta: WHERE is_winner = true AND winner_position = 1
  SELECT COUNT(*) INTO contest_wins
  FROM public.stories
  WHERE user_id = target_user_id
    AND is_winner = true
    AND winner_position = 1; -- ✅ CAMBIO CRÍTICO

  -- Verificar badges de conteo de historias
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'story_count'
  LOOP
    IF story_count >= (badge_record.criteria->>'threshold')::INTEGER THEN
      -- Intentar insertar el badge (si ya existe, será ignorado por UNIQUE constraint)
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (target_user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;

      -- Si fue insertado, agregarlo a la respuesta
      IF FOUND THEN
        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  -- Verificar badges de victorias en concursos
  -- ✅ Ahora contest_wins solo cuenta victorias en 1er lugar
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'contest_wins'
  LOOP
    IF contest_wins >= (badge_record.criteria->>'threshold')::INTEGER THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (target_user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;

      IF FOUND THEN
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

-- PASO 3: Actualizar también award_specific_badge para incluir el caso de veterano
-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS award_specific_badge(UUID, VARCHAR, UUID);

-- Crear la nueva versión con soporte para veterano y leyenda
CREATE OR REPLACE FUNCTION award_specific_badge(target_user_id UUID, badge_type VARCHAR, contest_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  badge_id VARCHAR;
BEGIN
  -- Determinar qué badge otorgar basado en el tipo
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

  -- Insertar el badge
  INSERT INTO public.user_badges (user_id, badge_id, metadata)
  VALUES (target_user_id, badge_id,
    CASE WHEN contest_id IS NOT NULL THEN
      jsonb_build_object('contest_id', contest_id)
    ELSE
      '{}'::jsonb
    END)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Limpiar badges de "Ganador Veterano" asignados incorrectamente
-- Eliminar badges de usuarios que NO tienen 2+ victorias en primer lugar
DELETE FROM public.user_badges
WHERE badge_id = 'contest_winner_veteran'
  AND user_id NOT IN (
    -- Solo mantener el badge para usuarios con 2+ primeros lugares
    SELECT user_id
    FROM public.stories
    WHERE is_winner = true AND winner_position = 1
    GROUP BY user_id
    HAVING COUNT(*) >= 2
  );

-- PASO 5: Verificación - Listar usuarios con badge "Ganador Veterano" y sus victorias
SELECT
  up.display_name,
  up.email,
  COUNT(s.id) as first_place_wins,
  ub.earned_at
FROM public.user_badges ub
JOIN public.user_profiles up ON ub.user_id = up.id
LEFT JOIN public.stories s ON s.user_id = up.id
  AND s.is_winner = true
  AND s.winner_position = 1
WHERE ub.badge_id = 'contest_winner_veteran'
GROUP BY up.id, up.display_name, up.email, ub.earned_at
ORDER BY first_place_wins DESC;

-- PASO 6: Comentarios actualizados
COMMENT ON FUNCTION check_and_award_badges IS 'Verifica y otorga automáticamente badges. Contest_wins solo cuenta victorias en PRIMER lugar (winner_position=1)';
COMMENT ON FUNCTION award_specific_badge IS 'Otorga un badge específico a un usuario. Incluye support para contest_winner_veteran y contest_winner_legend';
