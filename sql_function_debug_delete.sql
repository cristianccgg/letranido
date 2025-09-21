-- Función de debug para identificar el problema
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION debug_delete_user_completely(user_id_to_delete UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  anonymized_stories_count INTEGER := 0;
  auth_deletion_success BOOLEAN := false;
  auth_error_message TEXT;
  profile_exists BOOLEAN := false;
  auth_user_exists BOOLEAN := false;
BEGIN
  -- Obtener usuario actual
  current_user_id := auth.uid();
  RAISE NOTICE 'Usuario ejecutando: %, Target: %', current_user_id, user_id_to_delete;

  -- Verificar si el perfil existe
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = user_id_to_delete) INTO profile_exists;
  RAISE NOTICE 'Perfil existe: %', profile_exists;

  -- Verificar si el usuario auth existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id_to_delete) INTO auth_user_exists;
  RAISE NOTICE 'Auth user existe: %', auth_user_exists;

  -- Verificar permisos
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = current_user_id 
    AND (is_admin = true OR id = user_id_to_delete)
  ) THEN
    RAISE EXCEPTION 'Solo administradores o el propio usuario pueden ejecutar esta función';
  END IF;

  RAISE NOTICE 'Permisos verificados, iniciando eliminación...';

  -- Eliminar perfil primero
  DELETE FROM user_profiles WHERE id = user_id_to_delete;
  RAISE NOTICE 'Perfil eliminado';

  -- Intentar eliminar del auth con logging detallado
  RAISE NOTICE 'Intentando eliminar de auth.users...';
  BEGIN
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    auth_deletion_success := FOUND;
    
    RAISE NOTICE 'DELETE ejecutado, FOUND = %', auth_deletion_success;
    
    -- Verificar si realmente se eliminó
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id_to_delete) INTO auth_user_exists;
    RAISE NOTICE 'Usuario aún existe después del DELETE: %', auth_user_exists;
    
  EXCEPTION WHEN OTHERS THEN
    auth_error_message := SQLERRM;
    RAISE WARNING 'Error al eliminar usuario de auth.users: %', auth_error_message;
  END;

  RETURN json_build_object(
    'success', true, 
    'deleted_user_id', user_id_to_delete,
    'auth_deletion_success', auth_deletion_success,
    'auth_error', COALESCE(auth_error_message, 'none'),
    'current_user', current_user_id
  );
END;
$$;