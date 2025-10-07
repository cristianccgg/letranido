-- Verificar badges del usuario específico

-- 1. Ver información del usuario
SELECT
  id,
  display_name,
  email,
  created_at
FROM user_profiles
WHERE id = '5cf7efcb-b471-40c2-8a49-03e87f0765a8';

-- 2. Ver badges asignados a este usuario
SELECT
  ub.id as user_badge_id,
  ub.badge_id,
  bd.name as badge_name,
  bd.description,
  ub.earned_at,
  ub.metadata
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id = '5cf7efcb-b471-40c2-8a49-03e87f0765a8'
ORDER BY ub.earned_at DESC;

-- 3. Ver si tiene historias publicadas (debería tener badge first_story)
SELECT
  COUNT(*) as total_stories,
  MIN(created_at) as first_story_date
FROM stories
WHERE user_id = '5cf7efcb-b471-40c2-8a49-03e87f0765a8'
  AND published_at IS NOT NULL;

-- 4. Si no tiene badge pero tiene historias, asignarlo manualmente
-- SOLO EJECUTAR SI LA QUERY #2 NO MUESTRA BADGES Y LA #3 MUESTRA HISTORIAS
/*
INSERT INTO user_badges (user_id, badge_id, metadata)
VALUES (
  '5cf7efcb-b471-40c2-8a49-03e87f0765a8',
  'first_story',
  '{"assigned_at": NOW(), "source": "manual_fix"}'::jsonb
)
ON CONFLICT (user_id, badge_id) DO NOTHING;
*/
