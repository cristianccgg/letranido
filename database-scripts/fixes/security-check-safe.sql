-- PASO 1: VERIFICAR QUE EXISTE ANTES DE ACTUAR
-- Script seguro para verificar el estado actual sin hacer cambios

-- 1. Verificar si las vistas problemáticas existen
SELECT 'admin_contest_stats' as vista, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.views 
         WHERE table_schema = 'public' AND table_name = 'admin_contest_stats'
       ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

SELECT 'popular_stories' as vista, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.views 
         WHERE table_schema = 'public' AND table_name = 'popular_stories'
       ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

SELECT 'user_stats' as vista, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.views 
         WHERE table_schema = 'public' AND table_name = 'user_stats'
       ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- 2. Verificar estado actual de RLS en maintenance_mode
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'maintenance_mode' AND schemaname = 'public';

-- 3. Ver las políticas actuales en maintenance_mode (si las hay)
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'maintenance_mode' AND schemaname = 'public';

-- 4. Verificar si hay datos en maintenance_mode
SELECT * FROM public.maintenance_mode;

-- 5. Probar que las funciones de mantenimiento funcionan
SELECT get_maintenance_status();

-- SOLO DESPUÉS DE VERIFICAR ESTOS RESULTADOS, ejecutar fix-security-warnings.sql