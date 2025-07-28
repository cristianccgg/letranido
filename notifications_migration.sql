-- notifications_migration.sql - Sistema de notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'badge', 'like', 'contest_winner', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Datos adicionales (badge_id, story_id, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 3. RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios pueden marcar sus notificaciones como leídas
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Función para crear notificación
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type VARCHAR(50),
  notification_title VARCHAR(255),
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Evitar notificaciones duplicadas recientes (últimas 24 horas)
  IF EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = target_user_id 
    AND type = notification_type 
    AND data = notification_data
    AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RETURN NULL;
  END IF;

  -- Crear la notificación
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para marcar notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  target_user_id UUID,
  notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Marcar todas las notificaciones como leídas
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = target_user_id AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Marcar notificaciones específicas como leídas
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = target_user_id 
    AND id = ANY(notification_ids) 
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para limpiar notificaciones antiguas (más de 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para notificaciones automáticas de badges
CREATE OR REPLACE FUNCTION notify_new_badge() RETURNS TRIGGER AS $$
BEGIN
  -- Obtener información del badge
  DECLARE
    badge_info RECORD;
  BEGIN
    SELECT name, description, tier INTO badge_info
    FROM badge_definitions 
    WHERE id = NEW.badge_id;

    -- Crear notificación
    PERFORM create_notification(
      NEW.user_id,
      'badge',
      '¡Nuevo badge conseguido!',
      'Has conseguido el badge "' || badge_info.name || '"',
      jsonb_build_object(
        'badge_id', NEW.badge_id,
        'badge_name', badge_info.name,
        'badge_tier', badge_info.tier
      )
    );

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para badges
DROP TRIGGER IF EXISTS trigger_notify_new_badge ON user_badges;
CREATE TRIGGER trigger_notify_new_badge
  AFTER INSERT ON user_badges
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_badge();

-- 8. Notificaciones de comentarios ELIMINADAS
-- DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;
-- DROP FUNCTION IF EXISTS notify_new_comment();

-- 9. Trigger para notificaciones de votos/likes
CREATE OR REPLACE FUNCTION notify_new_vote() RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si el voto no es del autor de la historia
  IF NEW.user_id != (SELECT user_id FROM stories WHERE id = NEW.story_id) THEN
    DECLARE
      story_info RECORD;
      voter_name TEXT;
    BEGIN
      -- Obtener información de la historia
      SELECT title, user_id INTO story_info
      FROM stories 
      WHERE id = NEW.story_id;

      -- Solo proceder si encontramos la historia
      IF story_info.user_id IS NOT NULL THEN
        -- Obtener nombre del usuario que votó
        SELECT COALESCE(display_name, email) INTO voter_name
        FROM user_profiles 
        WHERE id = NEW.user_id;

        -- Si no tiene display_name, usar email del auth.users
        IF voter_name IS NULL THEN
          SELECT email INTO voter_name
          FROM auth.users
          WHERE id = NEW.user_id;
        END IF;

        -- Crear notificación para el autor de la historia
        PERFORM create_notification(
          story_info.user_id,
          'like',
          '❤️ Nuevo voto en tu historia',
          COALESCE(voter_name, 'Alguien') || ' votó por "' || story_info.title || '"',
          jsonb_build_object(
            'story_id', NEW.story_id,
            'voter_id', NEW.user_id,
            'voter_name', COALESCE(voter_name, 'Usuario')
          )
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para votos (la tabla se llama "votes")
DROP TRIGGER IF EXISTS trigger_notify_new_vote ON votes;
CREATE TRIGGER trigger_notify_new_vote
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_vote();

-- ✅ MIGRACIÓN COMPLETADA
-- Las notificaciones se crearán automáticamente para:
-- - Nuevos badges conseguidos
-- - Votos en tus historias