-- SCRIPT GRADUAL Y SEGURO para arreglar warnings de seguridad
-- Ejecutar paso a paso, verificando después de cada uno

-- ========================================
-- PASO 1: Solo habilitar RLS (NO afecta funcionalidad actual)
-- ========================================
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Verificar que se habilitó:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'maintenance_mode';

-- ========================================
-- PASO 2: Agregar política de lectura (mantiene funcionalidad actual)
-- ========================================
CREATE POLICY "Allow read maintenance_mode for everyone" ON public.maintenance_mode
    FOR SELECT 
    TO public 
    USING (true);

-- Verificar que funciona:
-- SELECT get_maintenance_status();

-- ========================================
-- PASO 3: Agregar política de escritura para admins
-- ========================================
CREATE POLICY "Allow update maintenance_mode for admins" ON public.maintenance_mode
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Probar desde el panel de admin que puedes activar/desactivar mantenimiento

-- ========================================
-- PASO 4: RESPALDO - Crear script para revertir cambios si algo sale mal
-- ========================================
/*
-- SCRIPT DE EMERGENCIA PARA REVERTIR (solo ejecutar si hay problemas):

-- Deshabilitar RLS
ALTER TABLE public.maintenance_mode DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas
DROP POLICY IF EXISTS "Allow read maintenance_mode for everyone" ON public.maintenance_mode;
DROP POLICY IF EXISTS "Allow update maintenance_mode for admins" ON public.maintenance_mode;
*/

-- ========================================
-- PASO 5: Solo cuando TODO funcione bien, eliminar vistas huérfanas
-- ========================================
/*
-- EJECUTAR SOLO DESPUÉS DE CONFIRMAR QUE PASOS 1-3 FUNCIONAN:

DROP VIEW IF EXISTS public.admin_contest_stats;
DROP VIEW IF EXISTS public.popular_stories;  
DROP VIEW IF EXISTS public.user_stats;

-- Verificar que warnings de Supabase desaparecieron
*/