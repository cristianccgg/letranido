-- Tabla para registrar envíos de emails en Letranido
-- Ejecutar este script en el editor SQL de Supabase

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type text NOT NULL, -- 'new_contest', 'submission_reminder', 'voting_started', 'results'
  contest_id uuid REFERENCES contests(id) ON DELETE CASCADE,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT true,
  error_message text NULL,
  
  -- Índices para consultas frecuentes
  created_at timestamp with time zone DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS email_logs_contest_id_idx ON email_logs(contest_id);
CREATE INDEX IF NOT EXISTS email_logs_email_type_idx ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS email_logs_sent_at_idx ON email_logs(sent_at);

-- Política de seguridad (solo administradores pueden ver logs)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Solo usuarios autenticados pueden leer logs (puedes restringir más según tus necesidades)
CREATE POLICY "Users can view email logs" ON email_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo el sistema puede insertar logs
CREATE POLICY "System can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE email_logs IS 'Registro de todos los emails enviados por el sistema de Letranido';
COMMENT ON COLUMN email_logs.email_type IS 'Tipo de email: new_contest, submission_reminder, voting_started, results';
COMMENT ON COLUMN email_logs.contest_id IS 'ID del concurso relacionado con el email';
COMMENT ON COLUMN email_logs.recipient_count IS 'Número de destinatarios que recibieron el email';
COMMENT ON COLUMN email_logs.sent_at IS 'Timestamp de cuándo se envió el email';
COMMENT ON COLUMN email_logs.success IS 'Si el envío fue exitoso o no';
COMMENT ON COLUMN email_logs.error_message IS 'Mensaje de error si el envío falló';