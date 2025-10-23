-- ============================================================================
-- MIGRACIÓN: Sistema de Historias Leídas
-- Fecha: Octubre 2024
-- Propósito: Tracking de historias leídas por usuarios para mejorar UX en votación
-- ============================================================================

-- 1. Crear tabla para tracking de lecturas
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_story_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_manually BOOLEAN DEFAULT false,
  -- Evitar duplicados
  UNIQUE(user_id, story_id, contest_id)
);

-- 2. Índices para optimizar queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_story_reads_user_id
  ON user_story_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_user_story_reads_story_id
  ON user_story_reads(story_id);

CREATE INDEX IF NOT EXISTS idx_user_story_reads_contest_id
  ON user_story_reads(contest_id);

CREATE INDEX IF NOT EXISTS idx_user_story_reads_user_contest
  ON user_story_reads(user_id, contest_id);

-- 3. RLS Policies (Row Level Security)
-- ============================================================================
ALTER TABLE user_story_reads ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias lecturas
CREATE POLICY "Users can view their own reads"
  ON user_story_reads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden insertar sus propias lecturas
CREATE POLICY "Users can insert their own reads"
  ON user_story_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propias lecturas
CREATE POLICY "Users can update their own reads"
  ON user_story_reads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden eliminar sus propias lecturas
CREATE POLICY "Users can delete their own reads"
  ON user_story_reads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins pueden ver todas las lecturas (para analytics)
CREATE POLICY "Admins can view all reads"
  ON user_story_reads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 4. Función auxiliar para obtener historias leídas de un usuario en un concurso
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_read_stories(
  p_user_id UUID,
  p_contest_id UUID
)
RETURNS TABLE (
  story_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  marked_manually BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    usr.story_id,
    usr.read_at,
    usr.marked_manually
  FROM user_story_reads usr
  WHERE usr.user_id = p_user_id
    AND usr.contest_id = p_contest_id
  ORDER BY usr.read_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para marcar historia como leída (upsert)
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_story_as_read(
  p_user_id UUID,
  p_story_id UUID,
  p_contest_id UUID,
  p_marked_manually BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_read_id UUID;
BEGIN
  -- Insertar o actualizar
  INSERT INTO user_story_reads (user_id, story_id, contest_id, marked_manually)
  VALUES (p_user_id, p_story_id, p_contest_id, p_marked_manually)
  ON CONFLICT (user_id, story_id, contest_id)
  DO UPDATE SET
    read_at = NOW(),
    marked_manually = CASE
      WHEN p_marked_manually THEN true
      ELSE user_story_reads.marked_manually
    END
  RETURNING id INTO v_read_id;

  RETURN v_read_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para desmarcar historia como leída
-- ============================================================================
CREATE OR REPLACE FUNCTION unmark_story_as_read(
  p_user_id UUID,
  p_story_id UUID,
  p_contest_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_story_reads
  WHERE user_id = p_user_id
    AND story_id = p_story_id
    AND contest_id = p_contest_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener estadísticas de lectura de un concurso
-- ============================================================================
CREATE OR REPLACE FUNCTION get_contest_read_stats(
  p_user_id UUID,
  p_contest_id UUID
)
RETURNS TABLE (
  total_stories BIGINT,
  read_stories BIGINT,
  unread_stories BIGINT,
  read_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH contest_stories AS (
    SELECT COUNT(*) as total
    FROM stories
    WHERE contest_id = p_contest_id
      AND status = 'published'
  ),
  user_reads AS (
    SELECT COUNT(*) as reads
    FROM user_story_reads
    WHERE user_id = p_user_id
      AND contest_id = p_contest_id
  )
  SELECT
    contest_stories.total,
    user_reads.reads,
    (contest_stories.total - user_reads.reads) as unread,
    CASE
      WHEN contest_stories.total > 0
      THEN ROUND((user_reads.reads::NUMERIC / contest_stories.total::NUMERIC) * 100, 1)
      ELSE 0
    END as percentage
  FROM contest_stories, user_reads;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para auto-marcar como leída al votar
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_mark_read_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- Al insertar un voto, marcar la historia como leída automáticamente
  INSERT INTO user_story_reads (user_id, story_id, contest_id, marked_manually)
  SELECT
    NEW.user_id,
    NEW.story_id,
    s.contest_id,
    false -- No fue manual, fue por el voto
  FROM stories s
  WHERE s.id = NEW.story_id
  ON CONFLICT (user_id, story_id, contest_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en la tabla votes
DROP TRIGGER IF EXISTS trigger_auto_mark_read_on_vote ON votes;
CREATE TRIGGER trigger_auto_mark_read_on_vote
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_read_on_vote();

-- ============================================================================
-- COMENTARIOS Y NOTAS
-- ============================================================================

COMMENT ON TABLE user_story_reads IS 'Tracking de historias leídas por usuarios para mejorar UX en votación';
COMMENT ON COLUMN user_story_reads.marked_manually IS 'true = usuario marcó manualmente, false = tracking automático o por voto';
COMMENT ON FUNCTION mark_story_as_read IS 'Marca una historia como leída (upsert). Puede ser manual o automática.';
COMMENT ON FUNCTION unmark_story_as_read IS 'Desmarca una historia como leída (útil si el usuario entró por error)';
COMMENT ON FUNCTION get_contest_read_stats IS 'Obtiene estadísticas de lectura de un usuario en un concurso específico';
COMMENT ON FUNCTION auto_mark_read_on_vote IS 'Trigger que automáticamente marca como leída una historia cuando el usuario vota por ella';
