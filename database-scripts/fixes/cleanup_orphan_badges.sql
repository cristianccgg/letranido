-- Limpieza de badges huérfanos
-- Badges asignados a usuarios sin las historias correspondientes
-- Fecha: Diciembre 21, 2024

-- PASO 1: Identificar badges huérfanos de story_count
-- (usuarios con badges pero sin suficientes historias)
SELECT
  up.display_name,
  up.email,
  ub.badge_id,
  bd.name as badge_name,
  (bd.criteria->>'threshold')::INTEGER as required,
  COALESCE(story_counts.story_count, 0) as actual_stories
FROM public.user_badges ub
JOIN public.badge_definitions bd ON bd.id = ub.badge_id
JOIN public.user_profiles up ON up.id = ub.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as story_count
  FROM public.stories
  WHERE published_at IS NOT NULL
  GROUP BY user_id
) story_counts ON story_counts.user_id = ub.user_id
WHERE bd.criteria->>'type' = 'story_count'
  AND COALESCE(story_counts.story_count, 0) < (bd.criteria->>'threshold')::INTEGER
ORDER BY ub.badge_id, up.display_name;

-- PASO 2: Eliminar badges huérfanos de story_count
-- Solo eliminar si el usuario NO tiene suficientes historias
DELETE FROM public.user_badges
WHERE id IN (
  SELECT ub.id
  FROM public.user_badges ub
  JOIN public.badge_definitions bd ON bd.id = ub.badge_id
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as story_count
    FROM public.stories
    WHERE published_at IS NOT NULL
    GROUP BY user_id
  ) story_counts ON story_counts.user_id = ub.user_id
  WHERE bd.criteria->>'type' = 'story_count'
    AND COALESCE(story_counts.story_count, 0) < (bd.criteria->>'threshold')::INTEGER
);

-- PASO 3: Verificar resultado - No debería haber badges incorrectos
SELECT
  up.display_name,
  up.email,
  ub.badge_id,
  bd.name as badge_name,
  (bd.criteria->>'threshold')::INTEGER as required,
  COALESCE(story_counts.story_count, 0) as actual_stories,
  '✅ CORRECTO' as status
FROM public.user_badges ub
JOIN public.badge_definitions bd ON bd.id = ub.badge_id
JOIN public.user_profiles up ON up.id = ub.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as story_count
  FROM public.stories
  WHERE published_at IS NOT NULL
  GROUP BY user_id
) story_counts ON story_counts.user_id = ub.user_id
WHERE bd.criteria->>'type' = 'story_count'
ORDER BY ub.badge_id, story_counts.story_count DESC;

-- PASO 4: Resumen de badges limpiados
SELECT
  'Badges de story_count después de limpieza' as metric,
  COUNT(*) as count
FROM public.user_badges ub
JOIN public.badge_definitions bd ON bd.id = ub.badge_id
WHERE bd.criteria->>'type' = 'story_count';
