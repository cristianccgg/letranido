-- Crear función RPC para obtener perfiles públicos para rankings
-- Esta función bypasea RLS para obtener datos públicos necesarios para calcular karma
CREATE OR REPLACE FUNCTION get_public_user_profiles(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  display_name TEXT
) 
SECURITY DEFINER -- Ejecuta con privilegios del dueño (bypasea RLS)
AS $$
BEGIN
  RETURN QUERY
  SELECT up.id, up.display_name
  FROM user_profiles up
  WHERE up.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Dar permisos públicos para esta función (solo para rankings)
GRANT EXECUTE ON FUNCTION get_public_user_profiles(UUID[]) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_user_profiles(UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION get_public_user_profiles(UUID[]) TO authenticated;