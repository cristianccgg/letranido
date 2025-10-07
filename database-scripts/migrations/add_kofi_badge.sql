-- Migración: Agregar badge de Ko-fi Supporter
-- Ejecutar en Supabase SQL Editor

-- 1. Insertar definición del badge Ko-fi Supporter
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'kofi_supporter',
  'Ko-fi Supporter ☕',
  'Apoya a Letranido con una donación en Ko-fi',
  'heart',
  '#ec4899',
  3,
  '{"type": "manual", "source": "kofi_donation"}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

-- 2. Crear función para asignar badge Ko-fi por email
CREATE OR REPLACE FUNCTION assign_kofi_badge_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  result_message TEXT;
  user_display_name TEXT;
BEGIN
  -- Buscar el user_id por email
  SELECT id, display_name INTO target_user_id, user_display_name
  FROM public.user_profiles
  WHERE email = user_email;

  -- Verificar si el usuario existe
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró ningún usuario con ese email',
      'email', user_email
    );
  END IF;

  -- Verificar si ya tiene el badge
  IF EXISTS (
    SELECT 1 FROM public.user_badges
    WHERE user_id = target_user_id AND badge_id = 'kofi_supporter'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este usuario ya tiene el badge de Ko-fi Supporter',
      'user_id', target_user_id,
      'email', user_email,
      'display_name', user_display_name
    );
  END IF;

  -- Asignar el badge
  INSERT INTO public.user_badges (user_id, badge_id, metadata)
  VALUES (
    target_user_id,
    'kofi_supporter',
    json_build_object('assigned_at', NOW(), 'source', 'admin_manual')
  );

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', 'Badge Ko-fi Supporter asignado exitosamente',
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al asignar el badge: ' || SQLERRM,
      'email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear función para remover badge Ko-fi (por si se necesita)
CREATE OR REPLACE FUNCTION remove_kofi_badge_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  user_display_name TEXT;
  deleted_count INTEGER;
BEGIN
  -- Buscar el user_id por email
  SELECT id, display_name INTO target_user_id, user_display_name
  FROM public.user_profiles
  WHERE email = user_email;

  -- Verificar si el usuario existe
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró ningún usuario con ese email',
      'email', user_email
    );
  END IF;

  -- Remover el badge
  DELETE FROM public.user_badges
  WHERE user_id = target_user_id AND badge_id = 'kofi_supporter';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este usuario no tenía el badge de Ko-fi Supporter',
      'user_id', target_user_id,
      'email', user_email,
      'display_name', user_display_name
    );
  END IF;

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', 'Badge Ko-fi Supporter removido exitosamente',
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al remover el badge: ' || SQLERRM,
      'email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comentarios de uso
COMMENT ON FUNCTION assign_kofi_badge_by_email IS
'Asigna el badge de Ko-fi Supporter a un usuario por su email. Solo para uso administrativo.';

COMMENT ON FUNCTION remove_kofi_badge_by_email IS
'Remueve el badge de Ko-fi Supporter de un usuario por su email. Solo para uso administrativo.';
