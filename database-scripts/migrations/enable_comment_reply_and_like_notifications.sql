-- ============================================================================
-- MIGRACIÓN: Notificaciones de Respuestas a Comentarios y Likes
-- Fecha: Diciembre 2024
-- Propósito: Activar notificaciones cuando alguien responde o da like a un comentario
-- ============================================================================

-- 1. Función para notificar cuando alguien RESPONDE a un comentario
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_author_id UUID;
  v_parent_content TEXT;
  v_replier_name TEXT;
  v_story_title TEXT;
  v_story_id UUID;
BEGIN
  -- Solo procesar si es una respuesta (tiene parent_id)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener el autor del comentario padre
  SELECT user_id, content, story_id
  INTO v_parent_author_id, v_parent_content, v_story_id
  FROM comments
  WHERE id = NEW.parent_id;

  -- No notificar si el usuario se está respondiendo a sí mismo
  IF v_parent_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Obtener nombre del usuario que responde
  SELECT display_name INTO v_replier_name
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Obtener título de la historia
  SELECT title INTO v_story_title
  FROM stories
  WHERE id = v_story_id;

  -- Crear notificación
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_parent_author_id,
    'comment_reply',
    'Nueva respuesta a tu comentario',
    v_replier_name || ' respondió a tu comentario en "' || v_story_title || '"',
    jsonb_build_object(
      'comment_id', NEW.id,
      'parent_comment_id', NEW.parent_id,
      'story_id', v_story_id,
      'story_title', v_story_title,
      'replier_id', NEW.user_id,
      'replier_name', v_replier_name,
      'reply_content', LEFT(NEW.content, 100)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para notificar cuando alguien da LIKE a un comentario
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_author_id UUID;
  v_comment_content TEXT;
  v_liker_name TEXT;
  v_story_title TEXT;
  v_story_id UUID;
  v_existing_notification_id UUID;
  v_current_likes_count INTEGER;
BEGIN
  -- Obtener información del comentario
  SELECT c.user_id, c.content, c.story_id, c.likes_count
  INTO v_comment_author_id, v_comment_content, v_story_id, v_current_likes_count
  FROM comments c
  WHERE c.id = NEW.comment_id;

  -- No notificar si el usuario se da like a sí mismo
  IF v_comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Obtener nombre del usuario que da like
  SELECT display_name INTO v_liker_name
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Obtener título de la historia
  SELECT title INTO v_story_title
  FROM stories
  WHERE id = v_story_id;

  -- Buscar si ya existe una notificación de like para este comentario (últimas 24 horas)
  SELECT id INTO v_existing_notification_id
  FROM notifications
  WHERE user_id = v_comment_author_id
    AND type = 'comment_like'
    AND data->>'comment_id' = NEW.comment_id::text
    AND created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_notification_id IS NOT NULL THEN
    -- Actualizar notificación existente (agrupar likes)
    UPDATE notifications
    SET
      message = CASE
        WHEN v_current_likes_count = 1 THEN v_liker_name || ' le dio like a tu comentario en "' || v_story_title || '"'
        WHEN v_current_likes_count = 2 THEN v_liker_name || ' y otra persona le dieron like a tu comentario'
        ELSE v_liker_name || ' y ' || (v_current_likes_count - 1) || ' personas más le dieron like a tu comentario'
      END,
      data = data || jsonb_build_object(
        'likes_count', v_current_likes_count,
        'last_liker_name', v_liker_name,
        'last_liker_id', NEW.user_id
      ),
      is_read = FALSE,
      updated_at = NOW()
    WHERE id = v_existing_notification_id;
  ELSE
    -- Crear nueva notificación
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_comment_author_id,
      'comment_like',
      'Like en tu comentario',
      v_liker_name || ' le dio like a tu comentario en "' || v_story_title || '"',
      jsonb_build_object(
        'comment_id', NEW.comment_id,
        'story_id', v_story_id,
        'story_title', v_story_title,
        'liker_id', NEW.user_id,
        'liker_name', v_liker_name,
        'likes_count', v_current_likes_count,
        'comment_preview', LEFT(v_comment_content, 100)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear triggers
-- ============================================================================

-- Trigger para respuestas a comentarios
DROP TRIGGER IF EXISTS trigger_notify_comment_reply ON comments;
CREATE TRIGGER trigger_notify_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();

-- Trigger para likes en comentarios
DROP TRIGGER IF EXISTS trigger_notify_comment_like ON comment_likes;
CREATE TRIGGER trigger_notify_comment_like
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_like();

-- 4. Comentarios y documentación
-- ============================================================================

COMMENT ON FUNCTION notify_comment_reply IS 'Crea notificación cuando alguien responde a un comentario del usuario';
COMMENT ON FUNCTION notify_comment_like IS 'Crea/actualiza notificación cuando alguien da like a un comentario del usuario. Agrupa múltiples likes en una sola notificación.';

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================

-- Tipos de notificaciones nuevas:
-- - 'comment_reply': Cuando alguien responde a tu comentario
-- - 'comment_like': Cuando alguien da like a tu comentario

-- Estructura del campo data (JSONB):
-- comment_reply:
--   {
--     "comment_id": "uuid",
--     "parent_comment_id": "uuid",
--     "story_id": "uuid",
--     "story_title": "string",
--     "replier_id": "uuid",
--     "replier_name": "string",
--     "reply_content": "string (primeros 100 chars)"
--   }

-- comment_like:
--   {
--     "comment_id": "uuid",
--     "story_id": "uuid",
--     "story_title": "string",
--     "liker_id": "uuid",
--     "liker_name": "string",
--     "likes_count": number,
--     "comment_preview": "string (primeros 100 chars)"
--   }

-- Optimizaciones:
-- 1. No se notifica si respondes/likeas tu propio comentario
-- 2. Likes se agrupan en una sola notificación (24 horas)
-- 3. La notificación de likes se actualiza con el contador actual

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
