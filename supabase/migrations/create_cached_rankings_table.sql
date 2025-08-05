-- Crear tabla para rankings cached (recalculados manualmente desde admin)
CREATE TABLE cached_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  total_karma integer NOT NULL DEFAULT 0,
  total_stories integer NOT NULL DEFAULT 0,
  votes_given integer NOT NULL DEFAULT 0,
  comments_given integer NOT NULL DEFAULT 0,
  comments_received integer NOT NULL DEFAULT 0,
  contest_wins integer NOT NULL DEFAULT 0,
  position integer NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Crear tabla para metadata de actualizaciones
CREATE TABLE ranking_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_updated timestamp DEFAULT now(),
  total_users integer DEFAULT 0,
  contest_period text, -- "Agosto 2025" o descripción
  updated_by_admin boolean DEFAULT true
);

-- Índices para performance
CREATE INDEX idx_cached_rankings_position ON cached_rankings(position);
CREATE INDEX idx_cached_rankings_karma ON cached_rankings(total_karma DESC);
CREATE INDEX idx_cached_rankings_user_id ON cached_rankings(user_id);

-- RLS (Row Level Security) - Rankings son públicos para leer
ALTER TABLE cached_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_metadata ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer rankings
CREATE POLICY "Rankings are viewable by everyone" ON cached_rankings
  FOR SELECT USING (true);

-- Política: Todos pueden leer metadata
CREATE POLICY "Ranking metadata is viewable by everyone" ON ranking_metadata
  FOR SELECT USING (true);

-- Política: Solo admins pueden escribir (esto lo manejaremos con RPC functions)
-- CREATE POLICY "Only admins can update rankings" ON cached_rankings
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Función para limpiar rankings antiguos y recalcular
CREATE OR REPLACE FUNCTION recalculate_rankings()
RETURNS json
SECURITY DEFINER -- Ejecuta con privilegios del dueño
AS $$
DECLARE
  result json;
  total_users_count integer := 0;
BEGIN
  -- Limpiar rankings anteriores
  DELETE FROM cached_rankings;
  DELETE FROM ranking_metadata;
  
  -- Recalcular y insertar nuevos rankings (lógica a implementar)
  -- Por ahora, retornamos success para que el frontend haga el trabajo
  
  -- Insertar metadata
  INSERT INTO ranking_metadata (last_updated, contest_period, updated_by_admin)
  VALUES (now(), 'Actualizado manualmente', true);
  
  -- Retornar resultado
  SELECT json_build_object(
    'success', true,
    'message', 'Rankings table cleared and ready for recalculation',
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Dar permisos para la función RPC
GRANT EXECUTE ON FUNCTION recalculate_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_rankings() TO anon;