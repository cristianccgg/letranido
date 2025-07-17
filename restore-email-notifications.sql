-- Restaurar notificaciones para todos los usuarios después de las pruebas
-- Ejecutar DESPUÉS de completar las pruebas de emails automáticos

-- 1. Activar notificaciones para todos los usuarios (sistema opt-out)
UPDATE public.user_profiles 
SET 
  email_notifications = true,
  contest_notifications = true,
  general_notifications = true,
  newsletter_contests = true,
  updated_at = NOW()
WHERE email IS NOT NULL AND email != '';

-- 2. Verificar que todos los usuarios tienen notificaciones activas
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN email_notifications = true THEN 1 END) as con_notificaciones,
  COUNT(CASE WHEN email_notifications = false THEN 1 END) as sin_notificaciones
FROM public.user_profiles 
WHERE email IS NOT NULL AND email != '';

-- 3. Mostrar algunos usuarios para verificar
SELECT 
  email,
  display_name,
  email_notifications,
  contest_notifications,
  general_notifications,
  newsletter_contests
FROM public.user_profiles 
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;