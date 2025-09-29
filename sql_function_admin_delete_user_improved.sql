-- Función SQL mejorada con mejor manejo de auth.users
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION admin_delete_user_completely(user_id_to_delete UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del owner
AS $$
DECLARE
  result JSON;
  anonymized_stories_count INTEGER := 0;
  auth_deletion_success BOOLEAN := false;
  auth_error_message TEXT;
BEGIN
  -- Permitir a administradores O a usuarios eliminando su propia cuenta
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR id = user_id_to_delete)
  ) THEN
    RAISE EXCEPTION 'Solo administradores o el propio usuario pueden ejecutar esta función';
  END IF;

  -- Anonimizar TODAS las historias del usuario (preserva integridad de concursos)
  UPDATE stories SET 
    title = '[Historia eliminada]',
    content = 'Este contenido fue eliminado por el usuario.',
    excerpt = 'Contenido eliminado',
    user_id = NULL,
    is_featured = false,
    updated_at = NOW()
  WHERE user_id = user_id_to_delete;
  
  -- Contar historias anonimizadas
  GET DIAGNOSTICS anonymized_stories_count = ROW_COUNT;
  
  RAISE NOTICE 'Anonimizadas % historias del usuario', anonymized_stories_count;

  -- Eliminar comentarios del usuario (sus propios comentarios)
  DELETE FROM comments WHERE user_id = user_id_to_delete;

  -- Eliminar todos los datos personales del usuario
  DELETE FROM user_badges WHERE user_id = user_id_to_delete;
  DELETE FROM notifications WHERE user_id = user_id_to_delete;
  -- Anonimizar votos (preserva integridad de contadores de likes)
  UPDATE votes SET user_id = NULL WHERE user_id = user_id_to_delete;
  DELETE FROM email_subscribers WHERE user_id = user_id_to_delete;
  DELETE FROM reports WHERE reporter_id = user_id_to_delete;
  DELETE FROM feedback_requests WHERE user_id = user_id_to_delete;
  DELETE FROM submission_consents WHERE user_id = user_id_to_delete;
  DELETE FROM cached_rankings WHERE user_id = user_id_to_delete;
  DELETE FROM user_profiles WHERE id = user_id_to_delete;

  -- Intentar eliminar del auth con manejo de errores mejorado
  BEGIN
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    auth_deletion_success := FOUND;
    
    IF auth_deletion_success THEN
      RAISE NOTICE 'Usuario eliminado exitosamente de auth.users';
    ELSE
      RAISE NOTICE 'Usuario no encontrado en auth.users (puede haber sido eliminado previamente)';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    auth_error_message := SQLERRM;
    RAISE WARNING 'Error al eliminar usuario de auth.users: %', auth_error_message;
    -- NO fallar la función completa, solo registrar el error
  END;

  RETURN json_build_object(
    'success', true, 
    'deleted_user_id', user_id_to_delete,
    'anonymized_stories', anonymized_stories_count,
    'auth_deletion_success', auth_deletion_success,
    'auth_error', COALESCE(auth_error_message, 'none')
  );
END;
$$;