-- Migración OPCIONAL: Eliminar columna no_ai_confirmed de submission_consents
-- Fecha: 14 de agosto de 2025
-- Propósito: Eliminar checkbox de IA ya que no es verificable en la práctica

-- ⚠️ ADVERTENCIA: Esta migración es OPCIONAL
-- Si prefieres conservar los datos históricos, no ejecutes este script

-- 1. Verificar qué datos tenemos antes de eliminar
SELECT 
  no_ai_confirmed,
  COUNT(*) as count
FROM public.submission_consents 
GROUP BY no_ai_confirmed
ORDER BY no_ai_confirmed;

-- 2. Eliminar la columna no_ai_confirmed
-- DESCOMENTA LA SIGUIENTE LÍNEA SI ESTÁS SEGURO DE ELIMINAR LA COLUMNA:
-- ALTER TABLE public.submission_consents DROP COLUMN IF EXISTS no_ai_confirmed;

-- 3. Verificar que la columna fue eliminada
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'submission_consents' 
-- AND column_name = 'no_ai_confirmed';

-- Si el resultado está vacío, la columna fue eliminada exitosamente

-- NOTA: Si decides mantener la columna para datos históricos, 
-- simplemente no ejecutes el ALTER TABLE y conservarás la información.