-- Configurar usuarios de prueba para emails automáticos
-- Desactivar notificaciones para todos excepto usuarios de prueba

-- 1. Desactivar notificaciones para todos los usuarios
UPDATE public.user_profiles 
SET 
  email_notifications = false,
  contest_notifications = false,
  general_notifications = false,
  newsletter_contests = false,
  updated_at = NOW()
WHERE email IS NOT NULL;

-- 2. Activar notificaciones solo para usuarios de prueba
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

-- 3. Verificar que solo los usuarios de prueba tienen notificaciones activas
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

-- 4. Contar usuarios con notificaciones activas (deberían ser 3)
SELECT COUNT(*) as usuarios_con_notificaciones
FROM public.user_profiles 
WHERE email_notifications = true;