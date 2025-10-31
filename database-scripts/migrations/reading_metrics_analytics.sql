-- ============================================================================
-- MIGRACIÓN: Analytics de Métricas de Lectura
-- Fecha: Octubre 31, 2024
-- Propósito: Funciones para analizar distribución de lecturas en retos
-- ============================================================================

-- 1. Función para obtener métricas de lectura por historia en un concurso
-- ============================================================================
CREATE OR REPLACE FUNCTION get_contest_reading_metrics(
  p_contest_id UUID
)
RETURNS TABLE (
  story_id UUID,
  story_title TEXT,
  author_name TEXT,
  author_id UUID,
  read_count BIGINT,
  vote_count BIGINT,
  read_to_vote_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as story_id,
    s.title as story_title,
    COALESCE(up.display_name, up.email) as author_name,
    s.author_id,
    COALESCE(reads.count, 0) as read_count,
    COALESCE(votes.count, 0) as vote_count,
    CASE
      WHEN COALESCE(reads.count, 0) > 0
      THEN ROUND((COALESCE(votes.count, 0)::NUMERIC / reads.count::NUMERIC) * 100, 1)
      ELSE 0
    END as read_to_vote_ratio
  FROM stories s
  LEFT JOIN user_profiles up ON s.author_id = up.id
  LEFT JOIN (
    SELECT story_id, COUNT(*) as count
    FROM user_story_reads
    WHERE contest_id = p_contest_id
    GROUP BY story_id
  ) reads ON s.id = reads.story_id
  LEFT JOIN (
    SELECT story_id, COUNT(*) as count
    FROM votes
    WHERE story_id IN (
      SELECT id FROM stories WHERE contest_id = p_contest_id
    )
    GROUP BY story_id
  ) votes ON s.id = votes.story_id
  WHERE s.contest_id = p_contest_id
    AND s.status = 'published'
  ORDER BY read_count DESC, story_title ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para obtener estadísticas agregadas del concurso
-- ============================================================================
CREATE OR REPLACE FUNCTION get_contest_reading_summary(
  p_contest_id UUID
)
RETURNS TABLE (
  total_stories BIGINT,
  total_reads BIGINT,
  avg_reads_per_story NUMERIC,
  median_reads NUMERIC,
  min_reads BIGINT,
  max_reads BIGINT,
  stddev_reads NUMERIC,
  coefficient_of_variation NUMERIC,
  stories_never_read BIGINT,
  unique_readers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH story_reads AS (
    SELECT
      s.id,
      COALESCE(COUNT(usr.id), 0) as read_count
    FROM stories s
    LEFT JOIN user_story_reads usr ON s.id = usr.story_id
    WHERE s.contest_id = p_contest_id
      AND s.status = 'published'
    GROUP BY s.id
  ),
  percentiles AS (
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY read_count) as median_val
    FROM story_reads
  )
  SELECT
    COUNT(*)::BIGINT as total_stories,
    SUM(read_count)::BIGINT as total_reads,
    ROUND(AVG(read_count), 1) as avg_reads_per_story,
    ROUND(percentiles.median_val, 1) as median_reads,
    MIN(read_count)::BIGINT as min_reads,
    MAX(read_count)::BIGINT as max_reads,
    ROUND(STDDEV(read_count), 1) as stddev_reads,
    CASE
      WHEN AVG(read_count) > 0
      THEN ROUND((STDDEV(read_count) / AVG(read_count)) * 100, 1)
      ELSE 0
    END as coefficient_of_variation,
    COUNT(CASE WHEN read_count = 0 THEN 1 END)::BIGINT as stories_never_read,
    (
      SELECT COUNT(DISTINCT user_id)
      FROM user_story_reads
      WHERE contest_id = p_contest_id
    )::BIGINT as unique_readers
  FROM story_reads, percentiles
  GROUP BY percentiles.median_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para obtener distribución de lecturas (histograma)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_reading_distribution(
  p_contest_id UUID
)
RETURNS TABLE (
  read_count_bucket TEXT,
  stories_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH story_reads AS (
    SELECT
      s.id,
      COALESCE(COUNT(usr.id), 0) as read_count
    FROM stories s
    LEFT JOIN user_story_reads usr ON s.id = usr.story_id
    WHERE s.contest_id = p_contest_id
      AND s.status = 'published'
    GROUP BY s.id
  )
  SELECT
    CASE
      WHEN read_count = 0 THEN '0 lecturas'
      WHEN read_count BETWEEN 1 AND 5 THEN '1-5 lecturas'
      WHEN read_count BETWEEN 6 AND 10 THEN '6-10 lecturas'
      WHEN read_count BETWEEN 11 AND 20 THEN '11-20 lecturas'
      WHEN read_count BETWEEN 21 AND 50 THEN '21-50 lecturas'
      ELSE '50+ lecturas'
    END as read_count_bucket,
    COUNT(*)::BIGINT as stories_count
  FROM story_reads
  GROUP BY
    CASE
      WHEN read_count = 0 THEN '0 lecturas'
      WHEN read_count BETWEEN 1 AND 5 THEN '1-5 lecturas'
      WHEN read_count BETWEEN 6 AND 10 THEN '6-10 lecturas'
      WHEN read_count BETWEEN 11 AND 20 THEN '11-20 lecturas'
      WHEN read_count BETWEEN 21 AND 50 THEN '21-50 lecturas'
      ELSE '50+ lecturas'
    END
  ORDER BY
    CASE read_count_bucket
      WHEN '0 lecturas' THEN 1
      WHEN '1-5 lecturas' THEN 2
      WHEN '6-10 lecturas' THEN 3
      WHEN '11-20 lecturas' THEN 4
      WHEN '21-50 lecturas' THEN 5
      ELSE 6
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grants para admins
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_contest_reading_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contest_reading_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reading_distribution(UUID) TO authenticated;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION get_contest_reading_metrics IS 'Obtiene métricas detalladas de lectura por historia en un concurso (para admins)';
COMMENT ON FUNCTION get_contest_reading_summary IS 'Obtiene estadísticas agregadas de distribución de lecturas (media, mediana, CV, etc.)';
COMMENT ON FUNCTION get_reading_distribution IS 'Obtiene histograma de distribución de lecturas para visualizar equidad';
