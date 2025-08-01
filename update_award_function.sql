-- Actualizar función award_specific_badge para incluir contest_winner_veteran
-- EJECUTAR ESTE SQL EN SUPABASE ANTES DE USAR EL FIX DE BADGES

CREATE OR REPLACE FUNCTION award_specific_badge(target_user_id UUID, badge_type VARCHAR, contest_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  target_badge_id VARCHAR;
BEGIN
  -- Determinar qué badge otorgar basado en el tipo
  CASE badge_type
    WHEN 'contest_winner' THEN
      target_badge_id := 'contest_winner';
    WHEN 'contest_finalist' THEN
      target_badge_id := 'contest_finalist';
    WHEN 'contest_winner_veteran' THEN
      target_badge_id := 'contest_winner_veteran';
    ELSE
      RETURN false;
  END CASE;
  
  -- Insertar el badge
  INSERT INTO public.user_badges (user_id, badge_id, metadata)
  VALUES (target_user_id, target_badge_id, 
    CASE WHEN contest_id IS NOT NULL THEN 
      jsonb_build_object('contest_id', contest_id)
    ELSE 
      '{}'::jsonb 
    END)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;