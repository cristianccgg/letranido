-- ============================================================================
-- MIGRACIÓN: Eliminar week_number y year de feed_prompts
-- Fecha: Febrero 2026
-- Propósito: Los prompts ya no son estrictamente semanales, solo usan start_date/end_date
-- ============================================================================

-- 1. Eliminar constraint UNIQUE que depende de estas columnas
ALTER TABLE feed_prompts DROP CONSTRAINT IF EXISTS unique_week_year;

-- 2. Eliminar índice que usa estas columnas
DROP INDEX IF EXISTS idx_feed_prompts_week_year;

-- 3. Eliminar columnas
ALTER TABLE feed_prompts DROP COLUMN IF EXISTS week_number;
ALTER TABLE feed_prompts DROP COLUMN IF EXISTS year;

-- 4. Hacer prompt_text opcional (antes era NOT NULL)
ALTER TABLE feed_prompts ALTER COLUMN prompt_text DROP NOT NULL;

-- 5. Reemplazar función auto_archive por auto_manage (archiva + auto-activa)
CREATE OR REPLACE FUNCTION auto_manage_feed_prompts()
RETURNS JSONB AS $$
DECLARE
  v_archived_count INTEGER;
  v_activated_count INTEGER;
BEGIN
  -- Paso 1: Archivar prompts activos cuya fecha de fin ya pasó
  WITH archived AS (
    UPDATE feed_prompts
    SET status = 'archived', updated_at = NOW()
    WHERE status = 'active' AND end_date < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_archived_count FROM archived;

  -- Paso 2: Auto-activar drafts cuya fecha de inicio ya llegó
  WITH activated AS (
    UPDATE feed_prompts
    SET status = 'active', updated_at = NOW()
    WHERE status = 'draft'
      AND start_date <= NOW()
      AND end_date > NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_activated_count FROM activated;

  RETURN jsonb_build_object(
    'archived', v_archived_count,
    'activated', v_activated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 6. RLS: Usuarios autenticados pueden ver drafts próximos (preview "siguiente prompt")
DROP POLICY IF EXISTS "Users can view upcoming draft prompts" ON feed_prompts;
CREATE POLICY "Users can view upcoming draft prompts"
ON feed_prompts FOR SELECT
USING (
  status = 'draft'
  AND start_date <= (NOW() + INTERVAL '30 days')
  AND auth.uid() IS NOT NULL
);
