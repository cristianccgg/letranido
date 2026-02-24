-- ============================================================================
-- MIGRACIÓN: Notificaciones para el sistema de Feed (Microhistorias)
-- Fecha: Febrero 2026
-- Propósito: Notificar a autores cuando reciben likes o comentarios en su
--            microhistoria, y cuando alguien responde a su comentario.
-- ============================================================================
-- EJECUTAR EN: Supabase SQL Editor (producción)
-- PREREQUISITO: Sistema de notificaciones base ya instalado
--               (notifications_triggers_fixed.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: Like en microhistoria → notificar al autor
-- ----------------------------------------------------------------------------
-- Lógica de deduplicación: no notificar el mismo like dos veces (el toggle
-- puede insertar/eliminar). Solo se notifica en INSERT (cuando le dan like),
-- no en DELETE (cuando lo quitan).
-- Protección adicional: no notificarse a uno mismo.

CREATE OR REPLACE FUNCTION notify_feed_story_like()
RETURNS TRIGGER AS $$
DECLARE
    v_story_author_id UUID;
    v_story_title TEXT;
    v_liker_name TEXT;
BEGIN
    -- Obtener autor y título de la microhistoria
    SELECT fs.user_id, COALESCE(fs.title, 'tu microhistoria')
    INTO v_story_author_id, v_story_title
    FROM feed_stories fs
    WHERE fs.id = NEW.story_id;

    -- Si no existe la historia, ignorar
    IF v_story_author_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- No notificar si el autor se da like a sí mismo
    IF v_story_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del usuario que dio like
    SELECT COALESCE(up.display_name, au.email, 'Alguien')
    INTO v_liker_name
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.id = au.id
    WHERE au.id = NEW.user_id;

    -- Insertar notificación
    -- Sin deduplicación estricta aquí: si alguien quita y vuelve a dar like
    -- después de un tiempo, sí queremos notificar de nuevo.
    -- La deduplicación natural del toggle_feed_story_like previene spam.
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
    ) VALUES (
        v_story_author_id,
        'feed_story_liked',
        '❤️ A alguien le gustó tu microhistoria',
        v_liker_name || ' le dio like a "' || v_story_title || '"',
        jsonb_build_object(
            'story_id', NEW.story_id,
            'liker_id', NEW.user_id,
            'liker_name', v_liker_name,
            'story_title', v_story_title
        ),
        false,
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de like en microhistoria: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_feed_story_like ON feed_story_likes;
CREATE TRIGGER trigger_notify_feed_story_like
    AFTER INSERT ON feed_story_likes
    FOR EACH ROW
    EXECUTE FUNCTION notify_feed_story_like();


-- ----------------------------------------------------------------------------
-- 2. TRIGGER: Comentario en microhistoria → notificar al autor
-- ----------------------------------------------------------------------------
-- Solo comentarios raíz (parent_id IS NULL). Las respuestas se manejan
-- en el trigger siguiente.

CREATE OR REPLACE FUNCTION notify_feed_story_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_story_author_id UUID;
    v_story_title TEXT;
    v_commenter_name TEXT;
BEGIN
    -- Solo procesar comentarios raíz (no respuestas)
    IF NEW.parent_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener autor y título de la microhistoria
    SELECT fs.user_id, COALESCE(fs.title, 'tu microhistoria')
    INTO v_story_author_id, v_story_title
    FROM feed_stories fs
    WHERE fs.id = NEW.story_id;

    IF v_story_author_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- No notificar si el autor se comenta a sí mismo
    IF v_story_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del comentarista
    SELECT COALESCE(up.display_name, au.email, 'Alguien')
    INTO v_commenter_name
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.id = au.id
    WHERE au.id = NEW.user_id;

    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
    ) VALUES (
        v_story_author_id,
        'feed_story_commented',
        '💬 Comentaron en tu microhistoria',
        v_commenter_name || ' comentó en "' || v_story_title || '"',
        jsonb_build_object(
            'story_id', NEW.story_id,
            'comment_id', NEW.id,
            'commenter_id', NEW.user_id,
            'commenter_name', v_commenter_name,
            'story_title', v_story_title
        ),
        false,
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de comentario en microhistoria: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_feed_story_comment ON feed_story_comments;
CREATE TRIGGER trigger_notify_feed_story_comment
    AFTER INSERT ON feed_story_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_feed_story_comment();


-- ----------------------------------------------------------------------------
-- 3. TRIGGER: Respuesta a un comentario → notificar al autor del comentario
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION notify_feed_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_author_id UUID;
    v_replier_name TEXT;
    v_story_title TEXT;
BEGIN
    -- Solo procesar respuestas (parent_id NOT NULL)
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener el autor del comentario padre
    SELECT fsc.user_id
    INTO v_parent_author_id
    FROM feed_story_comments fsc
    WHERE fsc.id = NEW.parent_id;

    IF v_parent_author_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- No notificar si se responde a sí mismo
    IF v_parent_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del que responde
    SELECT COALESCE(up.display_name, au.email, 'Alguien')
    INTO v_replier_name
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.id = au.id
    WHERE au.id = NEW.user_id;

    -- Obtener título de la historia para contexto
    SELECT COALESCE(fs.title, 'una microhistoria')
    INTO v_story_title
    FROM feed_stories fs
    WHERE fs.id = NEW.story_id;

    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
    ) VALUES (
        v_parent_author_id,
        'feed_comment_reply',
        '↩️ Respondieron a tu comentario',
        v_replier_name || ' respondió a tu comentario en "' || v_story_title || '"',
        jsonb_build_object(
            'story_id', NEW.story_id,
            'comment_id', NEW.id,
            'parent_comment_id', NEW.parent_id,
            'replier_id', NEW.user_id,
            'replier_name', v_replier_name,
            'story_title', v_story_title
        ),
        false,
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de respuesta a comentario: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_feed_comment_reply ON feed_story_comments;
CREATE TRIGGER trigger_notify_feed_comment_reply
    AFTER INSERT ON feed_story_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_feed_comment_reply();


-- ----------------------------------------------------------------------------
-- Verificación
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE '✅ Notificaciones del feed instaladas correctamente';
    RAISE NOTICE '❤️  Trigger: like en microhistoria → notifica al autor';
    RAISE NOTICE '💬  Trigger: comentario en microhistoria → notifica al autor';
    RAISE NOTICE '↩️  Trigger: respuesta a comentario → notifica al comentarista';
    RAISE NOTICE '';
    RAISE NOTICE 'Tipos de notificación nuevos:';
    RAISE NOTICE '   - feed_story_liked';
    RAISE NOTICE '   - feed_story_commented';
    RAISE NOTICE '   - feed_comment_reply';
END $$;
