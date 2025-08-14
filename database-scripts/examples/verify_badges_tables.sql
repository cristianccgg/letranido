-- Verificar que las tablas de badges existen
-- Ejecutar en Supabase SQL Editor para verificar

-- 1. Verificar tabla badge_definitions
SELECT 'badge_definitions table' as table_name, count(*) as record_count 
FROM public.badge_definitions;

-- 2. Verificar tabla user_badges  
SELECT 'user_badges table' as table_name, count(*) as record_count 
FROM public.user_badges;

-- 3. Verificar que existen las definiciones de badges
SELECT id, name, description, tier 
FROM public.badge_definitions 
ORDER BY tier, id;

-- 4. Verificar que las funciones existen
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('check_and_award_badges', 'award_specific_badge');

-- 5. Si las tablas no existen, este query fallará
-- En ese caso, necesitas ejecutar badges_migration.sql primero