-- Fix para type mismatch en check_and_award_badges
-- Problema: La función declara new_badges como JSON pero usa jsonb_build_object
-- Esto causa errores silenciosos y badges no se asignan
-- Fecha: Diciembre 21, 2024

-- Eliminar función existente
DROP FUNCTION IF EXISTS check_and_award_badges(UUID);

-- Recrear con JSONB (no JSON) para consistencia
CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  story_count INTEGER;
  contest_wins INTEGER; -- Solo primer lugar (winner_position = 1)
  new_badges JSONB := '[]'::JSONB;  -- ✅ Cambiado a JSONB
  badge_record RECORD;
BEGIN
  -- Obtener estadísticas del usuario
  SELECT COUNT(*) INTO story_count
  FROM public.stories
  WHERE user_id = target_user_id AND published_at IS NOT NULL;

  -- ✅ FIX: Contar solo victorias en PRIMER lugar (winner_position = 1)
  SELECT COUNT(*) INTO contest_wins
  FROM public.stories
  WHERE user_id = target_user_id
    AND is_winner = true
    AND winner_position = 1;

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

-- Verificar que la función funciona correctamente
-- Probar con un usuario de ejemplo (reemplazar con ID real)
-- SELECT check_and_award_badges('USER_ID_HERE'::uuid);

COMMENT ON FUNCTION check_and_award_badges IS 'Verifica y otorga automáticamente badges. Contest_wins solo cuenta victorias en PRIMER lugar (winner_position=1). Retorna JSONB con badges otorgados.';
