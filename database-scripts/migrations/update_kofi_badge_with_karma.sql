-- Migración: Actualizar funciones Ko-fi badge para otorgar karma
-- Fecha: 2025-10-25
-- Propósito: Otorgar +50 karma permanente cuando se asigna badge Ko-fi Supporter

-- IMPORTANTE: Ejecutar DESPUÉS de add_bonus_karma_column.sql

-- 1. Actualizar función de asignación de badge para incluir karma
CREATE OR REPLACE FUNCTION assign_kofi_badge_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  result_message TEXT;
  user_display_name TEXT;
  current_bonus_karma INTEGER;
  kofi_karma_amount INTEGER := 50; -- Karma otorgado por Ko-fi Supporter
BEGIN
  -- Buscar el user_id por email
  SELECT id, display_name, COALESCE(bonus_karma, 0)
  INTO target_user_id, user_display_name, current_bonus_karma
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
    json_build_object(
      'assigned_at', NOW(),
      'source', 'admin_manual',
      'karma_awarded', kofi_karma_amount
    )
  );

  -- 🎖️ OTORGAR KARMA BONUS (+50 permanente)
  UPDATE public.user_profiles
  SET bonus_karma = current_bonus_karma + kofi_karma_amount
  WHERE id = target_user_id;

  RAISE NOTICE '✅ Badge Ko-fi Supporter asignado a % (ID: %)', user_display_name, target_user_id;
  RAISE NOTICE '🎖️ Karma bonus otorgado: +% karma (total bonus: %)', kofi_karma_amount, current_bonus_karma + kofi_karma_amount;

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', format('Badge Ko-fi Supporter asignado exitosamente. +%s karma otorgado.', kofi_karma_amount),
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name,
    'karma_awarded', kofi_karma_amount,
    'total_bonus_karma', current_bonus_karma + kofi_karma_amount
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

-- 2. Actualizar función de remoción (SOLO resta karma si fue error, NO por donación pasada)
CREATE OR REPLACE FUNCTION remove_kofi_badge_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  user_display_name TEXT;
  deleted_count INTEGER;
  current_bonus_karma INTEGER;
  kofi_karma_amount INTEGER := 50;
BEGIN
  -- Buscar el user_id por email
  SELECT id, display_name, COALESCE(bonus_karma, 0)
  INTO target_user_id, user_display_name, current_bonus_karma
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

  -- ⚠️ RESTAR KARMA (solo si fue error de asignación)
  UPDATE public.user_profiles
  SET bonus_karma = GREATEST(current_bonus_karma - kofi_karma_amount, 0)
  WHERE id = target_user_id;

  RAISE NOTICE '⚠️ Badge Ko-fi Supporter removido de % (ID: %)', user_display_name, target_user_id;
  RAISE NOTICE '⚠️ Karma bonus revertido: -%s karma', kofi_karma_amount;

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', format('Badge Ko-fi Supporter removido. -%s karma revertido.', kofi_karma_amount),
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name,
    'karma_removed', kofi_karma_amount,
    'total_bonus_karma', GREATEST(current_bonus_karma - kofi_karma_amount, 0)
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

-- 3. Comentarios actualizados
COMMENT ON FUNCTION assign_kofi_badge_by_email IS
'Asigna el badge de Ko-fi Supporter a un usuario por su email y otorga +50 karma permanente. Solo para uso administrativo.';

COMMENT ON FUNCTION remove_kofi_badge_by_email IS
'Remueve el badge de Ko-fi Supporter de un usuario por su email y revierte el karma otorgado. USAR SOLO EN CASOS DE ERROR DE ASIGNACIÓN.';

-- 4. Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Funciones Ko-fi badge actualizadas con sistema de karma';
  RAISE NOTICE '💡 Karma otorgado por Ko-fi Supporter: +50 puntos permanentes';
  RAISE NOTICE '⚠️ IMPORTANTE: Ejecutar script retroactivo para supporters existentes';
END $$;
