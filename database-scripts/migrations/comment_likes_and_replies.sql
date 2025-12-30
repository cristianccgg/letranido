-- ============================================================================
-- MIGRACIÓN: Sistema de Likes en Comentarios y Soporte Completo para Respuestas
-- Fecha: Diciembre 2024
-- Propósito: Tracking real de likes por usuario y mejoras para respuestas anidadas
-- ============================================================================

-- 1. Crear tabla para tracking de likes en comentarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Evitar duplicados: un usuario solo puede dar like una vez por comentario
  UNIQUE(user_id, comment_id)
);

-- 2. Índices para optimizar queries de comment_likes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id
  ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id
  ON comment_likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_created_at
  ON comment_likes(created_at DESC);

-- Índice compuesto para consultas por usuario + comentario específico (lookup rápido)
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_comment
  ON comment_likes(user_id, comment_id);

-- 3. Índices adicionales en tabla comments para optimizar queries de respuestas
-- ============================================================================

-- Índice para obtener respuestas de un comentario padre
CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments(parent_id)
  WHERE parent_id IS NOT NULL;

-- Índice compuesto para story + parent_id (para obtener comentarios principales)
CREATE INDEX IF NOT EXISTS idx_comments_story_parent
  ON comments(story_id, parent_id);

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS idx_comments_created_at
  ON comments(created_at DESC);

-- 4. RLS Policies (Row Level Security) para comment_likes
-- ============================================================================
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver los likes (para contar y verificar)
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes
  FOR SELECT
  USING (true);

-- Usuarios autenticados pueden insertar sus propios likes
CREATE POLICY "Users can insert their own likes"
  ON comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden eliminar solo sus propios likes (unlike)
CREATE POLICY "Users can delete their own likes"
  ON comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins pueden ver todos los likes (para analytics)
CREATE POLICY "Admins can view all comment likes"
  ON comment_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 5. Trigger para mantener sincronizado likes_count en tabla comments
-- ============================================================================

-- Función para actualizar contador de likes
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el contador en la tabla comments
  IF (TG_OP = 'INSERT') THEN
    -- Incrementar contador al dar like
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrementar contador al quitar like (mínimo 0)
    UPDATE comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers para incrementar/decrementar
DROP TRIGGER IF EXISTS trigger_increment_comment_likes ON comment_likes;
CREATE TRIGGER trigger_increment_comment_likes
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

DROP TRIGGER IF EXISTS trigger_decrement_comment_likes ON comment_likes;
CREATE TRIGGER trigger_decrement_comment_likes
  AFTER DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- 6. Función para toggle like/unlike (agregar o remover automáticamente)
-- ============================================================================
CREATE OR REPLACE FUNCTION toggle_comment_like(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_like_id UUID;
  v_action TEXT;
  v_likes_count INTEGER;
BEGIN
  -- Verificar si ya existe el like
  SELECT id INTO v_like_id
  FROM comment_likes
  WHERE user_id = p_user_id
    AND comment_id = p_comment_id;

  IF v_like_id IS NOT NULL THEN
    -- Ya existe: remover like (unlike)
    DELETE FROM comment_likes
    WHERE id = v_like_id;
    v_action := 'unliked';
  ELSE
    -- No existe: agregar like
    INSERT INTO comment_likes (user_id, comment_id)
    VALUES (p_user_id, p_comment_id)
    RETURNING id INTO v_like_id;
    v_action := 'liked';
  END IF;

  -- Obtener el nuevo contador de likes
  SELECT likes_count INTO v_likes_count
  FROM comments
  WHERE id = p_comment_id;

  -- Retornar resultado con información completa
  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'like_id', v_like_id,
    'likes_count', COALESCE(v_likes_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para verificar si un usuario dio like a un comentario
-- ============================================================================
CREATE OR REPLACE FUNCTION check_user_comment_like(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM comment_likes
    WHERE user_id = p_user_id
      AND comment_id = p_comment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para obtener likes de múltiples comentarios (batch query)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_comment_likes_batch(
  p_user_id UUID,
  p_comment_ids UUID[]
)
RETURNS TABLE (
  comment_id UUID,
  liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest_val as comment_id,
    EXISTS (
      SELECT 1
      FROM comment_likes cl
      WHERE cl.user_id = p_user_id
        AND cl.comment_id = unnest_val
    ) as liked
  FROM unnest(p_comment_ids) as unnest_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. View helper para obtener comentarios con metadata (opcional)
-- ============================================================================
CREATE OR REPLACE VIEW comments_with_metadata AS
SELECT
  c.id,
  c.content,
  c.user_id,
  c.story_id,
  c.parent_id,
  c.likes_count,
  c.is_featured,
  c.created_at,
  c.updated_at,
  -- Contar respuestas directas
  (
    SELECT COUNT(*)
    FROM comments replies
    WHERE replies.parent_id = c.id
  ) as replies_count,
  -- Información del usuario
  p.display_name,
  p.email
FROM comments c
LEFT JOIN user_profiles p ON c.user_id = p.id;

-- 10. Comentarios y documentación
-- ============================================================================

COMMENT ON TABLE comment_likes IS 'Tracking de likes en comentarios por usuario. Cada usuario puede dar like una vez por comentario.';
COMMENT ON COLUMN comment_likes.user_id IS 'Usuario que dio like al comentario';
COMMENT ON COLUMN comment_likes.comment_id IS 'Comentario que recibió el like';
COMMENT ON COLUMN comment_likes.created_at IS 'Fecha y hora en que se dio el like';

COMMENT ON FUNCTION toggle_comment_like IS 'Toggle like/unlike en un comentario. Si el usuario ya dio like, lo remueve. Si no, lo agrega. Retorna acción realizada y nuevo contador de likes.';
COMMENT ON FUNCTION check_user_comment_like IS 'Verifica si un usuario específico dio like a un comentario específico. Retorna true si ya dio like, false si no.';
COMMENT ON FUNCTION get_user_comment_likes_batch IS 'Obtiene el estado de likes de múltiples comentarios para un usuario de forma eficiente (batch query). Retorna tabla con comment_id y boolean liked.';
COMMENT ON FUNCTION update_comment_likes_count IS 'Trigger function que mantiene sincronizado el contador likes_count en la tabla comments cuando se agregan o eliminan likes.';

COMMENT ON INDEX idx_comment_likes_user_comment IS 'Optimiza verificación de like existente por usuario y comentario específico (O(1) lookup)';
COMMENT ON INDEX idx_comments_parent_id IS 'Optimiza queries para obtener respuestas de un comentario padre';
COMMENT ON INDEX idx_comments_story_parent IS 'Optimiza queries para obtener comentarios principales de una historia';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- Para verificar que todo se creó correctamente:
-- SELECT * FROM comment_likes LIMIT 1;
-- SELECT * FROM comments_with_metadata LIMIT 5;
-- SELECT toggle_comment_like('USER_ID'::UUID, 'COMMENT_ID'::UUID);
