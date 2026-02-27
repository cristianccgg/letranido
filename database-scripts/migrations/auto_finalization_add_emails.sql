-- =============================================================================
-- AUTO FINALIZATION - AGREGAR EMAILS AUTOMÁTICOS - Febrero 2026
-- =============================================================================
-- Actualiza schedule_contest_finalization() para programar también los 5 emails
-- del ciclo mensual además del job de cierre ya existente.
--
-- Calendario fijo (hora Colombia UTC-5):
--   - Nuevo reto:             Día 4 del mes,    10:00 AM → 15:00 UTC
--   - Recordatorio mitad:     Día 15 del mes,   10:00 AM → 15:00 UTC
--   - Recordatorio -24h:      Día 25 del mes,   10:00 AM → 15:00 UTC
--   - Votación iniciada:      Día 27 del mes,   12:01 AM → 05:01 UTC
--   - Recordatorio votación:  Día 1 mes sig,    10:00 AM → 15:00 UTC
--   - Resultados:             voting_deadline (ya implementado)
--
-- PREREQUISITO: Edge Function send-scheduled-email deployada
-- =============================================================================

CREATE OR REPLACE FUNCTION schedule_contest_finalization(p_contest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voting_deadline    TIMESTAMPTZ;
  v_submission_deadline TIMESTAMPTZ;
  v_id                 TEXT;
  v_cron_minute        INT;
  v_cron_hour          INT;
  v_cron_day           INT;
  v_cron_month         INT;
  v_cron_expression    TEXT;
  -- Mes/año para calcular fechas fijas de emails
  v_sub_month          INT;
  v_sub_year           INT;
  v_vote_month         INT;   -- mes del voting_deadline (mes siguiente al submission)
  v_vote_year          INT;
  -- Timestamps de cada email para verificar si ya pasaron
  v_email_new_ts       TIMESTAMPTZ;
  v_email_mid_ts       TIMESTAMPTZ;
  v_email_24h_ts       TIMESTAMPTZ;
  v_email_voting_ts    TIMESTAMPTZ;
  v_email_reminder_ts  TIMESTAMPTZ;
  v_now                TIMESTAMPTZ;
  v_jobs_scheduled     INT := 0;
  v_emails_scheduled   INT := 0;
BEGIN
  v_now := NOW();

  -- Obtener fechas del reto
  SELECT voting_deadline, submission_deadline
  INTO v_voting_deadline, v_submission_deadline
  FROM contests
  WHERE id = p_contest_id;

  IF v_voting_deadline IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reto no encontrado o sin voting_deadline');
  END IF;

  -- ID limpio sin guiones para nombres de jobs
  v_id := replace(p_contest_id::TEXT, '-', '_');

  -- =========================================================================
  -- PASO 1: CANCELAR TODOS LOS JOBS PREVIOS (para re-programación al editar)
  -- =========================================================================
  DECLARE
    v_job_names TEXT[] := ARRAY[
      'finalize_contest_'        || v_id,
      'email_new_contest_'       || v_id,
      'email_submission_mid_'    || v_id,
      'email_submission_24h_'    || v_id,
      'email_voting_started_'    || v_id,
      'email_voting_reminder_'   || v_id
    ];
    v_job TEXT;
  BEGIN
    FOREACH v_job IN ARRAY v_job_names LOOP
      BEGIN
        PERFORM cron.unschedule(v_job);
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Job no existía, continuar
      END;
    END LOOP;
  END;

  -- =========================================================================
  -- PASO 2: PROGRAMAR JOB DE CIERRE (voting_deadline exacto)
  -- =========================================================================
  v_cron_minute := EXTRACT(MINUTE FROM v_voting_deadline)::INT;
  v_cron_hour   := EXTRACT(HOUR FROM v_voting_deadline)::INT;
  v_cron_day    := EXTRACT(DAY FROM v_voting_deadline)::INT;
  v_cron_month  := EXTRACT(MONTH FROM v_voting_deadline)::INT;
  v_cron_expression := v_cron_minute || ' ' || v_cron_hour || ' ' || v_cron_day || ' ' || v_cron_month || ' *';

  PERFORM cron.schedule(
    'finalize_contest_' || v_id,
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
  v_jobs_scheduled := v_jobs_scheduled + 1;

  -- =========================================================================
  -- PASO 3: CALCULAR FECHAS FIJAS DE EMAILS
  -- Basadas en el mes de submission_deadline (mes del reto)
  -- =========================================================================
  -- Extraer mes/año de submission_deadline (en UTC)
  v_sub_month  := EXTRACT(MONTH FROM v_submission_deadline)::INT;
  v_sub_year   := EXTRACT(YEAR FROM v_submission_deadline)::INT;

  -- Mes del voting_deadline (mes siguiente = mes del recordatorio de votación y resultados)
  v_vote_month := EXTRACT(MONTH FROM v_voting_deadline)::INT;
  v_vote_year  := EXTRACT(YEAR FROM v_voting_deadline)::INT;

  -- Timestamps de cada email (en UTC, hora Colombia + 5h)
  -- Día 4 del mes, 15:00 UTC = 10:00 AM Colombia
  v_email_new_ts      := make_timestamptz(v_sub_year,  v_sub_month,  4,  15, 0, 0, 'UTC');
  -- Día 15 del mes, 15:00 UTC
  v_email_mid_ts      := make_timestamptz(v_sub_year,  v_sub_month,  15, 15, 0, 0, 'UTC');
  -- Día 25 del mes, 15:00 UTC
  v_email_24h_ts      := make_timestamptz(v_sub_year,  v_sub_month,  25, 15, 0, 0, 'UTC');
  -- Día 27 del mes, 05:01 UTC = 12:01 AM Colombia
  v_email_voting_ts   := make_timestamptz(v_sub_year,  v_sub_month,  27,  5, 1, 0, 'UTC');
  -- Día 1 del mes siguiente, 15:00 UTC
  v_email_reminder_ts := make_timestamptz(v_vote_year, v_vote_month,  1, 15, 0, 0, 'UTC');

  -- =========================================================================
  -- PASO 4: PROGRAMAR EMAILS (solo si la fecha no ha pasado)
  -- =========================================================================

  -- Helper interno para programar un email
  -- (usamos bloques anónimos para cada uno)

  -- Email 1: Nuevo reto (día 4)
  IF v_email_new_ts > v_now THEN
    PERFORM cron.schedule(
      'email_new_contest_' || v_id,
      EXTRACT(MINUTE FROM v_email_new_ts)::INT || ' ' ||
      EXTRACT(HOUR FROM v_email_new_ts)::INT || ' ' ||
      EXTRACT(DAY FROM v_email_new_ts)::INT || ' ' ||
      EXTRACT(MONTH FROM v_email_new_ts)::INT || ' *',
      format(
        $cmd$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-scheduled-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
          ),
          body := %L::BYTEA
        );
        $cmd$,
        jsonb_build_object('emailType', 'new_contest', 'contestId', p_contest_id)::TEXT
      )
    );
    v_emails_scheduled := v_emails_scheduled + 1;
  END IF;

  -- Email 2: Recordatorio mitad (día 15)
  IF v_email_mid_ts > v_now THEN
    PERFORM cron.schedule(
      'email_submission_mid_' || v_id,
      EXTRACT(MINUTE FROM v_email_mid_ts)::INT || ' ' ||
      EXTRACT(HOUR FROM v_email_mid_ts)::INT || ' ' ||
      EXTRACT(DAY FROM v_email_mid_ts)::INT || ' ' ||
      EXTRACT(MONTH FROM v_email_mid_ts)::INT || ' *',
      format(
        $cmd$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-scheduled-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
          ),
          body := %L::BYTEA
        );
        $cmd$,
        jsonb_build_object('emailType', 'submission_reminder', 'contestId', p_contest_id)::TEXT
      )
    );
    v_emails_scheduled := v_emails_scheduled + 1;
  END IF;

  -- Email 3: Recordatorio -24h (día 25)
  IF v_email_24h_ts > v_now THEN
    PERFORM cron.schedule(
      'email_submission_24h_' || v_id,
      EXTRACT(MINUTE FROM v_email_24h_ts)::INT || ' ' ||
      EXTRACT(HOUR FROM v_email_24h_ts)::INT || ' ' ||
      EXTRACT(DAY FROM v_email_24h_ts)::INT || ' ' ||
      EXTRACT(MONTH FROM v_email_24h_ts)::INT || ' *',
      format(
        $cmd$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-scheduled-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
          ),
          body := %L::BYTEA
        );
        $cmd$,
        jsonb_build_object('emailType', 'submission_reminder', 'contestId', p_contest_id)::TEXT
      )
    );
    v_emails_scheduled := v_emails_scheduled + 1;
  END IF;

  -- Email 4: Votación iniciada (día 27)
  IF v_email_voting_ts > v_now THEN
    PERFORM cron.schedule(
      'email_voting_started_' || v_id,
      EXTRACT(MINUTE FROM v_email_voting_ts)::INT || ' ' ||
      EXTRACT(HOUR FROM v_email_voting_ts)::INT || ' ' ||
      EXTRACT(DAY FROM v_email_voting_ts)::INT || ' ' ||
      EXTRACT(MONTH FROM v_email_voting_ts)::INT || ' *',
      format(
        $cmd$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-scheduled-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
          ),
          body := %L::BYTEA
        );
        $cmd$,
        jsonb_build_object('emailType', 'voting_started', 'contestId', p_contest_id)::TEXT
      )
    );
    v_emails_scheduled := v_emails_scheduled + 1;
  END IF;

  -- Email 5: Recordatorio votación (día 1 del mes siguiente)
  IF v_email_reminder_ts > v_now THEN
    PERFORM cron.schedule(
      'email_voting_reminder_' || v_id,
      EXTRACT(MINUTE FROM v_email_reminder_ts)::INT || ' ' ||
      EXTRACT(HOUR FROM v_email_reminder_ts)::INT || ' ' ||
      EXTRACT(DAY FROM v_email_reminder_ts)::INT || ' ' ||
      EXTRACT(MONTH FROM v_email_reminder_ts)::INT || ' *',
      format(
        $cmd$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-scheduled-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
          ),
          body := %L::BYTEA
        );
        $cmd$,
        jsonb_build_object('emailType', 'voting_reminder', 'contestId', p_contest_id)::TEXT
      )
    );
    v_emails_scheduled := v_emails_scheduled + 1;
  END IF;

  -- =========================================================================
  -- PASO 5: LOG DE AUDITORÍA
  -- =========================================================================
  INSERT INTO contest_automation_log (contest_id, action, scheduled_at, cron_job_name, notes)
  VALUES (
    p_contest_id,
    'scheduled',
    v_now,
    'finalize_contest_' || v_id,
    'Cierre + ' || v_emails_scheduled || ' emails programados. Votación cierra: ' ||
    (v_voting_deadline AT TIME ZONE 'America/Bogota')::TEXT
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'job_name', 'finalize_contest_' || v_id,
    'cron_expression', v_cron_expression,
    'voting_deadline_utc', v_voting_deadline::TEXT,
    'voting_deadline_colombia', (v_voting_deadline AT TIME ZONE 'America/Bogota')::TEXT,
    'jobs_scheduled', v_jobs_scheduled,
    'emails_scheduled', v_emails_scheduled,
    'email_dates', jsonb_build_object(
      'new_contest',        CASE WHEN v_email_new_ts > v_now
                            THEN (v_email_new_ts AT TIME ZONE 'America/Bogota')::TEXT
                            ELSE 'pasado - no programado' END,
      'submission_mid',     CASE WHEN v_email_mid_ts > v_now
                            THEN (v_email_mid_ts AT TIME ZONE 'America/Bogota')::TEXT
                            ELSE 'pasado - no programado' END,
      'submission_24h',     CASE WHEN v_email_24h_ts > v_now
                            THEN (v_email_24h_ts AT TIME ZONE 'America/Bogota')::TEXT
                            ELSE 'pasado - no programado' END,
      'voting_started',     CASE WHEN v_email_voting_ts > v_now
                            THEN (v_email_voting_ts AT TIME ZONE 'America/Bogota')::TEXT
                            ELSE 'pasado - no programado' END,
      'voting_reminder',    CASE WHEN v_email_reminder_ts > v_now
                            THEN (v_email_reminder_ts AT TIME ZONE 'America/Bogota')::TEXT
                            ELSE 'pasado - no programado' END
    )
  );
END;
$$;

COMMENT ON FUNCTION schedule_contest_finalization(UUID) IS
  'Programa el cierre automático y todos los emails del ciclo mensual via pg_cron. Seguro re-ejecutar (cancela y re-programa todos los jobs). Emails con fecha pasada se omiten automáticamente.';
