-- ============================================================================
-- MIGRACIÓN: Sistema de Feed con Prompts Semanales y Microhistorias
-- Fecha: Diciembre 2024
-- Propósito: Sistema de escritura diaria/semanal con prompts de 50-300 palabras
-- ============================================================================
-- IMPORTANTE: NO EJECUTAR AÚN - Solo archivo de preparación
-- ============================================================================

-- ============================================================================
-- 1. TABLA: feed_prompts
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_prompts (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contenido del prompt
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,

  -- Control temporal
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Estados del prompt
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft': Creado pero no publicado aún
    -- 'active': Activo para que usuarios publiquen historias
    -- 'archived': Cerrado, solo lectura (no más publicaciones ni comentarios)

  -- Estadísticas (desnormalizadas para performance)
  stories_count INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_prompt_status CHECK (status IN ('draft', 'active', 'archived')),
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT unique_week_year UNIQUE(week_number, year)
);

COMMENT ON TABLE feed_prompts IS 'Prompts semanales para microhistorias del feed';
COMMENT ON COLUMN feed_prompts.status IS 'draft=no publicado | active=abierto 7 días | archived=cerrado permanente';
COMMENT ON COLUMN feed_prompts.week_number IS 'Número de semana del año (1-52)';

-- ============================================================================
-- 2. TABLA: feed_stories (microhistorias)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_stories (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  prompt_id UUID NOT NULL REFERENCES feed_prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contenido
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,

  -- Validación de longitud
  word_count INTEGER NOT NULL,

  -- Engagement
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_word_count CHECK (word_count >= 50 AND word_count <= 300),
  CONSTRAINT one_story_per_user_per_prompt UNIQUE(prompt_id, user_id)
);

COMMENT ON TABLE feed_stories IS 'Microhistorias de 50-300 palabras publicadas en prompts del feed';
COMMENT ON CONSTRAINT valid_word_count ON feed_stories IS 'Límite: 50-300 palabras para escritura ágil';
COMMENT ON CONSTRAINT one_story_per_user_per_prompt ON feed_stories IS 'Un usuario solo puede publicar UNA historia por prompt';

-- ============================================================================
-- 3. TABLA: feed_story_likes
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_story_likes (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES feed_stories(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_story_like UNIQUE(user_id, story_id)
);

COMMENT ON TABLE feed_story_likes IS 'Tracking real de likes en microhistorias del feed';

-- ============================================================================
-- 4. TABLA: feed_story_comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_story_comments (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  story_id UUID NOT NULL REFERENCES feed_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feed_story_comments(id) ON DELETE CASCADE,

  -- Contenido
  content TEXT NOT NULL,

  -- Engagement
  likes_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feed_story_comments IS 'Comentarios en microhistorias del feed (1 nivel de anidación)';
COMMENT ON COLUMN feed_story_comments.parent_id IS 'NULL = comentario principal | UUID = respuesta a comentario';

-- ============================================================================
-- 5. TABLA: feed_comment_likes (opcional, para sistema completo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_comment_likes (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES feed_story_comments(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_comment_like UNIQUE(user_id, comment_id)
);

COMMENT ON TABLE feed_comment_likes IS 'Tracking de likes en comentarios de microhistorias';

-- ============================================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Prompts: Queries frecuentes por estado y fecha
CREATE INDEX IF NOT EXISTS idx_feed_prompts_status_date
ON feed_prompts(status, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_feed_prompts_week_year
ON feed_prompts(year DESC, week_number DESC);

CREATE INDEX IF NOT EXISTS idx_feed_prompts_created_by
ON feed_prompts(created_by);

-- Stories: Queries por prompt y usuario
CREATE INDEX IF NOT EXISTS idx_feed_stories_prompt_date
ON feed_stories(prompt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_stories_user_date
ON feed_stories(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_stories_prompt_user
ON feed_stories(prompt_id, user_id);

-- Likes: Lookups por historia y usuario
CREATE INDEX IF NOT EXISTS idx_feed_story_likes_story
ON feed_story_likes(story_id);

CREATE INDEX IF NOT EXISTS idx_feed_story_likes_user
ON feed_story_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_feed_story_likes_user_story
ON feed_story_likes(user_id, story_id);

-- Comments: Queries por historia y threads
CREATE INDEX IF NOT EXISTS idx_feed_story_comments_story_date
ON feed_story_comments(story_id, created_at);

CREATE INDEX IF NOT EXISTS idx_feed_story_comments_parent
ON feed_story_comments(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feed_story_comments_user
ON feed_story_comments(user_id);

-- Comment likes: Lookups similares a story likes
CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_comment
ON feed_comment_likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_user
ON feed_comment_likes(user_id);

-- ============================================================================
-- 7. FUNCIONES SQL - Auto-archivar prompts expirados
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_archive_expired_prompts()
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- Archivar todos los prompts activos cuya fecha de fin ya pasó
  WITH archived AS (
    UPDATE feed_prompts
    SET
      status = 'archived',
      updated_at = NOW()
    WHERE status = 'active'
      AND end_date < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_archived_count FROM archived;

  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_archive_expired_prompts IS 'Archiva automáticamente prompts cuya fecha de fin ya pasó. Retorna cantidad archivada.';

-- ============================================================================
-- 8. FUNCIONES SQL - Toggle like en microhistoria
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_feed_story_like(
  p_user_id UUID,
  p_story_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_like_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Verificar si ya existe el like
  SELECT id INTO v_like_id
  FROM feed_story_likes
  WHERE user_id = p_user_id AND story_id = p_story_id;

  IF v_like_id IS NOT NULL THEN
    -- Unlike: Eliminar like existente
    DELETE FROM feed_story_likes WHERE id = v_like_id;

    -- Obtener nuevo contador
    SELECT likes_count INTO v_new_count
    FROM feed_stories
    WHERE id = p_story_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'unliked',
      'likes_count', v_new_count
    );
  ELSE
    -- Like: Crear nuevo like
    INSERT INTO feed_story_likes (user_id, story_id)
    VALUES (p_user_id, p_story_id)
    RETURNING id INTO v_like_id;

    -- Obtener nuevo contador
    SELECT likes_count INTO v_new_count
    FROM feed_stories
    WHERE id = p_story_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'liked',
      'like_id', v_like_id,
      'likes_count', v_new_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION toggle_feed_story_like IS 'Toggle like/unlike en microhistoria. Retorna acción realizada y nuevo contador.';

-- ============================================================================
-- 9. FUNCIONES SQL - Check user like
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_feed_story_like(
  p_user_id UUID,
  p_story_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM feed_story_likes
    WHERE user_id = p_user_id AND story_id = p_story_id
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_feed_story_like IS 'Verifica si un usuario dio like a una microhistoria específica.';

-- ============================================================================
-- 10. FUNCIONES SQL - Batch loading de likes
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_feed_story_likes_batch(
  p_user_id UUID,
  p_story_ids UUID[]
)
RETURNS TABLE(story_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT fsl.story_id
  FROM feed_story_likes fsl
  WHERE fsl.user_id = p_user_id
    AND fsl.story_id = ANY(p_story_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_feed_story_likes_batch IS 'Obtiene IDs de historias a las que el usuario dio like. Para batch loading de estado UI.';

-- ============================================================================
-- 11. FUNCIONES SQL - Toggle like en comentario
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_feed_comment_like(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_like_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Verificar si ya existe el like
  SELECT id INTO v_like_id
  FROM feed_comment_likes
  WHERE user_id = p_user_id AND comment_id = p_comment_id;

  IF v_like_id IS NOT NULL THEN
    -- Unlike
    DELETE FROM feed_comment_likes WHERE id = v_like_id;

    SELECT likes_count INTO v_new_count
    FROM feed_story_comments
    WHERE id = p_comment_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'unliked',
      'likes_count', v_new_count
    );
  ELSE
    -- Like
    INSERT INTO feed_comment_likes (user_id, comment_id)
    VALUES (p_user_id, p_comment_id)
    RETURNING id INTO v_like_id;

    SELECT likes_count INTO v_new_count
    FROM feed_story_comments
    WHERE id = p_comment_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'liked',
      'like_id', v_like_id,
      'likes_count', v_new_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION toggle_feed_comment_like IS 'Toggle like/unlike en comentario de microhistoria.';

-- ============================================================================
-- 12. TRIGGERS - Actualizar contadores automáticamente
-- ============================================================================

-- Trigger: Actualizar likes_count en feed_stories
CREATE OR REPLACE FUNCTION update_feed_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_stories
    SET likes_count = likes_count + 1
    WHERE id = NEW.story_id;

    -- También actualizar total_likes del prompt
    UPDATE feed_prompts
    SET total_likes = total_likes + 1
    WHERE id = (SELECT prompt_id FROM feed_stories WHERE id = NEW.story_id);

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_stories
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.story_id;

    -- También actualizar total_likes del prompt
    UPDATE feed_prompts
    SET total_likes = GREATEST(0, total_likes - 1)
    WHERE id = (SELECT prompt_id FROM feed_stories WHERE id = OLD.story_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_feed_story_likes_count ON feed_story_likes;
CREATE TRIGGER trigger_update_feed_story_likes_count
  AFTER INSERT OR DELETE ON feed_story_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_story_likes_count();

COMMENT ON FUNCTION update_feed_story_likes_count IS 'Mantiene sincronizado likes_count en feed_stories y total_likes en feed_prompts';

-- Trigger: Actualizar likes_count en feed_story_comments
CREATE OR REPLACE FUNCTION update_feed_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_story_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_story_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_feed_comment_likes_count ON feed_comment_likes;
CREATE TRIGGER trigger_update_feed_comment_likes_count
  AFTER INSERT OR DELETE ON feed_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_comment_likes_count();

-- Trigger: Actualizar stories_count en feed_prompts
CREATE OR REPLACE FUNCTION update_feed_prompt_stories_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_prompts
    SET stories_count = stories_count + 1
    WHERE id = NEW.prompt_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_prompts
    SET stories_count = GREATEST(0, stories_count - 1)
    WHERE id = OLD.prompt_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_feed_prompt_stories_count ON feed_stories;
CREATE TRIGGER trigger_update_feed_prompt_stories_count
  AFTER INSERT OR DELETE ON feed_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_prompt_stories_count();

-- Trigger: Actualizar comments_count en feed_stories
CREATE OR REPLACE FUNCTION update_feed_story_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_stories
    SET comments_count = comments_count + 1
    WHERE id = NEW.story_id;

    -- También actualizar total_comments del prompt
    UPDATE feed_prompts
    SET total_comments = total_comments + 1
    WHERE id = (SELECT prompt_id FROM feed_stories WHERE id = NEW.story_id);

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_stories
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.story_id;

    -- También actualizar total_comments del prompt
    UPDATE feed_prompts
    SET total_comments = GREATEST(0, total_comments - 1)
    WHERE id = (SELECT prompt_id FROM feed_stories WHERE id = OLD.story_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_feed_story_comments_count ON feed_story_comments;
CREATE TRIGGER trigger_update_feed_story_comments_count
  AFTER INSERT OR DELETE ON feed_story_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_story_comments_count();

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS) - feed_prompts
-- ============================================================================

ALTER TABLE feed_prompts ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos pueden ver prompts activos y archivados (no drafts)
DROP POLICY IF EXISTS "Anyone can view active/archived prompts" ON feed_prompts;
CREATE POLICY "Anyone can view active/archived prompts"
ON feed_prompts FOR SELECT
USING (status IN ('active', 'archived'));

-- Lectura (admins): Admins pueden ver todos incluyendo drafts
DROP POLICY IF EXISTS "Admins can view all prompts" ON feed_prompts;
CREATE POLICY "Admins can view all prompts"
ON feed_prompts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Inserción: Solo admins
DROP POLICY IF EXISTS "Only admins can create prompts" ON feed_prompts;
CREATE POLICY "Only admins can create prompts"
ON feed_prompts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Actualización: Solo admins
DROP POLICY IF EXISTS "Only admins can update prompts" ON feed_prompts;
CREATE POLICY "Only admins can update prompts"
ON feed_prompts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Eliminación: Solo admins
DROP POLICY IF EXISTS "Only admins can delete prompts" ON feed_prompts;
CREATE POLICY "Only admins can delete prompts"
ON feed_prompts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) - feed_stories
-- ============================================================================

ALTER TABLE feed_stories ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos pueden ver historias de prompts activos/archivados
DROP POLICY IF EXISTS "Anyone can view stories from active/archived prompts" ON feed_stories;
CREATE POLICY "Anyone can view stories from active/archived prompts"
ON feed_stories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = feed_stories.prompt_id
    AND status IN ('active', 'archived')
  )
);

-- Inserción: Usuarios autenticados, solo en prompts activos
DROP POLICY IF EXISTS "Users can create stories in active prompts" ON feed_stories;
CREATE POLICY "Users can create stories in active prompts"
ON feed_stories FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = prompt_id AND status = 'active'
  )
);

-- Actualización: Solo autor, solo en prompts activos
DROP POLICY IF EXISTS "Users can update own stories in active prompts" ON feed_stories;
CREATE POLICY "Users can update own stories in active prompts"
ON feed_stories FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = prompt_id AND status = 'active'
  )
);

-- Eliminación: Autor o admin, solo en prompts activos
DROP POLICY IF EXISTS "Users can delete own stories in active prompts" ON feed_stories;
CREATE POLICY "Users can delete own stories in active prompts"
ON feed_stories FOR DELETE
USING (
  (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ))
  AND EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = prompt_id AND status = 'active'
  )
);

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS) - feed_story_likes
-- ============================================================================

ALTER TABLE feed_story_likes ENABLE ROW LEVEL SECURITY;

-- Lectura: Público
DROP POLICY IF EXISTS "Anyone can view story likes" ON feed_story_likes;
CREATE POLICY "Anyone can view story likes"
ON feed_story_likes FOR SELECT
USING (true);

-- Inserción: Usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can like stories" ON feed_story_likes;
CREATE POLICY "Authenticated users can like stories"
ON feed_story_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Eliminación: Solo propios likes
DROP POLICY IF EXISTS "Users can unlike own likes" ON feed_story_likes;
CREATE POLICY "Users can unlike own likes"
ON feed_story_likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) - feed_story_comments
-- ============================================================================

ALTER TABLE feed_story_comments ENABLE ROW LEVEL SECURITY;

-- Lectura: Público
DROP POLICY IF EXISTS "Anyone can view comments" ON feed_story_comments;
CREATE POLICY "Anyone can view comments"
ON feed_story_comments FOR SELECT
USING (true);

-- Inserción: Usuarios autenticados, solo en prompts activos
DROP POLICY IF EXISTS "Users can comment in active prompts" ON feed_story_comments;
CREATE POLICY "Users can comment in active prompts"
ON feed_story_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_stories fs
    JOIN feed_prompts fp ON fs.prompt_id = fp.id
    WHERE fs.id = story_id AND fp.status = 'active'
  )
);

-- Actualización: Solo autor
DROP POLICY IF EXISTS "Users can update own comments" ON feed_story_comments;
CREATE POLICY "Users can update own comments"
ON feed_story_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Eliminación: Autor o admin
DROP POLICY IF EXISTS "Users can delete own comments or admins" ON feed_story_comments;
CREATE POLICY "Users can delete own comments or admins"
ON feed_story_comments FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- 17. ROW LEVEL SECURITY (RLS) - feed_comment_likes
-- ============================================================================

ALTER TABLE feed_comment_likes ENABLE ROW LEVEL SECURITY;

-- Lectura: Público
DROP POLICY IF EXISTS "Anyone can view comment likes" ON feed_comment_likes;
CREATE POLICY "Anyone can view comment likes"
ON feed_comment_likes FOR SELECT
USING (true);

-- Inserción: Usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can like comments" ON feed_comment_likes;
CREATE POLICY "Authenticated users can like comments"
ON feed_comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Eliminación: Solo propios likes
DROP POLICY IF EXISTS "Users can unlike own comment likes" ON feed_comment_likes;
CREATE POLICY "Users can unlike own comment likes"
ON feed_comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 18. HELPER FUNCTION - Calcular word count
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_word_count(p_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Contar palabras separadas por espacios, eliminando espacios múltiples
  RETURN array_length(
    regexp_split_to_array(
      regexp_replace(TRIM(p_text), '\s+', ' ', 'g'),
      ' '
    ),
    1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_word_count IS 'Calcula número de palabras en un texto. Útil para validar word_count antes de INSERT.';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- Verificación post-migración (ejecutar después de aplicar):
/*
SELECT 'feed_prompts' as table_name, COUNT(*) as rows FROM feed_prompts
UNION ALL
SELECT 'feed_stories', COUNT(*) FROM feed_stories
UNION ALL
SELECT 'feed_story_likes', COUNT(*) FROM feed_story_likes
UNION ALL
SELECT 'feed_story_comments', COUNT(*) FROM feed_story_comments
UNION ALL
SELECT 'feed_comment_likes', COUNT(*) FROM feed_comment_likes;

-- Verificar funciones
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'feed%'
  OR routine_name LIKE '%feed%'
ORDER BY routine_name;

-- Verificar triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%feed%'
ORDER BY event_object_table, trigger_name;
*/
