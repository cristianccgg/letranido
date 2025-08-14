-- Alternativa: Usar el campo preferences (JSONB) existente para notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Migrar datos existentes al formato JSONB
UPDATE public.user_profiles 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'),
  '{notifications}',
  jsonb_build_object(
    'essential', true,
    'contests', COALESCE(email_notifications, true),
    'general', false,
    'marketing', false,
    'email_enabled', COALESCE(email_notifications, true)
  )
)
WHERE preferences->'notifications' IS NULL;

-- 2. Crear índice para consultas de notificaciones
CREATE INDEX IF NOT EXISTS idx_user_profiles_notifications_contests 
ON public.user_profiles USING gin ((preferences->'notifications'->'contests'))
WHERE (preferences->'notifications'->'contests')::boolean = true;

-- 3. Función helper para obtener usuarios con notificaciones específicas
CREATE OR REPLACE FUNCTION get_users_with_notification_type(notification_type text)
RETURNS TABLE(user_id uuid, email text, display_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.display_name
  FROM public.user_profiles up
  WHERE 
    up.email IS NOT NULL 
    AND (up.preferences->'notifications'->notification_type)::boolean = true
    AND (up.preferences->'notifications'->'email_enabled')::boolean = true;
END;
$$ LANGUAGE plpgsql;

-- 4. Ejemplos de uso:
-- Para obtener usuarios que quieren notificaciones de concursos:
-- SELECT * FROM get_users_with_notification_type('contests');

-- Para obtener usuarios que quieren notificaciones generales:
-- SELECT * FROM get_users_with_notification_type('general');

COMMENT ON FUNCTION get_users_with_notification_type IS 'Obtiene usuarios que tienen habilitado un tipo específico de notificación';