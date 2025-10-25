-- Script: Otorgar karma retroactivo a Ko-fi Supporters existentes
-- Fecha: 2025-10-25
-- Propósito: Dar +50 karma a todos los usuarios que ya tienen badge Ko-fi Supporter

-- IMPORTANTE: Ejecutar DESPUÉS de:
-- 1. add_bonus_karma_column.sql
-- 2. update_kofi_badge_with_karma.sql

-- Verificar supporters existentes
DO $$
DECLARE
  supporter_count INTEGER;
  updated_count INTEGER;
BEGIN
  -- Contar supporters actuales
  SELECT COUNT(DISTINCT user_id)
  INTO supporter_count
  FROM user_badges
  WHERE badge_id = 'kofi_supporter';

  RAISE NOTICE '🔍 Ko-fi Supporters encontrados: %', supporter_count;

  IF supporter_count = 0 THEN
    RAISE NOTICE '⚠️ No hay supporters existentes. Script terminado.';
    RETURN;
  END IF;

  -- Otorgar karma retroactivo (+50 a cada supporter)
  UPDATE user_profiles
  SET bonus_karma = COALESCE(bonus_karma, 0) + 50
  WHERE id IN (
    SELECT DISTINCT user_id
    FROM user_badges
    WHERE badge_id = 'kofi_supporter'
  );

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE '✅ Karma retroactivo otorgado exitosamente';
  RAISE NOTICE '📊 Usuarios actualizados: %', updated_count;
  RAISE NOTICE '🎖️ Karma otorgado por usuario: +50 puntos';
  RAISE NOTICE '💡 Total karma distribuido: % puntos', updated_count * 50;
  RAISE NOTICE '';
  RAISE NOTICE '⏭️ SIGUIENTE PASO: Ejecutar "Recalcular Rankings" desde el panel admin';
  RAISE NOTICE '   para reflejar el karma en los rankings públicos.';

END $$;

-- Verificación: Mostrar supporters y su karma bonus
SELECT
  up.id,
  up.display_name,
  up.email,
  up.bonus_karma,
  ub.earned_at as badge_assigned_at
FROM user_profiles up
JOIN user_badges ub ON up.id = ub.user_id
WHERE ub.badge_id = 'kofi_supporter'
ORDER BY ub.earned_at DESC;
