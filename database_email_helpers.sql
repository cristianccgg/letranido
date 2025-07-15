-- Funciones helper para gestión de emails por tipo
-- Ejecutar en Supabase SQL Editor DESPUÉS de la migración

-- 1. Función para obtener usuarios que quieren emails de concursos
CREATE OR REPLACE FUNCTION get_contest_email_recipients()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.display_name,
    up.created_at
  FROM public.user_profiles up
  WHERE 
    up.email IS NOT NULL 
    AND up.email != ''
    AND up.contest_notifications = true
    AND up.email_notifications = true  -- Campo maestro debe estar activo
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para obtener usuarios que quieren emails generales
CREATE OR REPLACE FUNCTION get_general_email_recipients()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.display_name,
    up.created_at
  FROM public.user_profiles up
  WHERE 
    up.email IS NOT NULL 
    AND up.email != ''
    AND up.general_notifications = true
    AND up.email_notifications = true  -- Campo maestro debe estar activo
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para obtener usuarios que quieren emails de marketing
CREATE OR REPLACE FUNCTION get_marketing_email_recipients()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.display_name,
    up.created_at
  FROM public.user_profiles up
  WHERE 
    up.email IS NOT NULL 
    AND up.email != ''
    AND up.marketing_notifications = true
    AND up.email_notifications = true  -- Campo maestro debe estar activo
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para estadísticas de notificaciones
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE(
  total_users bigint,
  users_with_email bigint,
  contest_subscribers bigint,
  general_subscribers bigint,
  marketing_subscribers bigint,
  no_notifications bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.user_profiles),
    (SELECT COUNT(*) FROM public.user_profiles WHERE email IS NOT NULL AND email != ''),
    (SELECT COUNT(*) FROM public.user_profiles WHERE contest_notifications = true AND email IS NOT NULL),
    (SELECT COUNT(*) FROM public.user_profiles WHERE general_notifications = true AND email IS NOT NULL),
    (SELECT COUNT(*) FROM public.user_profiles WHERE marketing_notifications = true AND email IS NOT NULL),
    (SELECT COUNT(*) FROM public.user_profiles WHERE email_notifications = false OR email IS NULL);
END;
$$ LANGUAGE plpgsql;

-- 5. Función para validar email antes de envío (seguridad)
CREATE OR REPLACE FUNCTION validate_email_recipient(user_email text, notification_type text)
RETURNS boolean AS $$
BEGIN
  -- Validar formato de email básico
  IF user_email IS NULL OR user_email = '' THEN
    RETURN false;
  END IF;
  
  -- Validar que contenga @ y .
  IF user_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RETURN false;
  END IF;
  
  -- Verificar que el usuario tenga activo ese tipo de notificación
  CASE notification_type
    WHEN 'contest' THEN
      RETURN EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = user_email 
        AND contest_notifications = true 
        AND email_notifications = true
      );
    WHEN 'general' THEN
      RETURN EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = user_email 
        AND general_notifications = true 
        AND email_notifications = true
      );
    WHEN 'marketing' THEN
      RETURN EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = user_email 
        AND marketing_notifications = true 
        AND email_notifications = true
      );
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentarios para documentación
COMMENT ON FUNCTION get_contest_email_recipients() IS 'Obtiene todos los usuarios que quieren recibir emails sobre concursos';
COMMENT ON FUNCTION get_general_email_recipients() IS 'Obtiene todos los usuarios que quieren recibir emails generales';
COMMENT ON FUNCTION get_marketing_email_recipients() IS 'Obtiene todos los usuarios que quieren recibir emails de marketing';
COMMENT ON FUNCTION get_notification_stats() IS 'Obtiene estadísticas de suscripciones a notificaciones';
COMMENT ON FUNCTION validate_email_recipient(text, text) IS 'Valida si un email puede recibir un tipo específico de notificación';

-- Ejemplos de uso:
-- SELECT * FROM get_contest_email_recipients();
-- SELECT * FROM get_notification_stats();
-- SELECT validate_email_recipient('usuario@example.com', 'contest');