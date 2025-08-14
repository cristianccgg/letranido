-- fix_badges_policies.sql
-- Arreglar políticas RLS de las tablas de badges que están causando errores de acceso

-- PASO 1: Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "badge_definitions_read" ON public.badge_definitions;
DROP POLICY IF EXISTS "user_badges_read_own" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_insert_system" ON public.user_badges;

-- PASO 2: Crear políticas más permisivas para badge_definitions
-- Los badge definitions deben ser públicos (todos pueden leerlos)
CREATE POLICY "badge_definitions_public_read" ON public.badge_definitions
  FOR SELECT USING (true);

-- PASO 3: Crear política para user_badges 
-- Los usuarios pueden ver sus propios badges
CREATE POLICY "user_badges_read_own" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- PASO 4: Permitir inserción de badges por el sistema (triggers/funciones)
CREATE POLICY "user_badges_insert_system" ON public.user_badges
  FOR INSERT WITH CHECK (true);

-- PASO 5: Permitir updates del sistema para metadatos
CREATE POLICY "user_badges_update_system" ON public.user_badges
  FOR UPDATE USING (true) WITH CHECK (true);

-- PASO 6: Verificar que las tablas existen
SELECT 
  'badge_definitions' as table_name,
  COUNT(*) as record_count
FROM public.badge_definitions
UNION ALL
SELECT 
  'user_badges' as table_name,
  COUNT(*) as record_count  
FROM public.user_badges;

-- PASO 7: Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('badge_definitions', 'user_badges')
  AND schemaname = 'public';

SELECT 'Badge policies fixed successfully!' as status;