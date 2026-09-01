-- Migración: Badge Ko-fi Supporter temporal (30 días) + karma acumulable
-- Fecha: 2026-09-01
-- Propósito:
--   1. El badge Ko-fi Supporter ahora expira 30 días después de la última donación
--      registrada (en vez de ser permanente), para incentivar donaciones recurrentes.
--   2. Cada donación (primera o repetida) otorga +50 karma bonus, sin límite de veces.
--   3. Se lleva un contador de cuántas veces ha donado el usuario (donation_count).
--
-- Notas de diseño (confirmadas con el usuario):
--   - Expiración "silenciosa": no se borra la fila de user_badges ni se necesita cron.
--     El frontend simplemente deja de mostrar el badge cuando expires_at ya pasó.
--   - El karma otorgado NUNCA se resta por expiración del badge (solo se resta si el
--     admin remueve el badge por error de asignación, vía remove_kofi_badge_by_email).
--   - Volver a donar con el badge ya vencido simplemente lo "revive" con una nueva
--     fecha de expiración (comportamiento idéntico a renovar antes de vencer).

-- 1. Actualizar función de asignación/renovación
CREATE OR REPLACE FUNCTION assign_kofi_badge_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  user_display_name TEXT;
  current_bonus_karma INTEGER;
  kofi_karma_amount INTEGER := 50; -- Karma otorgado por cada donación
  existing_donation_count INTEGER;
  new_donation_count INTEGER;
  new_expires_at TIMESTAMPTZ;
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

  new_expires_at := NOW() + INTERVAL '30 days';

  -- ¿Ya tiene el badge (activo o vencido)? Si es así, renovamos en vez de duplicar.
  SELECT COALESCE((metadata->>'donation_count')::INTEGER, 1)
  INTO existing_donation_count
  FROM public.user_badges
  WHERE user_id = target_user_id AND badge_id = 'kofi_supporter';

  IF FOUND THEN
    new_donation_count := existing_donation_count + 1;

    UPDATE public.user_badges
    SET metadata = metadata
      || jsonb_build_object(
        'expires_at', new_expires_at,
        'last_donation_at', NOW(),
        'donation_count', new_donation_count,
        'source', 'admin_manual'
      )
    WHERE user_id = target_user_id AND badge_id = 'kofi_supporter';
  ELSE
    new_donation_count := 1;

    INSERT INTO public.user_badges (user_id, badge_id, metadata)
    VALUES (
      target_user_id,
      'kofi_supporter',
      jsonb_build_object(
        'assigned_at', NOW(),
        'last_donation_at', NOW(),
        'expires_at', new_expires_at,
        'donation_count', new_donation_count,
        'source', 'admin_manual'
      )
    );
  END IF;

  -- 🎖️ OTORGAR KARMA BONUS (+50, cada donación, se acumula sin límite)
  UPDATE public.user_profiles
  SET bonus_karma = current_bonus_karma + kofi_karma_amount
  WHERE id = target_user_id;

  RAISE NOTICE '✅ Badge Ko-fi Supporter renovado/asignado a % (ID: %) — donación #%, expira %',
    user_display_name, target_user_id, new_donation_count, new_expires_at;
  RAISE NOTICE '🎖️ Karma bonus otorgado: +% karma (total bonus: %)', kofi_karma_amount, current_bonus_karma + kofi_karma_amount;

  RETURN json_build_object(
    'success', true,
    'message', format('Donación registrada (#%s). Badge activo hasta %s. +%s karma otorgado.', new_donation_count, to_char(new_expires_at, 'DD Mon YYYY'), kofi_karma_amount),
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name,
    'donation_count', new_donation_count,
    'expires_at', new_expires_at,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Función auxiliar para que el panel admin muestre el estado actual antes de confirmar
CREATE OR REPLACE FUNCTION get_kofi_badge_status_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  user_display_name TEXT;
  badge_metadata JSONB;
BEGIN
  SELECT id, display_name INTO target_user_id, user_display_name
  FROM public.user_profiles
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró ningún usuario con ese email',
      'email', user_email
    );
  END IF;

  SELECT metadata INTO badge_metadata
  FROM public.user_badges
  WHERE user_id = target_user_id AND badge_id = 'kofi_supporter';

  IF badge_metadata IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'has_badge', false,
      'user_id', target_user_id,
      'email', user_email,
      'display_name', user_display_name
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'has_badge', true,
    'is_active', (badge_metadata->>'expires_at')::TIMESTAMPTZ > NOW(),
    'expires_at', badge_metadata->>'expires_at',
    'donation_count', COALESCE((badge_metadata->>'donation_count')::INTEGER, 1),
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al consultar el badge: ' || SQLERRM,
      'email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Migrar badges Ko-fi existentes: darles metadata de expiración a partir de hoy
--    (así los supporters actuales no pierden el badge de golpe con este deploy)
UPDATE public.user_badges
SET metadata = metadata
  || jsonb_build_object(
    'expires_at', NOW() + INTERVAL '30 days',
    'last_donation_at', COALESCE(metadata->>'assigned_at', NOW()::TEXT),
    'donation_count', COALESCE((metadata->>'donation_count')::INTEGER, 1)
  )
WHERE badge_id = 'kofi_supporter'
  AND (metadata->>'expires_at') IS NULL;

-- 4. Comentarios
COMMENT ON FUNCTION assign_kofi_badge_by_email IS
'Asigna o renueva el badge de Ko-fi Supporter por email. Cada llamada = una donación: otorga +50 karma acumulable y extiende expires_at 30 días desde hoy. Solo para uso administrativo.';

COMMENT ON FUNCTION get_kofi_badge_status_by_email IS
'Consulta el estado actual del badge Ko-fi (activo/vencido, fecha de expiración, número de donaciones) para un email, sin modificar nada. Uso administrativo.';

-- 5. Actualizar remoción para revertir TODO el karma acumulado (según donation_count),
--    no solo 50 fijos — relevante si el badge se removió tras varias donaciones por error.
CREATE OR REPLACE FUNCTION remove_kofi_badge_by_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  user_display_name TEXT;
  deleted_count INTEGER;
  current_bonus_karma INTEGER;
  kofi_karma_amount INTEGER := 50;
  donation_count INTEGER;
  karma_to_revert INTEGER;
BEGIN
  SELECT id, display_name, COALESCE(bonus_karma, 0)
  INTO target_user_id, user_display_name, current_bonus_karma
  FROM public.user_profiles
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró ningún usuario con ese email',
      'email', user_email
    );
  END IF;

  SELECT COALESCE((metadata->>'donation_count')::INTEGER, 1)
  INTO donation_count
  FROM public.user_badges
  WHERE user_id = target_user_id AND badge_id = 'kofi_supporter';

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

  karma_to_revert := kofi_karma_amount * COALESCE(donation_count, 1);

  -- ⚠️ RESTAR KARMA (solo si fue error de asignación — revierte todas las donaciones registradas)
  UPDATE public.user_profiles
  SET bonus_karma = GREATEST(current_bonus_karma - karma_to_revert, 0)
  WHERE id = target_user_id;

  RAISE NOTICE '⚠️ Badge Ko-fi Supporter removido de % (ID: %)', user_display_name, target_user_id;
  RAISE NOTICE '⚠️ Karma bonus revertido: -% karma (% donaciones registradas)', karma_to_revert, donation_count;

  RETURN json_build_object(
    'success', true,
    'message', format('Badge Ko-fi Supporter removido. -%s karma revertido (%s donaciones).', karma_to_revert, donation_count),
    'user_id', target_user_id,
    'email', user_email,
    'display_name', user_display_name,
    'karma_removed', karma_to_revert,
    'total_bonus_karma', GREATEST(current_bonus_karma - karma_to_revert, 0)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al remover el badge: ' || SQLERRM,
      'email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION remove_kofi_badge_by_email IS
'Remueve el badge de Ko-fi Supporter de un usuario por su email y revierte TODO el karma acumulado (50 x donation_count). USAR SOLO EN CASOS DE ERROR DE ASIGNACIÓN.';

-- 6. Listado completo de supporters Ko-fi (activos y vencidos) para el panel admin
CREATE OR REPLACE FUNCTION list_kofi_supporters()
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  is_active BOOLEAN,
  assigned_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  donation_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ub.user_id,
    up.display_name,
    up.email,
    (ub.metadata->>'expires_at')::TIMESTAMPTZ > NOW() AS is_active,
    (ub.metadata->>'assigned_at')::TIMESTAMPTZ AS assigned_at,
    (ub.metadata->>'last_donation_at')::TIMESTAMPTZ AS last_donation_at,
    (ub.metadata->>'expires_at')::TIMESTAMPTZ AS expires_at,
    COALESCE((ub.metadata->>'donation_count')::INTEGER, 1) AS donation_count
  FROM public.user_badges ub
  JOIN public.user_profiles up ON up.id = ub.user_id
  WHERE ub.badge_id = 'kofi_supporter'
  ORDER BY (ub.metadata->>'last_donation_at')::TIMESTAMPTZ DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION list_kofi_supporters IS
'Lista todos los usuarios con badge Ko-fi Supporter (activos y vencidos), con su historial de donaciones. Uso administrativo.';

DO $$
BEGIN
  RAISE NOTICE '✅ Badge Ko-fi Supporter ahora expira 30 días tras la última donación';
  RAISE NOTICE '🎖️ Cada donación otorga +50 karma, sin importar si es la primera o repetida';
  RAISE NOTICE '📊 Nuevas funciones get_kofi_badge_status_by_email() y list_kofi_supporters() disponibles para el panel admin';
END $$;
