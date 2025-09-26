-- Integración de encuestas al sistema de concursos
-- Versión: 1.0
-- Fecha: 2025-09-25
-- Descripción: Agrega campos necesarios para integrar encuestas directamente en el sistema de concursos

-- Agregar campos relacionados con encuestas a la tabla contests
ALTER TABLE contests
  ADD COLUMN poll_enabled BOOLEAN DEFAULT false,
  ADD COLUMN poll_deadline TIMESTAMPTZ NULL,
  ADD COLUMN poll_converted_from UUID REFERENCES polls(id) NULL,
  ADD COLUMN original_description TEXT NULL; -- Para guardar descripción original antes de poner prompt ganador

-- Agregar campo contest_id a la tabla polls para conectar con concursos
ALTER TABLE polls
  ADD COLUMN contest_id UUID REFERENCES contests(id) NULL;

-- Modificar los valores posibles de status en contests para incluir 'poll'
-- Nota: PostgreSQL no tiene ALTER TYPE para enum, pero como usamos VARCHAR podemos insertar directamente

-- Comentario sobre estados de concursos:
-- 'poll' - Concurso creado con encuesta, esperando resultados de votación
-- 'submission' - Período de envío de historias abierto
-- 'voting' - Período de votación abierto
-- 'results' - Concurso finalizado con ganadores

-- Índices para optimizar consultas
CREATE INDEX idx_contests_poll_enabled ON contests(poll_enabled);
CREATE INDEX idx_contests_poll_deadline ON contests(poll_deadline);
CREATE INDEX idx_contests_status_poll ON contests(status) WHERE status = 'poll';
CREATE INDEX idx_polls_contest_id ON polls(contest_id);

-- Función para crear concurso con encuesta integrada
CREATE OR REPLACE FUNCTION create_contest_with_poll(
  contest_title TEXT,
  contest_description TEXT,
  contest_category TEXT DEFAULT 'Ficción',
  contest_month TEXT,
  min_words INTEGER DEFAULT 100,
  max_words INTEGER DEFAULT 1000,
  submission_deadline TIMESTAMPTZ,
  voting_deadline TIMESTAMPTZ,
  prize TEXT DEFAULT 'Insignia de Oro + Destacado del mes',
  -- Parámetros específicos de la encuesta
  poll_title TEXT,
  poll_description TEXT,
  poll_deadline TIMESTAMPTZ,
  poll_options JSONB -- Array de objetos: [{"title": "...", "description": "...", "text": "..."}]
) RETURNS JSONB AS $$
DECLARE
  new_contest_id UUID;
  new_poll_id UUID;
  option_obj JSONB;
  option_count INTEGER := 0;
BEGIN
  -- 1. Crear el concurso en estado 'poll'
  INSERT INTO contests (
    title,
    description,
    category,
    month,
    min_words,
    max_words,
    submission_deadline,
    voting_deadline,
    prize,
    status,
    poll_enabled,
    poll_deadline,
    original_description,
    created_at,
    updated_at
  ) VALUES (
    contest_title,
    contest_description, -- Descripción temporal, se actualizará con prompt ganador
    contest_category,
    contest_month,
    min_words,
    max_words,
    submission_deadline,
    voting_deadline,
    prize,
    'poll', -- Estado inicial
    true,
    poll_deadline,
    contest_description, -- Guardar descripción original
    NOW(),
    NOW()
  ) RETURNING id INTO new_contest_id;

  -- 2. Crear la encuesta asociada
  INSERT INTO polls (
    title,
    description,
    target_month,
    target_contest_month,
    voting_deadline,
    status,
    created_at,
    updated_at,
    contest_id
  ) VALUES (
    poll_title,
    poll_description,
    contest_title, -- Usar título del concurso como target_month
    contest_month,
    poll_deadline,
    'active',
    NOW(),
    NOW(),
    new_contest_id
  ) RETURNING id INTO new_poll_id;

  -- 3. Actualizar concurso con referencia a la encuesta
  UPDATE contests 
  SET poll_converted_from = new_poll_id
  WHERE id = new_contest_id;

  -- 4. Crear opciones de la encuesta
  FOR option_obj IN SELECT * FROM jsonb_array_elements(poll_options)
  LOOP
    option_count := option_count + 1;
    
    INSERT INTO poll_options (
      poll_id,
      option_text,
      option_title,
      option_description,
      display_order,
      created_at
    ) VALUES (
      new_poll_id,
      option_obj->>'text',
      option_obj->>'title',
      option_obj->>'description',
      option_count,
      NOW()
    );
  END LOOP;

  -- 5. Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'contest_id', new_contest_id,
    'poll_id', new_poll_id,
    'message', 'Concurso con encuesta creado exitosamente'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Error creando concurso con encuesta'
    );
END;
$$ LANGUAGE plpgsql;

-- Función actualizada para convertir encuesta a concurso activo
CREATE OR REPLACE FUNCTION convert_poll_to_active_contest(poll_id UUID)
RETURNS JSONB AS $$
DECLARE
  poll_record RECORD;
  winning_option RECORD;
  contest_record RECORD;
BEGIN
  -- 1. Obtener datos de la encuesta
  SELECT * INTO poll_record FROM polls WHERE id = poll_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Encuesta no encontrada');
  END IF;

  -- 2. Obtener opción ganadora
  SELECT po.* INTO winning_option
  FROM poll_options po
  WHERE po.poll_id = poll_id
  ORDER BY po.vote_count DESC, po.created_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No hay opciones de votación');
  END IF;

  -- 3. Obtener concurso asociado
  SELECT * INTO contest_record FROM contests WHERE id = poll_record.contest_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Concurso asociado no encontrado');
  END IF;

  -- 4. Actualizar concurso: cambiar estado y descripción al prompt ganador
  UPDATE contests 
  SET 
    status = 'submission',
    description = winning_option.option_text,
    updated_at = NOW()
  WHERE id = poll_record.contest_id;

  -- 5. Actualizar encuesta como convertida
  UPDATE polls 
  SET 
    status = 'converted',
    winning_option_id = winning_option.id,
    converted_contest_id = poll_record.contest_id,
    converted_at = NOW(),
    updated_at = NOW()
  WHERE id = poll_id;

  -- 6. Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'contest_id', poll_record.contest_id,
    'winning_prompt', winning_option.option_text,
    'message', 'Encuesta convertida exitosamente a concurso activo'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener encuesta activa de un concurso
CREATE OR REPLACE FUNCTION get_contest_active_poll(contest_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  voting_deadline TIMESTAMPTZ,
  status VARCHAR,
  total_votes INTEGER,
  options JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.voting_deadline,
    p.status::VARCHAR,
    p.total_votes,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', po.id,
          'option_title', po.option_title,
          'option_description', po.option_description,
          'option_text', po.option_text,
          'vote_count', po.vote_count,
          'display_order', po.display_order
        )
        ORDER BY po.display_order ASC
      ) FILTER (WHERE po.id IS NOT NULL),
      '[]'::jsonb
    ) as options
  FROM polls p
  LEFT JOIN poll_options po ON p.id = po.poll_id
  WHERE p.contest_id = get_contest_active_poll.contest_id
    AND p.status = 'active'
    AND p.voting_deadline > NOW()
  GROUP BY p.id, p.title, p.description, p.voting_deadline, p.status, p.total_votes;
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre el flujo integrado:
-- 1. Admin crea concurso con poll_enabled = true
-- 2. Se crea concurso en estado 'poll' y encuesta asociada
-- 3. Usuarios votan en la encuesta
-- 4. Al terminar encuesta, trigger convierte concurso a 'submission' con prompt ganador
-- 5. Flujo normal continúa: submission → voting → results