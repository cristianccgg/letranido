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

-- 2. Función para obtener usuarios que quieren emails regulares (simplificado)
CREATE OR REPLACE FUNCTION get_regular_email_recipients()
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
    AND up.email_notifications = true  -- Solo verificar el campo maestro
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para obtener usuarios que quieren emails esenciales (todos los usuarios con email válido)
CREATE OR REPLACE FUNCTION get_essential_email_recipients()
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
    -- Los emails esenciales van a todos los usuarios con email válido
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para estadísticas de notificaciones (simplificado)
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE(
  total_users bigint,
  users_with_email bigint,
  regular_subscribers bigint,
  essential_eligible bigint,
  no_notifications bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.user_profiles),
    (SELECT COUNT(*) FROM public.user_profiles WHERE email IS NOT NULL AND email != ''),
    (SELECT COUNT(*) FROM public.user_profiles WHERE email_notifications = true AND email IS NOT NULL),
    (SELECT COUNT(*) FROM public.user_profiles WHERE email IS NOT NULL AND email != ''),
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
    WHEN 'regular' THEN
      RETURN EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = user_email 
        AND email_notifications = true
      );
    WHEN 'essential' THEN
      RETURN EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = user_email 
        AND email IS NOT NULL 
        AND email != ''
      );
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener usuarios que necesitan recordatorio (NO han enviado historia al concurso)
CREATE OR REPLACE FUNCTION get_reminder_email_recipients(contest_id_param uuid)
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
    AND up.email_notifications = true
    AND NOT EXISTS (
      SELECT 1 FROM public.stories s 
      WHERE s.user_id = up.id 
      AND s.contest_id = contest_id_param
    )
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Comentarios para documentación
COMMENT ON FUNCTION get_contest_email_recipients() IS 'LEGACY: Obtiene usuarios con contest_notifications activo (usado para migración)';
COMMENT ON FUNCTION get_regular_email_recipients() IS 'SISTEMA SIMPLIFICADO: Obtiene usuarios que quieren recibir emails (concursos, newsletter, tips)';
COMMENT ON FUNCTION get_essential_email_recipients() IS 'Obtiene todos los usuarios con email válido para emails esenciales';
COMMENT ON FUNCTION get_reminder_email_recipients(uuid) IS 'LEGACY: Obtiene usuarios que necesitan recordatorio (usado para migración)';
COMMENT ON FUNCTION get_notification_stats() IS 'Obtiene estadísticas simplificadas de notificaciones';
COMMENT ON FUNCTION validate_email_recipient(text, text) IS 'Valida si un email puede recibir un tipo específico de notificación';

-- Ejemplos de uso:
-- SELECT * FROM get_regular_email_recipients();
-- SELECT * FROM get_essential_email_recipients();
-- SELECT * FROM get_notification_stats();
-- SELECT validate_email_recipient('usuario@example.com', 'regular');
-- SELECT validate_email_recipient('usuario@example.com', 'essential');