-- Función SQL para auto-eliminación de usuario (sin requerir admin)
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION user_delete_own_account()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del owner
AS $$
DECLARE
  user_id_to_delete UUID;
  anonymized_stories_count INTEGER := 0;
  auth_deletion_success BOOLEAN := false;
  auth_error_message TEXT;
BEGIN
  -- Obtener el ID del usuario autenticado
  user_id_to_delete := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF user_id_to_delete IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
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
  DELETE FROM votes WHERE user_id = user_id_to_delete;
  DELETE FROM email_subscribers WHERE user_id = user_id_to_delete;
  DELETE FROM reports WHERE reporter_id = user_id_to_delete;
  DELETE FROM feedback_requests WHERE user_id = user_id_to_delete;
  DELETE FROM submission_consents WHERE user_id = user_id_to_delete;
  DELETE FROM cached_rankings WHERE user_id = user_id_to_delete;
  DELETE FROM user_profiles WHERE id = user_id_to_delete;

  -- NOTA: auth.users se elimina separadamente usando la API admin desde el frontend
  RAISE NOTICE 'Usuario eliminado exitosamente. auth.users se maneja desde el frontend.';

  RETURN json_build_object(
    'success', true, 
    'deleted_user_id', user_id_to_delete,
    'anonymized_stories', anonymized_stories_count,
    'auth_deletion_pending', true,
    'message', 'Datos de perfil eliminados. Eliminación de auth pendiente en frontend.'
  );
END;
$$;