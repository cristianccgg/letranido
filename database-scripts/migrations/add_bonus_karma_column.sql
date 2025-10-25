-- Migración: Agregar columna bonus_karma para karma manual
-- Fecha: 2025-10-25
-- Propósito: Permitir otorgar karma permanente por eventos especiales (Ko-fi, moderación, etc.)

-- 1. Agregar columna bonus_karma a user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bonus_karma INTEGER DEFAULT 0 NOT NULL;

-- 2. Crear índice para performance en queries de karma
CREATE INDEX IF NOT EXISTS idx_user_profiles_bonus_karma ON user_profiles(bonus_karma);

-- 3. Comentario explicativo
COMMENT ON COLUMN user_profiles.bonus_karma IS
'Karma otorgado manualmente por eventos especiales (Ko-fi donations, moderación, eventos comunitarios).
Este karma es permanente y se suma al karma calculado automáticamente.';

-- 4. Verificación
DO $$
BEGIN
  RAISE NOTICE 'Columna bonus_karma agregada exitosamente a user_profiles';
  RAISE NOTICE 'Este karma se sumará automáticamente en el próximo recalculo de rankings';
END $$;
