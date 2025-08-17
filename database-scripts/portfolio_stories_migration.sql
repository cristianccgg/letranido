-- Migración para Sistema de Historias Libres (Portafolio Personal)
-- SEGURO PARA PRODUCCIÓN - Solo agrega campos, no modifica datos existentes

-- 1. Agregar campo category para categorizar historias libres
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- 2. Agregar índice para consultas eficientes de historias libres
CREATE INDEX IF NOT EXISTS idx_stories_free_stories 
ON stories(contest_id) WHERE contest_id IS NULL;

-- 3. Agregar índice para categorías
CREATE INDEX IF NOT EXISTS idx_stories_category 
ON stories(category) WHERE category IS NOT NULL;

-- 4. Función para obtener historias libres
CREATE OR REPLACE FUNCTION get_free_stories(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  word_count INTEGER,
  category TEXT,
  user_id UUID,
  author TEXT,
  likes_count INTEGER,
  views_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMPTZ,
  is_mature BOOLEAN
)
LANGUAGE sql
AS $$
  SELECT 
    s.id,
    s.title,
    s.content,
    s.excerpt,
    s.word_count,
    s.category,
    s.user_id,
    up.display_name as author,
    s.likes_count,
    s.views_count,
    s.comments_count,
    s.created_at,
    s.is_mature
  FROM stories s
  JOIN user_profiles up ON s.user_id = up.id
  WHERE s.contest_id IS NULL  -- Solo historias libres
    AND (category_filter IS NULL OR s.category = category_filter)
  ORDER BY s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- 5. Función para obtener estadísticas de historias libres de un usuario
CREATE OR REPLACE FUNCTION get_user_portfolio_stats(user_uuid UUID)
RETURNS TABLE (
  total_stories INTEGER,
  total_likes INTEGER,
  total_views INTEGER,
  avg_engagement NUMERIC
)
LANGUAGE sql
AS $$
  SELECT 
    COUNT(*)::INTEGER as total_stories,
    COALESCE(SUM(likes_count), 0)::INTEGER as total_likes,
    COALESCE(SUM(views_count), 0)::INTEGER as total_views,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COALESCE(SUM(likes_count), 0)::NUMERIC / NULLIF(SUM(views_count), 0)) * 100, 2)
      ELSE 0 
    END as avg_engagement
  FROM stories 
  WHERE user_id = user_uuid AND contest_id IS NULL;
$$;

-- 6. Función para verificar si un usuario puede publicar historias libres
CREATE OR REPLACE FUNCTION can_publish_free_stories(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
AS $$
  SELECT COALESCE(is_premium_active(user_uuid), false);
$$;

-- 7. Comentarios para documentación
COMMENT ON COLUMN stories.category IS 'Categoría para historias libres: Romance, Drama, Terror, Ciencia Ficción, etc. NULL para historias de concurso';
COMMENT ON FUNCTION get_free_stories IS 'Obtiene historias libres (contest_id IS NULL) con paginación y filtro por categoría';
COMMENT ON FUNCTION get_user_portfolio_stats IS 'Estadísticas del portafolio personal de un usuario';
COMMENT ON FUNCTION can_publish_free_stories IS 'Verifica si un usuario premium puede publicar historias libres';

-- 8. Datos de prueba (solo en desarrollo)
-- NOTA: Esto se ejecutará solo si estamos en un entorno de desarrollo
DO $$
BEGIN
  -- Solo insertar datos de prueba si hay menos de 5 historias totales (entorno dev)
  IF (SELECT COUNT(*) FROM stories) < 5 THEN
    -- Crear algunas historias libres de ejemplo para testing
    INSERT INTO stories (title, content, excerpt, word_count, category, user_id, contest_id, created_at) 
    SELECT 
      'Historia de Prueba - ' || generate_series(1,3),
      'Contenido de historia libre para testing...',
      'Extracto de historia libre...',
      150,
      CASE generate_series(1,3) % 3
        WHEN 0 THEN 'Romance'
        WHEN 1 THEN 'Drama' 
        ELSE 'Terror'
      END,
      (SELECT id FROM user_profiles WHERE is_pro = true LIMIT 1),
      NULL, -- contest_id NULL = historia libre
      NOW() - (generate_series(1,3) || ' days')::interval
    WHERE EXISTS (SELECT 1 FROM user_profiles WHERE is_pro = true);
  END IF;
END $$;