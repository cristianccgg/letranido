-- Migración: Agregar columna public_risk_acknowledged a submission_consents
-- Fecha: 14 de agosto de 2025
-- Propósito: Agregar tracking del nuevo checkbox de reconocimiento de riesgo público

-- 1. Agregar la nueva columna
ALTER TABLE public.submission_consents 
ADD COLUMN IF NOT EXISTS public_risk_acknowledged boolean DEFAULT false;

-- 2. Actualizar registros existentes para que tengan valor por defecto true
-- (asumimos que los usuarios anteriores aceptaron implícitamente el riesgo)
UPDATE public.submission_consents 
SET public_risk_acknowledged = true 
WHERE public_risk_acknowledged IS NULL OR public_risk_acknowledged = false;

-- 3. Hacer la columna NOT NULL después de actualizar los datos
ALTER TABLE public.submission_consents 
ALTER COLUMN public_risk_acknowledged SET NOT NULL;

-- 4. Crear comentario para documentación
COMMENT ON COLUMN public.submission_consents.public_risk_acknowledged IS 
'Usuario reconoce que su historia será pública y que otros pueden copiarla. Agregado en agosto 2025.';

-- 5. Verificar la migración
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'submission_consents' 
AND column_name = 'public_risk_acknowledged';