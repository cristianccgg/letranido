-- FIX: Ambigüedad en award_specific_badge
-- Problema: Variables locales tienen mismo nombre que columnas de tabla
-- Solución: Renombrar variables locales para evitar conflicto
-- Fecha: Enero 4, 2026

DROP FUNCTION IF EXISTS award_specific_badge(UUID, VARCHAR, UUID);

CREATE OR REPLACE FUNCTION award_specific_badge(target_user_id UUID, badge_type VARCHAR, contest_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge_id VARCHAR;  -- ✅ Renombrado: v_ prefix para evitar ambigüedad
  badge_exists BOOLEAN;
BEGIN
  -- Determinar qué badge otorgar
  CASE badge_type
    WHEN 'contest_winner' THEN
      v_badge_id := 'contest_winner';
    WHEN 'contest_finalist' THEN
      v_badge_id := 'contest_finalist';
    WHEN 'contest_winner_veteran' THEN
      v_badge_id := 'contest_winner_veteran';
    WHEN 'contest_winner_legend' THEN
      v_badge_id := 'contest_winner_legend';
    ELSE
      RETURN false;
  END CASE;

  -- Para badges de concursos individuales (contest_winner, contest_finalist):
  -- Verificar si ya existe para ESTE concurso específico
  IF badge_type IN ('contest_winner', 'contest_finalist') AND contest_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_badges
      WHERE user_id = target_user_id
        AND badge_id = v_badge_id  -- ✅ Ahora sin ambigüedad
        AND metadata->>'contest_id' = contest_id::text
    ) INTO badge_exists;

    -- Solo insertar si NO existe para este concurso
    IF NOT badge_exists THEN
      INSERT INTO public.user_badges (user_id, badge_id, metadata)
      VALUES (target_user_id, v_badge_id, jsonb_build_object('contest_id', contest_id));
      RETURN true;
    END IF;

    RETURN false;
  END IF;

  -- Para badges únicos (veteran, legend): verificar si ya existe SIN contest_id
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges
    WHERE user_id = target_user_id AND badge_id = v_badge_id  -- ✅ Sin ambigüedad
  ) INTO badge_exists;

  IF NOT badge_exists THEN
    INSERT INTO public.user_badges (user_id, badge_id, metadata)
    VALUES (target_user_id, v_badge_id,
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

COMMENT ON FUNCTION award_specific_badge IS 'Otorga badges de concursos (pueden repetirse por contest_id). Incluye veteran/legend (únicos). Variables con prefijo v_ para evitar ambigüedad.';
