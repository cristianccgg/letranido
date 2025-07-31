-- notifications_triggers_fixed.sql
-- Versión corregida que elimina funciones existentes primero

-- 1. Eliminar funciones existentes que pueden tener conflictos
DROP FUNCTION IF EXISTS mark_notifications_as_read(uuid, uuid[]);
DROP FUNCTION IF EXISTS create_notification(uuid, varchar, varchar, text, jsonb);
DROP FUNCTION IF EXISTS notify_new_comment();
DROP FUNCTION IF EXISTS cleanup_old_notifications();

-- 2. Eliminar triggers existentes
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;

-- 3. Crear función para notificaciones de comentarios
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
    
    -- Solo continuar si encontramos la historia
    IF story_author_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- No notificar si el comentario es del autor de la historia
    IF story_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Obtener el nombre del comentarista
    SELECT COALESCE(up.display_name, au.email, 'Usuario anónimo')
    INTO commenter_name
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.id = au.id
    WHERE au.id = NEW.user_id;
    
    -- Crear la notificación
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay error, log pero no fallar
        RAISE WARNING 'Error creando notificación de comentario: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger para comentarios
CREATE TRIGGER trigger_notify_new_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_comment();

-- 5. Función para marcar notificaciones como leídas (compatible con hook existente)
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error marcando notificaciones como leídas: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para crear notificaciones manuales (para testing/admin)
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_type VARCHAR(50),
    notification_title VARCHAR(255),
    notification_message TEXT,
    notification_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Evitar duplicados recientes (misma notificación en últimas 2 horas)
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = target_user_id 
        AND type = notification_type 
        AND title = notification_title
        AND created_at > NOW() - INTERVAL '2 hours'
    ) THEN
        RETURN false; -- Ya existe una notificación similar reciente
    END IF;
    
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para limpiar notificaciones antiguas (ejecutar manualmente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Eliminar notificaciones leídas de más de 30 días
    DELETE FROM notifications 
    WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Eliminar notificaciones muy antiguas (más de 90 días) aunque no estén leídas
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error limpiando notificaciones: %', SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar instalación
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de notificaciones instalado correctamente';
    RAISE NOTICE '🔔 Trigger activo: comentarios → notificaciones automáticas';
    RAISE NOTICE '📝 Funciones disponibles:';
    RAISE NOTICE '   - notify_new_comment() (automática)';
    RAISE NOTICE '   - mark_notifications_as_read(user_id, notification_ids[])';
    RAISE NOTICE '   - create_notification(user_id, type, title, message, data)';
    RAISE NOTICE '   - cleanup_old_notifications()';
    RAISE NOTICE '🧪 Para probar: comenta en una historia de otro usuario';
END $$;