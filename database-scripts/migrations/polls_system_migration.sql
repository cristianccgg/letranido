-- Migración para Sistema de Votación de Prompts
-- Versión: 1.0
-- Fecha: 2024-09-23

-- Tabla principal de encuestas
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_month VARCHAR(50) NOT NULL, -- 'Noviembre 2024', 'Marzo 2025', etc.
  target_contest_month VARCHAR(20) NOT NULL, -- 'noviembre', 'marzo', etc.
  voting_deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'completed', 'converted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  total_votes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  winning_option_id UUID, -- Se llenará cuando termine la votación
  converted_contest_id UUID REFERENCES contests(id), -- Se llenará cuando se convierta a concurso
  converted_at TIMESTAMPTZ -- Timestamp de cuando se convirtió a concurso
);

-- Tabla de opciones de prompts para cada encuesta
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL, -- El prompt completo
  option_title VARCHAR(255) NOT NULL, -- Título corto del prompt
  option_description TEXT, -- Descripción opcional del prompt
  display_order INTEGER DEFAULT 1,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de votos de usuarios
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Un voto por usuario por encuesta
);

-- Índices para optimizar consultas
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_voting_deadline ON polls(voting_deadline);
CREATE INDEX idx_polls_target_contest_month ON polls(target_contest_month);
CREATE INDEX idx_polls_is_active ON polls(is_active);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_display_order ON poll_options(poll_id, display_order);
CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX idx_poll_votes_option_id ON poll_votes(option_id);

-- Función para actualizar contador de votos
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador de la opción
    UPDATE poll_options 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.option_id;
    
    -- Incrementar contador total de la encuesta
    UPDATE polls 
    SET total_votes = total_votes + 1,
        updated_at = NOW()
    WHERE id = NEW.poll_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador de la opción
    UPDATE poll_options 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.option_id;
    
    -- Decrementar contador total de la encuesta
    UPDATE polls 
    SET total_votes = total_votes - 1,
        updated_at = NOW()
    WHERE id = OLD.poll_id;
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió de opción, actualizar ambos contadores
    IF OLD.option_id != NEW.option_id THEN
      -- Decrementar opción anterior
      UPDATE poll_options 
      SET vote_count = vote_count - 1 
      WHERE id = OLD.option_id;
      
      -- Incrementar nueva opción
      UPDATE poll_options 
      SET vote_count = vote_count + 1 
      WHERE id = NEW.option_id;
    END IF;
    
    -- Actualizar timestamp de la encuesta
    UPDATE polls 
    SET updated_at = NOW()
    WHERE id = NEW.poll_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener contadores actualizados
CREATE TRIGGER trigger_update_poll_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_vote_counts();

-- Función para cerrar encuestas automáticamente cuando expire el plazo
CREATE OR REPLACE FUNCTION auto_close_expired_polls()
RETURNS void AS $$
BEGIN
  UPDATE polls 
  SET status = 'closed',
      updated_at = NOW()
  WHERE status = 'active' 
    AND voting_deadline <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para obtener encuesta activa para el siguiente mes
CREATE OR REPLACE FUNCTION get_active_poll_for_next_month()
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  description TEXT,
  target_month VARCHAR,
  target_contest_month VARCHAR,
  voting_deadline TIMESTAMPTZ,
  status VARCHAR,
  total_votes INTEGER,
  created_at TIMESTAMPTZ,
  options JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.target_month,
    p.target_contest_month,
    p.voting_deadline,
    p.status,
    p.total_votes,
    p.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', po.id,
          'option_title', po.option_title,
          'option_description', po.option_description,
          'option_text', po.option_text,
          'vote_count', po.vote_count,
          'display_order', po.display_order
        ) ORDER BY po.display_order
      ) FILTER (WHERE po.id IS NOT NULL),
      '[]'::jsonb
    ) as options
  FROM polls p
  LEFT JOIN poll_options po ON p.id = po.poll_id
  WHERE p.status = 'active' 
    AND p.voting_deadline > NOW()
    AND p.is_active = true
  GROUP BY p.id, p.title, p.description, p.target_month, p.target_contest_month, 
           p.voting_deadline, p.status, p.total_votes, p.created_at
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE polls IS 'Tabla principal para encuestas de votación de prompts';
COMMENT ON TABLE poll_options IS 'Opciones de prompts para cada encuesta';
COMMENT ON TABLE poll_votes IS 'Votos de usuarios en las encuestas';
COMMENT ON FUNCTION update_poll_vote_counts() IS 'Mantiene actualizados los contadores de votos';
COMMENT ON FUNCTION auto_close_expired_polls() IS 'Cierra automáticamente encuestas que han expirado';
COMMENT ON FUNCTION get_active_poll_for_next_month() IS 'Obtiene la encuesta activa para el siguiente mes con sus opciones';