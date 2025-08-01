-- Fix users with email = null
-- Este script corrige usuarios que tienen email = null pero deberían tener email
-- El email se obtiene de auth.users y se copia a user_profiles

-- 1. Primero, ver cuántos usuarios tienen este problema
SELECT 
  COUNT(*) as users_with_null_email,
  COUNT(CASE WHEN email_notifications = true THEN 1 END) as null_email_but_notifications_enabled
FROM user_profiles 
WHERE email IS NULL;

-- 2. Ver detalles de estos usuarios (para debugging)
SELECT 
  up.id,
  up.display_name,
  up.email,
  up.email_notifications,
  up.contest_notifications,
  up.general_notifications,
  up.newsletter_contests,
  au.email as auth_email,
  up.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.email IS NULL
ORDER BY up.created_at DESC;

-- 3. MIGRACIÓN: Copiar email de auth.users a user_profiles donde email es null
UPDATE user_profiles 
SET 
  email = auth.users.email,
  updated_at = now()
FROM auth.users 
WHERE user_profiles.id = auth.users.id 
  AND user_profiles.email IS NULL 
  AND auth.users.email IS NOT NULL;

-- 4. Verificar que la migración funcionó
SELECT 
  COUNT(*) as remaining_null_emails
FROM user_profiles 
WHERE email IS NULL;

-- 5. Ver usuarios actualizados
SELECT 
  up.id,
  up.display_name,
  up.email,
  up.email_notifications,
  up.contest_notifications,
  'MIGRADO' as status
FROM user_profiles up
WHERE up.updated_at > now() - interval '1 minute'
ORDER BY up.updated_at DESC;

-- 6. OPCIONAL: Normalizar preferencias de usuarios que desactivaron todo
-- (Si un usuario tiene email pero todas las notificaciones en false, 
-- puede indicar que no quiere ningún email)
-- DESCOMENTA SOLO SI QUIERES APLICAR ESTO:

/*
UPDATE user_profiles 
SET 
  email_notifications = false,
  contest_notifications = false,
  general_notifications = false,
  newsletter_contests = false,
  marketing_notifications = false,
  updated_at = now()
WHERE email IS NOT NULL 
  AND email_notifications = false 
  AND contest_notifications = false 
  AND general_notifications = false 
  AND newsletter_contests = false;
*/