-- notifications_triggers_only.sql
-- Solo triggers y funciones para notificaciones automáticas de comentarios
-- Para usar con tabla notifications existente

-- 1. Función para crear notificaciones de comentarios
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    story_author_id UUID;
    story_title TEXT;
    commenter_name TEXT;
BEGIN
    -- Obtener el autor de la historia y el título
    SELECT s.user_id, s.title 
    INTO story_author_id, story_title
    FROM stories s 
    WHERE s.id = NEW.story_id;
    
    -- Obtener el nombre del comentarista
    SELECT COALESCE(up.display_name, 'Usuario anónimo')
    INTO commenter_name
    FROM user_profiles up
    WHERE up.id = NEW.user_id;
    
    -- Solo notificar si el comentario no es del autor de la historia
    IF story_author_id IS NOT NULL AND story_author_id != NEW.user_id THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            is_read,
            created_at
        ) VALUES (
            story_author_id,
            'comment_received',
            '💬 Nuevo comentario en tu historia',
            commenter_name || ' comentó en "' || story_title || '"',
            jsonb_build_object(
                'story_id', NEW.story_id,
                'comment_id', NEW.id,
                'commenter_id', NEW.user_id,
                'commenter_name', commenter_name,
                'story_title', story_title
            ),
            false,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger para notificaciones de comentarios
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;
CREATE TRIGGER trigger_notify_new_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_comment();

-- 3. Función para limpiar notificaciones antiguas (opcional - ejecutar manualmente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar notificaciones de más de 30 días que ya fueron leídas
    DELETE FROM notifications 
    WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- También eliminar notificaciones muy antiguas (más de 90 días) aunque no estén leídas
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para marcar notificaciones como leídas (para el hook)
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
    target_user_id UUID,
    notification_ids UUID[] DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF notification_ids IS NULL THEN
        -- Marcar todas las notificaciones del usuario como leídas
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE user_id = target_user_id AND is_read = false;
    ELSE
        -- Marcar notificaciones específicas como leídas
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE user_id = target_user_id 
        AND id = ANY(notification_ids) 
        AND is_read = false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para crear notificaciones manuales (para testing/admin)
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_type VARCHAR(50),
    notification_title VARCHAR(255),
    notification_message TEXT,
    notification_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
    ) VALUES (
        target_user_id,
        notification_type,
        notification_title,
        notification_message,
        notification_data,
        false,
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verificar que todo esté funcionando
DO $$
BEGIN
    RAISE NOTICE '✅ Funciones y triggers de notificaciones creados exitosamente';
    RAISE NOTICE '📝 Trigger activo para comentarios en tabla: comments';
    RAISE NOTICE '🔔 Notificaciones se crearán automáticamente al comentar';
    RAISE NOTICE '🧹 Ejecuta SELECT cleanup_old_notifications(); para limpiar notificaciones antiguas';
END $$;