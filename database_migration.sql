-- Migración para mejorar el sistema de notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas específicas para tipos de notificaciones
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS contest_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS general_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_notifications boolean DEFAULT false;

-- 2. Migrar datos existentes
-- Los usuarios que tienen email_notifications=true → contest_notifications=true
UPDATE public.user_profiles 
SET contest_notifications = email_notifications 
WHERE contest_notifications IS NULL;

-- 3. Crear índices para optimizar consultas de email
CREATE INDEX IF NOT EXISTS idx_user_profiles_contest_notifications 
ON public.user_profiles (contest_notifications) 
WHERE contest_notifications = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_general_notifications 
ON public.user_profiles (general_notifications) 
WHERE general_notifications = true;

-- 4. Actualizar función de trigger si existe (para mantener email_notifications como campo maestro)
CREATE OR REPLACE FUNCTION update_email_notifications_master()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cualquier notificación está activa, mantener email_notifications = true
  NEW.email_notifications := (
    NEW.contest_notifications OR 
    NEW.general_notifications OR 
    NEW.marketing_notifications
  );
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para mantener sincronización
DROP TRIGGER IF EXISTS tr_sync_email_notifications ON public.user_profiles;
CREATE TRIGGER tr_sync_email_notifications
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_master();

-- 6. Comentarios para documentación
COMMENT ON COLUMN public.user_profiles.email_notifications IS 'Campo maestro: true si cualquier tipo de notificación está activa';
COMMENT ON COLUMN public.user_profiles.contest_notifications IS 'Notificaciones sobre concursos: nuevos, deadlines, resultados';
COMMENT ON COLUMN public.user_profiles.general_notifications IS 'Notificaciones generales: tips, updates, newsletter';
COMMENT ON COLUMN public.user_profiles.marketing_notifications IS 'Notificaciones de marketing: promociones, eventos especiales';