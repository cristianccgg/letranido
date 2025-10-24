-- ============================================================================
-- FIX: Función get_contest_read_stats
-- Problema: La tabla 'stories' no tiene columna 'status'
-- Solución: Remover el filtro por status
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
    -- ✅ REMOVIDO: AND status = 'published' (columna no existe)
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

-- ============================================================================
-- COMENTARIO
-- ============================================================================
COMMENT ON FUNCTION get_contest_read_stats IS 'Obtiene estadísticas de lectura de un usuario en un concurso (FIXED: removido filtro status)';
