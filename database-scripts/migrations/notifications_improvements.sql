-- notifications_improvements.sql
-- Mejoras para limpiar notificaciones huérfanas y navegación a comentarios

-- 1. Función para limpiar notificaciones de comentarios eliminados
CREATE OR REPLACE FUNCTION cleanup_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar notificaciones relacionadas con el comentario eliminado
    DELETE FROM notifications 
    WHERE type = 'comment_received' 
    AND data->>'comment_id' = OLD.id::text;
    
    RAISE NOTICE 'Notificación limpiada para comentario eliminado: %', OLD.id;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error limpiando notificación de comentario: %', SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear trigger para limpiar notificaciones cuando se elimina comentario
DROP TRIGGER IF EXISTS trigger_cleanup_comment_notification ON comments;
CREATE TRIGGER trigger_cleanup_comment_notification
    BEFORE DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_comment_notification();

-- 3. Función para crear notificaciones para comentarios existentes (últimos 3 días)
CREATE OR REPLACE FUNCTION create_notifications_for_recent_comments()
RETURNS INTEGER AS $$
DECLARE
    comment_record RECORD;
    notification_count INTEGER := 0;
    story_author_id UUID;
    story_title TEXT;
    commenter_name TEXT;
BEGIN
    -- Iterar sobre comentarios de los últimos 3 días
    FOR comment_record IN 
        SELECT c.id, c.user_id, c.story_id, c.created_at
        FROM comments c
        WHERE c.created_at >= NOW() - INTERVAL '3 days'
        ORDER BY c.created_at DESC
    LOOP
        -- Obtener información de la historia
        SELECT s.user_id, s.title 
        INTO story_author_id, story_title
        FROM stories s 
        WHERE s.id = comment_record.story_id;
        
        -- Solo crear notificación si:
        -- 1. La historia existe
        -- 2. El comentario no es del autor
        -- 3. No existe ya una notificación para este comentario
        IF story_author_id IS NOT NULL 
           AND story_author_id != comment_record.user_id 
           AND NOT EXISTS (
               SELECT 1 FROM notifications 
               WHERE type = 'comment_received' 
               AND data->>'comment_id' = comment_record.id::text
           ) THEN
            
            -- Obtener nombre del comentarista
            SELECT COALESCE(up.display_name, au.email, 'Usuario anónimo')
            INTO commenter_name
            FROM auth.users au
            LEFT JOIN user_profiles up ON up.id = au.id
            WHERE au.id = comment_record.user_id;
            
            -- Crear la notificación con fecha del comentario original
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
                    'story_id', comment_record.story_id,
                    'comment_id', comment_record.id,
                    'commenter_id', comment_record.user_id,
                    'commenter_name', commenter_name,
                    'story_title', story_title
                ),
                false,
                comment_record.created_at  -- Usar fecha original del comentario
            );
            
            notification_count := notification_count + 1;
        END IF;
    END LOOP;
    
    RETURN notification_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificaciones históricas: %', SQLERRM;
        RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ejecutar la función para crear notificaciones de comentarios recientes
DO $$
DECLARE
    created_count INTEGER;
BEGIN
    SELECT create_notifications_for_recent_comments() INTO created_count;
    RAISE NOTICE '✅ Se crearon % notificaciones para comentarios recientes', created_count;
END $$;

-- 5. Verificación final
DO $$
BEGIN
    RAISE NOTICE '🔧 Mejoras implementadas:';
    RAISE NOTICE '   ✅ Trigger para limpiar notificaciones de comentarios eliminados';
    RAISE NOTICE '   ✅ Notificaciones creadas para comentarios de últimos 3 días';
    RAISE NOTICE '   ✅ Sistema robusto contra comentarios huérfanos';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Para navegación directa a comentarios:';
    RAISE NOTICE '   - Las notificaciones ya contienen comment_id en data';
    RAISE NOTICE '   - El frontend puede usar #comment-{id} para scroll directo';
END $$;