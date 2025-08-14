-- Migración para agregar campo de aceptación de términos
-- Fecha: 2025-01-29
-- Propósito: Registrar cuándo un usuario aceptó los términos y condiciones

-- Agregar campo a user_profiles para registrar aceptación de términos
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone NULL;

-- Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_user_profiles_terms_accepted_at 
ON public.user_profiles USING btree (terms_accepted_at) 
TABLESPACE pg_default;

-- Actualizar usuarios existentes (marcar como que aceptaron términos al registrarse)
-- Solo para usuarios que ya existen, asumimos que aceptaron términos implícitamente
UPDATE public.user_profiles 
SET terms_accepted_at = created_at 
WHERE terms_accepted_at IS NULL 
  AND created_at IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.terms_accepted_at IS 
'Timestamp de cuándo el usuario aceptó explícitamente los términos y condiciones. NULL indica que no ha aceptado términos específicos.';