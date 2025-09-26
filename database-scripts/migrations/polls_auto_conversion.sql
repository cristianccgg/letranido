-- Conversión automática de encuestas a concursos
-- Versión: 1.0
-- Fecha: 2024-09-23

-- Función para convertir automáticamente encuestas cerradas a concursos
CREATE OR REPLACE FUNCTION auto_convert_closed_polls()
RETURNS void AS $$
DECLARE
  poll_record RECORD;
  winning_option RECORD;
  new_contest_id UUID;
  contest_month_name TEXT;
  submission_deadline_date TIMESTAMPTZ;
  voting_deadline_date TIMESTAMPTZ;
BEGIN
  -- Buscar encuestas que necesitan ser convertidas
  FOR poll_record IN 
    SELECT * FROM polls 
    WHERE status = 'closed' 
      AND voting_deadline <= NOW()
      AND converted_contest_id IS NULL
      AND is_active = true
  LOOP
    -- Encontrar la opción ganadora (más votos)
    SELECT po.* INTO winning_option
    FROM poll_options po
    WHERE po.poll_id = poll_record.id
    ORDER BY po.vote_count DESC, po.created_at ASC
    LIMIT 1;
    
    -- Si no hay opción ganadora, saltar esta encuesta
    IF winning_option IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calcular fechas para el concurso
    -- El concurso empezará 1 día después de que termine la encuesta
    submission_deadline_date := poll_record.voting_deadline + INTERVAL '15 days';
    voting_deadline_date := submission_deadline_date + INTERVAL '7 days';
    
    -- Capitalizar primera letra del mes
    contest_month_name := INITCAP(poll_record.target_contest_month);
    
    -- Crear el concurso automáticamente
    INSERT INTO contests (
      title,
      description,
      month,
      category,
      submission_deadline,
      voting_deadline,
      min_words,
      max_words,
      prize,
      status,
      created_at,
      updated_at
    ) VALUES (
      'Concurso ' || poll_record.target_month,
      winning_option.option_text,
      poll_record.target_contest_month,
      'Ficción',
      submission_deadline_date,
      voting_deadline_date,
      100,
      1000,
      'Insignia de Oro + Destacado del mes',
      'submission',
      NOW(),
      NOW()
    ) RETURNING id INTO new_contest_id;
    
    -- Actualizar la encuesta para marcarla como convertida
    UPDATE polls SET
      status = 'converted',
      winning_option_id = winning_option.id,
      converted_contest_id = new_contest_id,
      converted_at = NOW(),
      updated_at = NOW()
    WHERE id = poll_record.id;
    
    -- Log de la conversión
    RAISE NOTICE 'Poll % converted to contest % with winning option: %', 
      poll_record.id, new_contest_id, winning_option.option_title;
      
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función trigger que se ejecuta cuando se actualiza una encuesta
CREATE OR REPLACE FUNCTION trigger_auto_convert_poll()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si la encuesta cambió a cerrada o si pasó la fecha límite
  IF (NEW.status = 'closed' OR NEW.voting_deadline <= NOW()) 
     AND OLD.converted_contest_id IS NULL 
     AND NEW.converted_contest_id IS NULL
     AND NEW.is_active = true THEN
    
    -- Cambiar status a closed si pasó la fecha límite
    IF NEW.voting_deadline <= NOW() AND NEW.status = 'active' THEN
      NEW.status := 'closed';
    END IF;
    
    -- Ejecutar conversión automática en segundo plano
    PERFORM auto_convert_closed_polls();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta después de UPDATE en la tabla polls
DROP TRIGGER IF EXISTS trigger_poll_conversion ON polls;
CREATE TRIGGER trigger_poll_conversion
  AFTER UPDATE ON polls
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_auto_convert_poll();

-- Función para ejecutar conversión manual (para admins)
CREATE OR REPLACE FUNCTION manually_convert_poll(poll_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  poll_record RECORD;
  winning_option RECORD;
  new_contest_id UUID;
  contest_month_name TEXT;
  submission_deadline_date TIMESTAMPTZ;
  voting_deadline_date TIMESTAMPTZ;
BEGIN
  -- Verificar que la encuesta existe y puede ser convertida
  SELECT * INTO poll_record FROM polls WHERE id = poll_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Encuesta no encontrada');
  END IF;
  
  IF poll_record.converted_contest_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Encuesta ya fue convertida');
  END IF;
  
  IF poll_record.status = 'active' AND poll_record.voting_deadline > NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Encuesta aún está activa');
  END IF;
  
  -- Encontrar la opción ganadora
  SELECT po.* INTO winning_option
  FROM poll_options po
  WHERE po.poll_id = poll_uuid
  ORDER BY po.vote_count DESC, po.created_at ASC
  LIMIT 1;
  
  IF winning_option IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No hay opciones para convertir');
  END IF;
  
  -- Calcular fechas para el concurso
  submission_deadline_date := GREATEST(poll_record.voting_deadline + INTERVAL '1 day', NOW() + INTERVAL '1 day') + INTERVAL '14 days';
  voting_deadline_date := submission_deadline_date + INTERVAL '7 days';
  
  contest_month_name := INITCAP(poll_record.target_contest_month);
  
  -- Crear el concurso
  INSERT INTO contests (
    title,
    description,
    month,
    category,
    submission_deadline,
    voting_deadline,
    min_words,
    max_words,
    prize,
    status,
    created_at,
    updated_at
  ) VALUES (
    'Concurso ' || poll_record.target_month,
    winning_option.option_text,
    poll_record.target_contest_month,
    'Ficción',
    submission_deadline_date,
    voting_deadline_date,
    100,
    1000,
    'Insignia de Oro + Destacado del mes',
    'submission',
    NOW(),
    NOW()
  ) RETURNING id INTO new_contest_id;
  
  -- Actualizar la encuesta
  UPDATE polls SET
    status = 'converted',
    winning_option_id = winning_option.id,
    converted_contest_id = new_contest_id,
    converted_at = NOW(),
    updated_at = NOW()
  WHERE id = poll_uuid;
  
  -- Retornar resultado exitoso
  RETURN jsonb_build_object(
    'success', true,
    'contest_id', new_contest_id,
    'winning_option', jsonb_build_object(
      'id', winning_option.id,
      'title', winning_option.option_title,
      'text', winning_option.option_text,
      'votes', winning_option.vote_count
    ),
    'message', 'Encuesta convertida exitosamente a concurso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error interno: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función que se puede ejecutar periódicamente para convertir encuestas vencidas
-- (útil si el trigger falla o para procesamiento batch)
CREATE OR REPLACE FUNCTION process_expired_polls()
RETURNS TABLE(
  poll_id UUID,
  contest_id UUID,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  poll_record RECORD;
  conversion_result JSONB;
BEGIN
  FOR poll_record IN 
    SELECT p.id FROM polls p
    WHERE p.voting_deadline <= NOW()
      AND p.status = 'active'
      AND p.converted_contest_id IS NULL
      AND p.is_active = true
  LOOP
    -- Cerrar la encuesta primero
    UPDATE polls SET 
      status = 'closed',
      updated_at = NOW()
    WHERE id = poll_record.id;
    
    -- Intentar convertir
    SELECT manually_convert_poll(poll_record.id) INTO conversion_result;
    
    RETURN QUERY SELECT 
      poll_record.id,
      CASE WHEN conversion_result->>'success' = 'true' 
           THEN (conversion_result->>'contest_id')::UUID 
           ELSE NULL 
      END,
      CASE WHEN conversion_result->>'success' = 'true' 
           THEN 'converted' 
           ELSE 'error' 
      END,
      COALESCE(conversion_result->>'message', conversion_result->>'error');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON FUNCTION auto_convert_closed_polls() IS 'Convierte automáticamente encuestas cerradas a concursos';
COMMENT ON FUNCTION trigger_auto_convert_poll() IS 'Trigger que detecta cuando una encuesta debe ser convertida';
COMMENT ON FUNCTION manually_convert_poll(UUID) IS 'Convierte manualmente una encuesta específica a concurso';
COMMENT ON FUNCTION process_expired_polls() IS 'Procesa encuestas expiradas en lote (para jobs programados)';

-- Crear índice para optimizar la búsqueda de encuestas a convertir
CREATE INDEX IF NOT EXISTS idx_polls_conversion_pending 
ON polls(voting_deadline, status, converted_contest_id, is_active) 
WHERE converted_contest_id IS NULL AND is_active = true;

-- ========== FUNCIONES INTEGRADAS PARA EL NUEVO SISTEMA ==========

-- Función mejorada para convertir automáticamente concursos con encuestas
CREATE OR REPLACE FUNCTION auto_convert_contest_polls()
RETURNS void AS $$
DECLARE
  contest_record RECORD;
  poll_record RECORD;
  conversion_result JSONB;
BEGIN
  -- Buscar concursos en estado 'poll' cuya encuesta haya expirado
  FOR contest_record IN 
    SELECT * FROM contests 
    WHERE status = 'poll' 
      AND poll_enabled = true
      AND poll_deadline <= NOW()
  LOOP
    -- Buscar la encuesta asociada al concurso
    SELECT * INTO poll_record
    FROM polls 
    WHERE contest_id = contest_record.id
      AND status = 'active';
    
    -- Si no hay encuesta asociada, saltar
    IF poll_record IS NULL THEN
      RAISE NOTICE 'No se encontró encuesta activa para concurso %', contest_record.id;
      CONTINUE;
    END IF;
    
    -- Convertir la encuesta usando la función integrada
    SELECT convert_poll_to_active_contest(poll_record.id) INTO conversion_result;
    
    -- Verificar si la conversión fue exitosa
    IF conversion_result->>'success' = 'true' THEN
      RAISE NOTICE 'Concurso % convertido exitosamente. Prompt ganador: %', 
        contest_record.id, conversion_result->>'winning_prompt';
    ELSE
      RAISE WARNING 'Error convirtiendo concurso %: %', 
        contest_record.id, conversion_result->>'error';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger adicional en la tabla contests para verificar encuestas expiradas
CREATE OR REPLACE FUNCTION trigger_contest_poll_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el concurso está en estado poll y la fecha límite ya pasó
  IF NEW.status = 'poll' AND NEW.poll_deadline <= NOW() THEN
    -- Ejecutar conversión de concursos con encuestas
    PERFORM auto_convert_contest_polls();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en contests
DROP TRIGGER IF EXISTS contest_poll_check_trigger ON contests;
CREATE TRIGGER contest_poll_check_trigger
  AFTER UPDATE ON contests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_contest_poll_check();

-- Función mejorada para procesar encuestas expiradas (incluye sistema integrado)
CREATE OR REPLACE FUNCTION process_all_expired_polls()
RETURNS TABLE(
  poll_id UUID,
  contest_id UUID,
  winning_prompt TEXT,
  status TEXT,
  conversion_type TEXT
) AS $$
BEGIN
  -- Primero cerrar encuestas expiradas
  PERFORM auto_close_expired_polls();
  
  -- Convertir concursos con encuestas (sistema integrado)
  PERFORM auto_convert_contest_polls();
  
  -- Convertir encuestas legacy independientes
  PERFORM auto_convert_closed_polls();
  
  -- Retornar información de encuestas convertidas recientemente
  RETURN QUERY
  SELECT 
    p.id as poll_id,
    COALESCE(p.converted_contest_id, p.contest_id) as contest_id,
    po.option_text as winning_prompt,
    p.status::TEXT,
    CASE 
      WHEN p.contest_id IS NOT NULL THEN 'integrated'
      ELSE 'legacy'
    END as conversion_type
  FROM polls p
  LEFT JOIN poll_options po ON p.winning_option_id = po.id
  WHERE (p.converted_at >= NOW() - INTERVAL '1 day') OR 
        (p.status = 'converted' AND p.updated_at >= NOW() - INTERVAL '1 day')
  ORDER BY COALESCE(p.converted_at, p.updated_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para las nuevas funciones
COMMENT ON FUNCTION auto_convert_contest_polls() IS 'Convierte automáticamente concursos en estado poll cuando su encuesta expira';
COMMENT ON FUNCTION trigger_contest_poll_check() IS 'Trigger que verifica si concursos con encuestas deben ser convertidos';
COMMENT ON FUNCTION process_all_expired_polls() IS 'Procesa todas las encuestas expiradas (tanto integradas como legacy)';