-- reset-views-count.sql
-- Limpiar contadores de vistas de prueba

-- 1. Resetear todas las vistas a 0
UPDATE stories 
SET views_count = 0;

-- 2. Verificar que se aplicó correctamente
SELECT 
  COUNT(*) as total_stories,
  COUNT(CASE WHEN views_count = 0 THEN 1 END) as stories_with_zero_views,
  COUNT(CASE WHEN views_count > 0 THEN 1 END) as stories_with_views,
  MAX(views_count) as max_views,
  AVG(views_count) as avg_views
FROM stories;

-- 3. Ver algunas historias para confirmar
SELECT 
  title,
  views_count,
  likes_count,
  created_at
FROM stories 
ORDER BY created_at DESC 
LIMIT 5;

COMMENT ON COLUMN stories.views_count IS 'Contador de vistas - resetado para limpiar datos de prueba';