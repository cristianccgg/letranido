-- Crear función RPC para obtener datos de votos para rankings
-- Esta función bypasea RLS para obtener datos agregados necesarios para calcular karma
CREATE OR REPLACE FUNCTION get_all_votes_for_rankings()
RETURNS TABLE (
  user_id UUID,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER -- Ejecuta con privilegios del dueño (bypasea RLS)
AS $$
BEGIN
  RETURN QUERY
  SELECT v.user_id, v.created_at
  FROM votes v;
END;
$$ LANGUAGE plpgsql;

-- Dar permisos públicos para esta función (solo para rankings)
GRANT EXECUTE ON FUNCTION get_all_votes_for_rankings() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_all_votes_for_rankings() TO anon;
GRANT EXECUTE ON FUNCTION get_all_votes_for_rankings() TO authenticated;