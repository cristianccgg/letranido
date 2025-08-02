-- Arreglo simple para mantenimiento - usando user_profiles correctamente

-- 1. Eliminar funciones anteriores que puedan tener errores
DROP FUNCTION IF EXISTS toggle_maintenance_mode(BOOLEAN, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_maintenance_status();

-- 2. Recrear la función toggle_maintenance_mode correctamente
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
    -- Verificar que el usuario sea admin usando user_profiles (NO users)
    SELECT COALESCE(is_admin, false) INTO user_is_admin
    FROM user_profiles 
    WHERE id = auth.uid();
    
    IF NOT user_is_admin THEN
        RAISE EXCEPTION 'Solo los administradores pueden cambiar el modo mantenimiento';
    END IF;
    
    -- Actualizar configuración de mantenimiento
    UPDATE maintenance_mode 
    SET 
        is_active = active,
        message = COALESCE(custom_message, message),
        estimated_duration = COALESCE(duration, estimated_duration),
        activated_at = CASE WHEN active THEN NOW() ELSE NULL END,
        activated_by = CASE WHEN active THEN admin_email ELSE NULL END,
        updated_at = NOW()
    WHERE id = 1;
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
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

-- 3. Recrear get_maintenance_status
CREATE OR REPLACE FUNCTION get_maintenance_status() RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'is_active', COALESCE(is_active, false),
        'message', COALESCE(message, 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.'),
        'estimated_duration', COALESCE(estimated_duration, '10 minutos'),
        'activated_at', activated_at,
        'activated_by', activated_by
    ) INTO result
    FROM maintenance_mode
    WHERE id = 1;
    
    RETURN COALESCE(result, '{"is_active": false, "message": "Sistema funcionando normalmente"}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Asegurar permisos
GRANT EXECUTE ON FUNCTION toggle_maintenance_mode TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_status TO authenticated, anon;

-- 5. Verificar que existe la fila de configuración
INSERT INTO maintenance_mode (id, is_active, message, estimated_duration) 
VALUES (1, false, 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.', '10 minutos')
ON CONFLICT (id) DO NOTHING;

-- 6. Verificación
SELECT 
    'Funciones de mantenimiento recreadas correctamente' as status,
    EXISTS(SELECT 1 FROM maintenance_mode WHERE id = 1) as config_exists;