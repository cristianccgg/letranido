-- Tabla para controlar el modo mantenimiento
CREATE TABLE IF NOT EXISTS maintenance_mode (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_active BOOLEAN DEFAULT FALSE,
    message TEXT DEFAULT 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.',
    estimated_duration TEXT DEFAULT '10 minutos',
    activated_at TIMESTAMP WITH TIME ZONE,
    activated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que solo hay una fila de configuración
INSERT INTO maintenance_mode (id, is_active, message, estimated_duration) 
VALUES (1, FALSE, 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.', '10 minutos')
ON CONFLICT (id) DO NOTHING;

-- Función para activar/desactivar modo mantenimiento
CREATE OR REPLACE FUNCTION toggle_maintenance_mode(
    active BOOLEAN,
    custom_message TEXT DEFAULT NULL,
    duration TEXT DEFAULT NULL,
    admin_email TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
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
$$ LANGUAGE plpgsql;

-- Función para obtener estado de mantenimiento
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
$$ LANGUAGE plpgsql;