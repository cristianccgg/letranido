-- ============================================================================
-- Verificación del Sistema de Likes en Comentarios del Feed
-- ============================================================================
-- Ejecutar este script DESPUÉS de aplicar feed_comment_likes.sql
-- para verificar que todo se instaló correctamente
-- ============================================================================

-- 1. Verificar tabla creada
SELECT
  'feed_comment_likes table' AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'feed_comment_likes'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status;

-- 2. Verificar columnas
SELECT
  'feed_comment_likes columns' AS item,
  string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_name = 'feed_comment_likes';

-- 3. Verificar índices
SELECT
  'Indexes' AS item,
  string_agg(indexname, ', ') AS indexes
FROM pg_indexes
WHERE tablename = 'feed_comment_likes';

-- 4. Verificar RLS policies
SELECT
  'RLS Policies' AS item,
  string_agg(policyname, ', ') AS policies
FROM pg_policies
WHERE tablename = 'feed_comment_likes';

-- 5. Verificar funciones
SELECT
  'Functions' AS item,
  string_agg(proname, ', ') AS functions
FROM pg_proc
WHERE proname LIKE '%feed_comment_like%';

-- 6. Verificar triggers
SELECT
  'Triggers' AS item,
  string_agg(trigger_name, ', ') AS triggers
FROM information_schema.triggers
WHERE event_object_table = 'feed_comment_likes';

-- ============================================================================
-- Test básico de funcionalidad (OPCIONAL - requiere datos de prueba)
-- ============================================================================

-- Descomentar si quieres probar con datos reales:

/*
-- Nota: Reemplaza estos UUIDs con IDs reales de tu base de datos

-- Test 1: Toggle like (debería insertar)
SELECT toggle_feed_comment_like(
  'tu-user-id-aqui'::UUID,
  'un-comment-id-aqui'::UUID
);
-- Esperado: {"action": "liked", "likes_count": 1}

-- Test 2: Toggle again (debería eliminar)
SELECT toggle_feed_comment_like(
  'tu-user-id-aqui'::UUID,
  'un-comment-id-aqui'::UUID
);
-- Esperado: {"action": "unliked", "likes_count": 0}

-- Test 3: Check si usuario dio like
SELECT check_user_feed_comment_like(
  'tu-user-id-aqui'::UUID,
  'un-comment-id-aqui'::UUID
);
-- Esperado: false (después del unlike)

-- Test 4: Batch loading
SELECT * FROM get_user_feed_comment_likes_batch(
  'tu-user-id-aqui'::UUID,
  ARRAY['comment-id-1'::UUID, 'comment-id-2'::UUID]
);
-- Esperado: Rows con los comment_ids donde user dio like
*/

-- ============================================================================
-- Resumen de Verificación
-- ============================================================================
SELECT
  '=== VERIFICATION SUMMARY ===' AS title,
  (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'feed_comment_likes') AS tables_created,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'feed_comment_likes') AS indexes_created,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'feed_comment_likes') AS policies_created,
  (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%feed_comment_like%') AS functions_created;

-- ============================================================================
-- Si todo muestra números > 0, el sistema está instalado correctamente ✓
-- ============================================================================
