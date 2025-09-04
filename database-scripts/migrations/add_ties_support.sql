-- Migración para soporte de empates en concursos
-- Seguro para producción - Solo agrega campo, no modifica datos existentes

-- Agregar campo is_tied para indicar si una historia ganó por empate
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS is_tied BOOLEAN DEFAULT FALSE;

-- Crear índice para consultas eficientes de ganadores con empates
CREATE INDEX IF NOT EXISTS idx_stories_winners_ties 
ON stories(contest_id, is_winner, is_tied) 
WHERE is_winner = TRUE;

-- Comentario explicativo
COMMENT ON COLUMN stories.is_tied IS 'Indica si esta historia ganó en empate con otras historias';