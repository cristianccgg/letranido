-- Arreglar configuración de prueba - desactivar trigger temporalmente

-- 1. Desactivar el trigger que sincroniza email_notifications
DROP TRIGGER IF EXISTS tr_sync_email_notifications ON public.user_profiles;

-- 2. Desactivar notificaciones para todos los usuarios (incluyendo email_notifications)
UPDATE public.user_profiles 
SET 
  email_notifications = false,
  contest_notifications = false,
  general_notifications = false,
  newsletter_contests = false,
  updated_at = NOW()
WHERE email IS NOT NULL;

-- 3. Activar notificaciones solo para usuarios de prueba
UPDATE public.user_profiles 
SET 
  email_notifications = true,
  contest_notifications = true,
  general_notifications = true,
  newsletter_contests = true,
  updated_at = NOW()
WHERE email IN (
  'marquezdaniela526@gmail.com',
  'cristiancgart@gmail.com', 
  'cristianccgg@hotmail.com'
);

-- 4. Verificar que solo los usuarios de prueba tienen email_notifications = true
SELECT 
  email,
  display_name,
  email_notifications,
  contest_notifications,
  general_notifications,
  newsletter_contests
FROM public.user_profiles 
WHERE email_notifications = true
ORDER BY email;

-- 5. Contar usuarios con email_notifications activas (deberían ser 3)
SELECT COUNT(*) as usuarios_con_email_notifications
FROM public.user_profiles 
WHERE email_notifications = true;