-- Función RPC para obtener conteos reales de votos sin restricciones RLS
-- Esta función ejecuta como administrador para poder contar todos los votos

CREATE OR REPLACE FUNCTION get_poll_real_counts(poll_uuid UUID)
RETURNS JSONB
SECURITY DEFINER  -- Ejecuta con permisos de administrador
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  poll_data RECORD;
  option_data RECORD;
  options_array JSONB := '[]'::jsonb;
  total_count INTEGER := 0;
BEGIN
  -- Obtener datos básicos del poll
  SELECT id, title, description, target_month, target_contest_month, 
         voting_deadline, status, created_at
  INTO poll_data
  FROM polls 
  WHERE id = poll_uuid 
    AND status = 'active' 
    AND voting_deadline > NOW();
    
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Contar total de votos para este poll (sin RLS)
  SELECT COUNT(*) INTO total_count
  FROM poll_votes 
  WHERE poll_id = poll_uuid;
  
  -- Obtener opciones con conteos reales
  FOR option_data IN 
    SELECT po.id, po.option_title, po.option_description, 
           po.option_text, po.display_order,
           (SELECT COUNT(*) FROM poll_votes pv WHERE pv.option_id = po.id) as real_count
    FROM poll_options po 
    WHERE po.poll_id = poll_uuid 
    ORDER BY po.display_order
  LOOP
    options_array := options_array || jsonb_build_object(
      'id', option_data.id,
      'option_title', option_data.option_title,
      'option_description', option_data.option_description,
      'option_text', option_data.option_text,
      'vote_count', option_data.real_count,
      'display_order', option_data.display_order
    );
  END LOOP;
  
  -- Construir resultado
  result := jsonb_build_object(
    'id', poll_data.id,
    'title', poll_data.title,
    'description', poll_data.description,
    'target_month', poll_data.target_month,
    'target_contest_month', poll_data.target_contest_month,
    'voting_deadline', poll_data.voting_deadline,
    'status', poll_data.status,
    'created_at', poll_data.created_at,
    'total_votes', total_count,
    'options', options_array
  );
  
  RETURN result;
END;
$$;

-- Función para obtener el poll activo con conteos reales
CREATE OR REPLACE FUNCTION get_active_poll_with_real_counts()
RETURNS JSONB
SECURITY DEFINER  -- Ejecuta con permisos de administrador
LANGUAGE plpgsql
AS $$
DECLARE
  active_poll_id UUID;
  result JSONB;
BEGIN
  -- Encontrar poll activo
  SELECT id INTO active_poll_id
  FROM polls 
  WHERE status = 'active' 
    AND voting_deadline > NOW()
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF active_poll_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Obtener datos con conteos reales
  SELECT get_poll_real_counts(active_poll_id) INTO result;
  
  RETURN result;
END;
$$;

-- Dar permisos a usuarios autenticados para ejecutar estas funciones
GRANT EXECUTE ON FUNCTION get_poll_real_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_poll_with_real_counts() TO authenticated;