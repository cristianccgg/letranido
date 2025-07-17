# Contest Deadline Checker

Edge Function que verifica automáticamente los deadlines de concursos y envía emails cuando corresponde.

## Funcionalidad

- Se ejecuta periódicamente (cada hora vía cron job)
- Detecta concursos que pasaron su `submission_deadline`
- Envía automáticamente email "voting_started" 
- Previene envío duplicado verificando `email_logs`
- Incluye tanto usuarios registrados como newsletter subscribers

## Configuración

### 1. Deployar la función
```bash
supabase functions deploy contest-deadline-checker
```

### 2. Configurar Cron Job
En Supabase → Database → Extensions → pg_cron:

```sql
-- Ejecutar cada hora
SELECT cron.schedule(
  'contest-deadline-checker',
  '0 * * * *',
  $$SELECT net.http_post(
    'https://pvcqonrukrsecgmczwqu.supabase.co/functions/v1/contest-deadline-checker',
    '{}',
    'application/json',
    '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'
  )$$
);
```

### 3. Verificar funcionamiento
```sql
-- Ver logs de cron
SELECT * FROM cron.job_run_details 
WHERE jobname = 'contest-deadline-checker' 
ORDER BY start_time DESC;

-- Ver emails enviados
SELECT * FROM email_logs 
WHERE email_type = 'voting_started' 
ORDER BY created_at DESC;
```

## Logs y Monitoreo

La función registra:
- Concursos procesados
- Emails enviados exitosamente
- Errores y fallos
- Prevención de duplicados

## Manejo de Errores

- Verifica que existan concursos elegibles
- Previene envío duplicado
- Maneja errores de red
- Logs detallados para debugging