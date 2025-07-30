-- Fix para los warnings de seguridad de Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Habilitar RLS en la tabla maintenance_mode
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para permitir lectura a TODOS los usuarios
-- Esto es necesario porque todos necesitan saber si el sitio está en mantenimiento
-- (usuarios normales para mostrar página de mantenimiento, admins para el panel)
CREATE POLICY "Allow read maintenance_mode for everyone" ON public.maintenance_mode
    FOR SELECT 
    TO public 
    USING (true);

-- 3. Crear política para permitir actualización solo a administradores
-- Asumiendo que tienes un campo role en auth.users o una tabla de roles
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

-- 4. Eliminar las vistas huérfanas de la funcionalidad de votos revertida
-- Estas vistas quedaron en la BD cuando revirtieron la funcionalidad de ocultar votos
DROP VIEW IF EXISTS public.admin_contest_stats;
DROP VIEW IF EXISTS public.popular_stories;  
DROP VIEW IF EXISTS public.user_stats;

-- 5. Si necesitas recrear la funcionalidad de las vistas, usa queries normales con RLS
-- Por ejemplo, en lugar de una vista admin_contest_stats, usa:
-- SELECT * FROM contests WHERE user_id = auth.uid() AND is_admin = true;

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'maintenance_mode' AND schemaname = 'public';