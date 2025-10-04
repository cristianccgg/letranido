-- Consulta para verificar estado actual de badges antes del recálculo
-- 1. Ver todos los badges de ganadores/finalistas actuales
SELECT 
  ub.id,
  up.display_name,
  ub.badge_id,
  bd.name as badge_name,
  ub.earned_at,
  ub.metadata->>'contest_id' as contest_id,
  c.title as contest_title,
  c.month as contest_month
FROM user_badges ub
JOIN user_profiles up ON ub.user_id = up.id
JOIN badge_definitions bd ON ub.badge_id = bd.id
LEFT JOIN contests c ON ub.metadata->>'contest_id' = c.id::text
WHERE ub.badge_id IN ('contest_winner', 'contest_finalist', 'contest_winner_veteran')
ORDER BY up.display_name, ub.earned_at DESC;

-- 2. Contador de badges por usuario
SELECT 
  up.display_name,
  ub.badge_id,
  COUNT(*) as total_badges,
  string_agg(c.title, ', ') as contests
FROM user_badges ub
JOIN user_profiles up ON ub.user_id = up.id
JOIN badge_definitions bd ON ub.badge_id = bd.id
LEFT JOIN contests c ON ub.metadata->>'contest_id' = c.id::text
WHERE ub.badge_id IN ('contest_winner', 'contest_finalist', 'contest_winner_veteran')
GROUP BY up.display_name, ub.badge_id
ORDER BY up.display_name, total_badges DESC;

-- 3. Verificar constraint único actual
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'user_badges'::regclass
  AND contype = 'u';

-- 4. Verificar índices únicos
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_badges' 
  AND indexdef LIKE '%UNIQUE%';