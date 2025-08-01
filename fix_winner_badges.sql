-- Script para asignar badges faltantes a los ganadores del concurso cerrado
-- Ejecutar este script para corregir los badges no asignados

-- 1. Primero, actualizar la función award_specific_badge para incluir contest_winner_veteran
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
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Obtener el concurso cerrado más reciente y sus ganadores
DO $$
DECLARE
    closed_contest_id UUID;
    winner_record RECORD;
    position_counter INT := 1;
BEGIN
    -- Encontrar el concurso cerrado más reciente
    SELECT id INTO closed_contest_id 
    FROM contests 
    WHERE status = 'results' 
    ORDER BY finalized_at DESC 
    LIMIT 1;
    
    IF closed_contest_id IS NULL THEN
        RAISE NOTICE 'No se encontró ningún concurso cerrado';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Procesando concurso cerrado: %', closed_contest_id;
    
    -- Obtener ganadores ordenados por likes_count
    FOR winner_record IN
        SELECT s.user_id, s.title, s.likes_count, up.display_name, up.wins_count
        FROM stories s
        JOIN user_profiles up ON s.user_id = up.id
        WHERE s.contest_id = closed_contest_id
        AND s.is_winner = true
        ORDER BY s.likes_count DESC
    LOOP
        RAISE NOTICE 'Procesando ganador posición %: % (%)', position_counter, winner_record.display_name, winner_record.title;
        
        -- Asignar badge según posición
        IF position_counter = 1 THEN
            -- Primer lugar: contest_winner
            PERFORM award_specific_badge(winner_record.user_id, 'contest_winner', closed_contest_id);
            RAISE NOTICE '✅ Badge contest_winner asignado a %', winner_record.display_name;
        ELSE
            -- Segundo y tercer lugar: contest_finalist
            PERFORM award_specific_badge(winner_record.user_id, 'contest_finalist', closed_contest_id);
            RAISE NOTICE '✅ Badge contest_finalist asignado a %', winner_record.display_name;
        END IF;
        
        -- Badge veterano si tiene 2+ victorias
        IF winner_record.wins_count >= 2 THEN
            PERFORM award_specific_badge(winner_record.user_id, 'contest_winner_veteran', closed_contest_id);
            RAISE NOTICE '🏆 Badge contest_winner_veteran asignado a %', winner_record.display_name;
        END IF;
        
        position_counter := position_counter + 1;
        
        -- Solo procesar top 3
        EXIT WHEN position_counter > 3;
    END LOOP;
    
    RAISE NOTICE '✅ Badges asignados correctamente para el concurso %', closed_contest_id;
END $$;

-- 3. Verificar que los badges se asignaron correctamente
SELECT 
    up.display_name,
    up.wins_count,
    bd.name as badge_name,
    bd.description,
    ub.earned_at,
    ub.metadata
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_id = bd.id
JOIN user_profiles up ON ub.user_id = up.id
WHERE bd.id IN ('contest_winner', 'contest_finalist', 'contest_winner_veteran')
ORDER BY up.display_name, bd.id;