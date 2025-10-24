-- 1. PRIMERO: Ver todos los duplicados
SELECT
  user_id,
  badge_id,
  COUNT(*) as duplicates
FROM user_badges
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;

-- 2. Ver detalles de los duplicados (para entender qué pasó)
WITH duplicates AS (
  SELECT user_id, badge_id
  FROM user_badges
  GROUP BY user_id, badge_id
  HAVING COUNT(*) > 1
)
SELECT
  ub.id,
  ub.user_id,
  up.display_name,
  ub.badge_id,
  bd.name as badge_name,
  ub.earned_at,
  ub.metadata
FROM user_badges ub
JOIN duplicates d ON ub.user_id = d.user_id AND ub.badge_id = d.badge_id
JOIN user_profiles up ON ub.user_id = up.id
JOIN badge_definitions bd ON ub.badge_id = bd.id
ORDER BY ub.user_id, ub.badge_id, ub.earned_at;

-- 3. ELIMINAR DUPLICADOS (mantiene el más antiguo)
-- REVISA LOS RESULTADOS DE LA QUERY #1 Y #2 ANTES DE EJECUTAR ESTO
DELETE FROM user_badges
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, badge_id
        ORDER BY earned_at ASC  -- Mantiene el más antiguo
      ) as rn
    FROM user_badges
  ) t
  WHERE rn > 1  -- Elimina los duplicados (mantiene rn = 1)
);

-- 4. AHORA sí, agregar la constraint
ALTER TABLE user_badges
ADD CONSTRAINT user_badges_user_id_badge_id_unique
UNIQUE (user_id, badge_id);

-- 5. Verificar que quedó bien
SELECT
  user_id,
  badge_id,
  COUNT(*) as count
FROM user_badges
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;  -- Debería estar vacío
