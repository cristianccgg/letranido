-- EMERGENCIA: Desactivar modo mantenimiento
-- Ejecuta este SQL en la consola de Supabase para desactivar el modo mantenimiento

UPDATE maintenance_mode 
SET is_active = false, 
    message = 'Mantenimiento desactivado de emergencia',
    updated_at = NOW()
WHERE id = 1;

-- Verificar que se desactivó
SELECT * FROM maintenance_mode WHERE id = 1;