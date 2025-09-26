-- Políticas RLS para Sistema de Votación de Prompts
-- Versión: 1.0
-- Fecha: 2024-09-23

-- Habilitar RLS en todas las tablas
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- ================================
-- POLÍTICAS PARA TABLA POLLS
-- ================================

-- Permitir a todos ver encuestas activas
CREATE POLICY "polls_select_public" ON polls
  FOR SELECT USING (
    status IN ('active', 'closed') AND is_active = true
  );

-- Solo admins pueden insertar encuestas
CREATE POLICY "polls_insert_admin_only" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Solo admins pueden actualizar encuestas
CREATE POLICY "polls_update_admin_only" ON polls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Solo admins pueden eliminar encuestas
CREATE POLICY "polls_delete_admin_only" ON polls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- ================================
-- POLÍTICAS PARA TABLA POLL_OPTIONS
-- ================================

-- Permitir a todos ver opciones de encuestas activas
CREATE POLICY "poll_options_select_public" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.status IN ('active', 'closed') 
      AND polls.is_active = true
    )
  );

-- Solo admins pueden insertar opciones
CREATE POLICY "poll_options_insert_admin_only" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Solo admins pueden actualizar opciones
CREATE POLICY "poll_options_update_admin_only" ON poll_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Solo admins pueden eliminar opciones
CREATE POLICY "poll_options_delete_admin_only" ON poll_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- ================================
-- POLÍTICAS PARA TABLA POLL_VOTES
-- ================================

-- Los usuarios pueden ver sus propios votos
-- Los admins pueden ver todos los votos
CREATE POLICY "poll_votes_select_own_or_admin" ON poll_votes
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Los usuarios autenticados pueden votar (insertar)
-- Solo en encuestas activas
-- Solo un voto por encuesta por usuario
CREATE POLICY "poll_votes_insert_authenticated" ON poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_votes.poll_id 
      AND polls.status = 'active' 
      AND polls.voting_deadline > NOW()
      AND polls.is_active = true
    ) AND
    NOT EXISTS (
      SELECT 1 FROM poll_votes existing_vote
      WHERE existing_vote.poll_id = poll_votes.poll_id
      AND existing_vote.user_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar su propio voto (cambiar opción)
-- Solo en encuestas activas
CREATE POLICY "poll_votes_update_own" ON poll_votes
  FOR UPDATE USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_votes.poll_id 
      AND polls.status = 'active' 
      AND polls.voting_deadline > NOW()
      AND polls.is_active = true
    )
  );

-- Los usuarios pueden eliminar su propio voto
-- Los admins pueden eliminar cualquier voto
CREATE POLICY "poll_votes_delete_own_or_admin" ON poll_votes
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- ================================
-- FUNCIONES DE SEGURIDAD ADICIONALES
-- ================================

-- Función para verificar si un usuario puede votar en una encuesta
CREATE OR REPLACE FUNCTION can_user_vote_in_poll(poll_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  poll_status VARCHAR;
  poll_deadline TIMESTAMPTZ;
  poll_active BOOLEAN;
  existing_vote_count INTEGER;
BEGIN
  -- Verificar estado de la encuesta
  SELECT status, voting_deadline, is_active
  INTO poll_status, poll_deadline, poll_active
  FROM polls 
  WHERE id = poll_uuid;
  
  -- Si no existe la encuesta
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar condiciones
  IF poll_status != 'active' OR 
     poll_deadline <= NOW() OR 
     poll_active = FALSE THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si ya votó
  SELECT COUNT(*)
  INTO existing_vote_count
  FROM poll_votes
  WHERE poll_id = poll_uuid AND user_id = user_uuid;
  
  -- Si ya votó, no puede votar de nuevo (pero sí puede cambiar voto)
  RETURN existing_vote_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el voto actual del usuario en una encuesta
CREATE OR REPLACE FUNCTION get_user_vote_for_poll(poll_uuid UUID, user_uuid UUID)
RETURNS TABLE(option_id UUID, voted_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT pv.option_id, pv.created_at
  FROM poll_votes pv
  WHERE pv.poll_id = poll_uuid AND pv.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON POLICY "polls_select_public" ON polls IS 'Permite a todos ver encuestas activas públicamente';
COMMENT ON POLICY "polls_insert_admin_only" ON polls IS 'Solo administradores pueden crear encuestas';
COMMENT ON POLICY "poll_votes_insert_authenticated" ON poll_votes IS 'Usuarios autenticados pueden votar una vez por encuesta';
COMMENT ON FUNCTION can_user_vote_in_poll(UUID, UUID) IS 'Verifica si un usuario puede votar en una encuesta específica';
COMMENT ON FUNCTION get_user_vote_for_poll(UUID, UUID) IS 'Obtiene el voto actual del usuario para una encuesta';