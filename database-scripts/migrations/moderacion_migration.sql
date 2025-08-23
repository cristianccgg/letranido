-- Migración para Sistema de Moderación Automática
-- Ejecutar en Supabase SQL Editor
-- IMPORTANTE: Esta migración NO afecta historias existentes

-- 1. Agregar campos de moderación a la tabla stories
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS moderation_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_reviewed_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- 2. Crear índices para optimizar consultas de moderación
CREATE INDEX IF NOT EXISTS idx_stories_moderation_status 
ON public.stories (moderation_status) 
WHERE moderation_status IN ('flagged', 'under_review');

CREATE INDEX IF NOT EXISTS idx_stories_moderation_score 
ON public.stories (moderation_score) 
WHERE moderation_score >= 50;

CREATE INDEX IF NOT EXISTS idx_stories_contest_moderation 
ON public.stories (contest_id, moderation_status) 
WHERE contest_id IS NOT NULL;

-- 3. Crear tabla para logs de moderación
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'approved', 'flagged', 'rejected', 'edited'
    previous_status TEXT,
    new_status TEXT,
    admin_user_id UUID REFERENCES public.user_profiles(id),
    reason TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear índices para logs de moderación
CREATE INDEX IF NOT EXISTS idx_moderation_logs_story_id 
ON public.moderation_logs (story_id);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_action 
ON public.moderation_logs (action, created_at);

-- 5. Actualizar historias existentes con estado 'approved' (no afecta funcionamiento)
UPDATE public.stories 
SET moderation_status = 'approved'
WHERE moderation_status = 'pending' 
AND created_at < NOW();

-- 6. Crear función para actualizar timestamp de moderación
CREATE OR REPLACE FUNCTION update_moderation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar timestamp si el status de moderación cambió
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    NEW.moderation_reviewed_at := NOW();
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para timestamp automático
DROP TRIGGER IF EXISTS tr_update_moderation_timestamp ON public.stories;
CREATE TRIGGER tr_update_moderation_timestamp
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION update_moderation_timestamp();

-- 8. Comentarios para documentación
COMMENT ON COLUMN public.stories.moderation_score IS 'Puntuación de moderación automática (0-100)';
COMMENT ON COLUMN public.stories.moderation_flags IS 'Array de flags detectados por el sistema automático';
COMMENT ON COLUMN public.stories.moderation_status IS 'Estado: pending, approved, flagged, under_review, rejected';
COMMENT ON COLUMN public.stories.moderation_reviewed_at IS 'Timestamp de última revisión manual';
COMMENT ON COLUMN public.stories.moderation_reviewed_by IS 'Admin que revisó la historia';
COMMENT ON COLUMN public.stories.moderation_notes IS 'Notas del admin sobre la moderación';

-- 9. Insertar log inicial para historias existentes
INSERT INTO public.moderation_logs (story_id, action, previous_status, new_status, reason, created_at)
SELECT 
    id,
    'auto_approved',
    'pending',
    'approved',
    'Historia existente - aprobada automáticamente en migración',
    created_at
FROM public.stories 
WHERE moderation_status = 'approved' 
AND created_at < NOW()
ON CONFLICT DO NOTHING;