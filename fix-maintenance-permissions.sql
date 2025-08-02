-- Arreglar permisos para funciones de mantenimiento
-- Este script debe ejecutarse como admin en Supabase

-- 1. Asegurar que la tabla maintenance_mode tenga los permisos correctos
ALTER TABLE maintenance_mode ENABLE ROW LEVEL SECURITY;

-- 2. Política para que solo admins puedan modificar (usando user_profiles.is_admin)
DROP POLICY IF EXISTS "Only admins can modify maintenance" ON maintenance_mode;
CREATE POLICY "Only admins can modify maintenance" ON maintenance_mode
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.is_admin = true
  )
);

-- 3. Política para que cualquiera pueda leer el estado de mantenimiento
DROP POLICY IF EXISTS "Anyone can read maintenance status" ON maintenance_mode;
CREATE POLICY "Anyone can read maintenance status" ON maintenance_mode
FOR SELECT USING (true);

-- 4. Otorgar permisos a las funciones RPC
GRANT EXECUTE ON FUNCTION toggle_maintenance_mode TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_status TO authenticated, anon;

-- 5. Asegurar que las funciones se ejecuten con permisos elevados
CREATE OR REPLACE FUNCTION toggle_maintenance_mode(
    active BOOLEAN,
    custom_message TEXT DEFAULT NULL,
    duration TEXT DEFAULT NULL,
    admin_email TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
    user_is_admin BOOLEAN := false;
BEGIN
    -- Verificar que el usuario sea admin
    SELECT is_admin INTO user_is_admin
    FROM user_profiles 
    WHERE id = auth.uid();
    
    IF NOT COALESCE(user_is_admin, false) THEN
        RAISE EXCEPTION 'Only administrators can toggle maintenance mode';
    END IF;
    
    UPDATE maintenance_mode 
    SET 
        is_active = active,
        message = COALESCE(custom_message, message),
        estimated_duration = COALESCE(duration, estimated_duration),
        activated_at = CASE WHEN active THEN NOW() ELSE NULL END,
        activated_by = CASE WHEN active THEN admin_email ELSE NULL END,
        updated_at = NOW()
    WHERE id = 1;
    
    SELECT json_build_object(
        'success', true,
        'is_active', active,
        'message', message,
        'estimated_duration', estimated_duration,
        'activated_at', activated_at,
        'activated_by', activated_by
    ) INTO result
    FROM maintenance_mode
    WHERE id = 1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verificar que la función get_maintenance_status también funcione
CREATE OR REPLACE FUNCTION get_maintenance_status() RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'is_active', is_active,
        'message', message,
        'estimated_duration', estimated_duration,
        'activated_at', activated_at,
        'activated_by', activated_by
    ) INTO result
    FROM maintenance_mode
    WHERE id = 1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Insertar fila por defecto si no existe
INSERT INTO maintenance_mode (id, is_active, message, estimated_duration) 
VALUES (1, FALSE, 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.', '10 minutos')
ON CONFLICT (id) DO NOTHING;

-- 8. Verificación final
SELECT 'Permisos de mantenimiento configurados correctamente' as status;