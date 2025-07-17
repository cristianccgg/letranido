-- Arreglar configuración por defecto de notificaciones
-- Los usuarios deberían recibir todos los emails por defecto (opt-out)

-- 1. Cambiar defaults de las columnas
ALTER TABLE public.user_profiles 
ALTER COLUMN general_notifications SET DEFAULT true;

ALTER TABLE public.user_profiles 
ALTER COLUMN marketing_notifications SET DEFAULT true;

ALTER TABLE public.user_profiles 
ALTER COLUMN newsletter_contests SET DEFAULT true;

-- 2. Actualizar usuarios existentes que tienen false (opcional)
-- Solo si quieres que usuarios existentes también reciban emails
UPDATE public.user_profiles 
SET 
  general_notifications = true,
  marketing_notifications = true,
  newsletter_contests = true,
  updated_at = NOW()
WHERE 
  general_notifications = false 
  OR marketing_notifications = false 
  OR newsletter_contests = false;

-- 3. Verificar los cambios
SELECT 
  email,
  email_notifications,
  contest_notifications,
  general_notifications,
  marketing_notifications,
  newsletter_contests
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 10;