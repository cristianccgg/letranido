-- Solución: Constraint UNIQUE solo para badges sin contest_id
-- Esto permite que badges de retos se dupliquen (uno por reto)
-- pero badges únicos como "first_story", "kofi_supporter" no se pueden duplicar

-- 1. Crear constraint parcial
CREATE UNIQUE INDEX user_badges_unique_non_contest
ON user_badges (user_id, badge_id)
WHERE metadata->>'contest_id' IS NULL;

-- 2. Verificar que funciona correctamente
-- Esta query debería estar vacía (sin duplicados de badges únicos)
SELECT
  user_id,
  badge_id,
  COUNT(*) as duplicates
FROM user_badges
WHERE metadata->>'contest_id' IS NULL
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;

-- 3. Ahora asignar badge al usuario que faltaba
SELECT check_and_award_badges('5cf7efcb-b471-40c2-8a49-03e87f0765a8'::uuid);

-- 4. Verificar que se asignó correctamente
SELECT
  bd.name as badge_name,
  ub.earned_at
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id = '5cf7efcb-b471-40c2-8a49-03e87f0765a8';
