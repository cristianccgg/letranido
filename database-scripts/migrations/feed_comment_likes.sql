-- ============================================================================
-- Feed Comment Likes System
-- ============================================================================
-- Descripción: Sistema de likes para comentarios del feed
-- Fecha: Diciembre 2024
-- Características:
--   - Tracking real de likes por usuario
--   - Contador automático con triggers
--   - Función toggle para like/unlike
--   - Batch loading para UI optimista
-- ============================================================================

-- 1. TABLA: feed_comment_likes
-- ============================================================================
CREATE TABLE IF NOT EXISTS feed_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES feed_story_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 2. ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_user_id
  ON feed_comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_comment_id
  ON feed_comment_likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_user_comment
  ON feed_comment_likes(user_id, comment_id);

-- 3. RLS POLICIES
-- ============================================================================
ALTER TABLE feed_comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquiera puede ver likes (para contar)
DROP POLICY IF EXISTS "Anyone can view feed comment likes" ON feed_comment_likes;
CREATE POLICY "Anyone can view feed comment likes"
  ON feed_comment_likes FOR SELECT
  USING (true);

-- Policy: Solo usuarios autenticados pueden dar like
DROP POLICY IF EXISTS "Users can insert their own feed comment likes" ON feed_comment_likes;
CREATE POLICY "Users can insert their own feed comment likes"
  ON feed_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Solo pueden eliminar sus propios likes
DROP POLICY IF EXISTS "Users can delete their own feed comment likes" ON feed_comment_likes;
CREATE POLICY "Users can delete their own feed comment likes"
  ON feed_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. TRIGGER: Actualizar contador de likes automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_feed_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador
    UPDATE feed_story_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador
    UPDATE feed_story_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_feed_comment_likes_count ON feed_comment_likes;
CREATE TRIGGER trigger_update_feed_comment_likes_count
  AFTER INSERT OR DELETE ON feed_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_comment_likes_count();

-- 5. FUNCIÓN: Toggle like (like/unlike automático)
-- ============================================================================
CREATE OR REPLACE FUNCTION toggle_feed_comment_like(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_action TEXT;
  v_likes_count INTEGER;
BEGIN
  -- Verificar si ya existe el like
  SELECT EXISTS(
    SELECT 1 FROM feed_comment_likes
    WHERE user_id = p_user_id AND comment_id = p_comment_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike: Eliminar like
    DELETE FROM feed_comment_likes
    WHERE user_id = p_user_id AND comment_id = p_comment_id;
    v_action := 'unliked';
  ELSE
    -- Like: Insertar like
    INSERT INTO feed_comment_likes (user_id, comment_id)
    VALUES (p_user_id, p_comment_id);
    v_action := 'liked';
  END IF;

  -- Obtener contador actualizado
  SELECT likes_count INTO v_likes_count
  FROM feed_story_comments
  WHERE id = p_comment_id;

  RETURN jsonb_build_object(
    'action', v_action,
    'likes_count', v_likes_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN: Verificar si usuario dio like a un comentario
-- ============================================================================
CREATE OR REPLACE FUNCTION check_user_feed_comment_like(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM feed_comment_likes
    WHERE user_id = p_user_id AND comment_id = p_comment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNCIÓN: Batch loading de likes de usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_feed_comment_likes_batch(
  p_user_id UUID,
  p_comment_ids UUID[]
)
RETURNS TABLE(comment_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT fcl.comment_id
  FROM feed_comment_likes fcl
  WHERE fcl.user_id = p_user_id
    AND fcl.comment_id = ANY(p_comment_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Para verificar que todo se creó correctamente:
--
-- SELECT tablename FROM pg_tables WHERE tablename = 'feed_comment_likes';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'feed_comment_likes';
-- SELECT policyname FROM pg_policies WHERE tablename = 'feed_comment_likes';
-- SELECT proname FROM pg_proc WHERE proname LIKE '%feed_comment%';
-- ============================================================================
