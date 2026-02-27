-- =============================================================================
-- AUTO FINALIZATION SETUP - Febrero 2026
-- =============================================================================
-- Automatiza el cierre de retos mensuales via pg_cron + Edge Function.
--
-- Flujo:
--   1. Admin crea/edita reto → llama schedule_contest_finalization()
--   2. pg_cron dispara la Edge Function auto-finalize-contest en el momento exacto
--   3. Edge Function finaliza el reto y envía emails de resultados
--
-- PREREQUISITOS:
--   - Habilitar extensión pg_cron en Supabase Dashboard → Database → Extensions
--   - Habilitar extensión pg_net en Supabase Dashboard → Database → Extensions
--   - Deployar Edge Function: supabase functions deploy auto-finalize-contest
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA DE AUDITORÍA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contest_automation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'scheduled', 'rescheduled', 'cancelled', 'finalized', 'skipped_already_finalized', 'error'
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  cron_job_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas por reto
CREATE INDEX IF NOT EXISTS idx_automation_log_contest_id
  ON contest_automation_log(contest_id);

-- RLS: Solo admins pueden leer/escribir
ALTER TABLE contest_automation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read automation log" ON contest_automation_log;
CREATE POLICY "Admins can read automation log"
  ON contest_automation_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- La función SECURITY DEFINER puede escribir sin autenticación (para el cron)
DROP POLICY IF EXISTS "Service can insert automation log" ON contest_automation_log;
CREATE POLICY "Service can insert automation log"
  ON contest_automation_log FOR INSERT
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 2. FUNCIÓN: schedule_contest_finalization
-- Programa un cron job de un solo disparo para cuando vence el voting_deadline.
-- Llamada desde el frontend al crear o editar un reto.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION schedule_contest_finalization(p_contest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voting_deadline TIMESTAMPTZ;
  v_job_name TEXT;
  v_cron_minute INT;
  v_cron_hour INT;
  v_cron_day INT;
  v_cron_month INT;
  v_cron_expression TEXT;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Obtener voting_deadline del reto (guardado en UTC en la BD)
  SELECT voting_deadline INTO v_voting_deadline
  FROM contests
  WHERE id = p_contest_id;

  IF v_voting_deadline IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reto no encontrado o sin voting_deadline');
  END IF;

  -- Nombre único del job (se reutiliza al editar para re-programar)
  v_job_name := 'finalize_contest_' || replace(p_contest_id::TEXT, '-', '_');

  -- Eliminar job previo si existe (para re-programación al editar el reto)
  BEGIN
    PERFORM cron.unschedule(v_job_name);
  EXCEPTION WHEN OTHERS THEN
    -- Job no existía, continuar normalmente
    NULL;
  END;

  -- pg_cron opera en UTC. Extraer componentes UTC del voting_deadline.
  v_cron_minute := EXTRACT(MINUTE FROM v_voting_deadline)::INT;
  v_cron_hour   := EXTRACT(HOUR FROM v_voting_deadline)::INT;
  v_cron_day    := EXTRACT(DAY FROM v_voting_deadline)::INT;
  v_cron_month  := EXTRACT(MONTH FROM v_voting_deadline)::INT;

  -- Cron expression: "minuto hora día mes *" (corre 1 sola vez en esa fecha/hora UTC)
  v_cron_expression := v_cron_minute || ' ' || v_cron_hour || ' ' || v_cron_day || ' ' || v_cron_month || ' *';

  -- Programar el job para llamar a la Edge Function via pg_net
  -- La Edge Function maneja toda la lógica de finalización y envío de emails
  PERFORM cron.schedule(
    v_job_name,
    v_cron_expression,
    format(
      $cmd$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/auto-finalize-contest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := %L::BYTEA
      );
      $cmd$,
      jsonb_build_object('contestId', p_contest_id)::TEXT
    )
  );

  -- Registrar en log de auditoría
  INSERT INTO contest_automation_log (contest_id, action, scheduled_at, cron_job_name, notes)
  VALUES (
    p_contest_id,
    'scheduled',
    NOW(),
    v_job_name,
    'Cierre automático programado para: ' || (v_voting_deadline AT TIME ZONE 'America/Bogota')::TEXT
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'job_name', v_job_name,
    'cron_expression', v_cron_expression,
    'voting_deadline_utc', v_voting_deadline::TEXT,
    'voting_deadline_colombia', (v_voting_deadline AT TIME ZONE 'America/Bogota')::TEXT
  );
END;
$$;

-- Comentario
COMMENT ON FUNCTION schedule_contest_finalization(UUID) IS
  'Programa un cron job via pg_cron para auto-finalizar un reto cuando vence su voting_deadline. Seguro re-ejecutar (reemplaza job existente).';


-- -----------------------------------------------------------------------------
-- 3. FUNCIÓN: cancel_contest_finalization
-- Cancela el cron job programado (útil si se borra o cambia drásticamente un reto).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_contest_finalization(p_contest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_name TEXT;
BEGIN
  v_job_name := 'finalize_contest_' || replace(p_contest_id::TEXT, '-', '_');

  BEGIN
    PERFORM cron.unschedule(v_job_name);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job no encontrado: ' || v_job_name);
  END;

  -- Log
  INSERT INTO contest_automation_log (contest_id, action, executed_at, cron_job_name, notes)
  VALUES (p_contest_id, 'cancelled', NOW(), v_job_name, 'Cierre automático cancelado manualmente');

  RETURN jsonb_build_object('success', true, 'job_name', v_job_name);
END;
$$;

COMMENT ON FUNCTION cancel_contest_finalization(UUID) IS
  'Cancela el cron job de auto-finalización de un reto. Útil si se elimina o reprograma un reto.';


-- -----------------------------------------------------------------------------
-- INSTRUCCIONES DE VERIFICACIÓN
-- -----------------------------------------------------------------------------
-- 1. Verificar que pg_cron está activo:
--    SELECT * FROM cron.job;
--
-- 2. Verificar que pg_net está activo:
--    SELECT * FROM pg_extension WHERE extname = 'pg_net';
--
-- 3. Ver logs de ejecución de cron:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- 4. Ver log de automatización:
--    SELECT * FROM contest_automation_log ORDER BY created_at DESC;
--
-- 5. Programar el reto ACTUAL (ya en progreso, reemplazar UUID):
--    SELECT schedule_contest_finalization('UUID-DEL-RETO-ACTUAL');
-- =============================================================================
