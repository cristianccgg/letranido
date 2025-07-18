-- Migración para sistema de badges
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de definiciones de badges
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR, -- CSS class or identifier for badge style
  color VARCHAR DEFAULT '#6366f1', -- Badge color
  tier INTEGER DEFAULT 1, -- 1=Bronze, 2=Silver, 3=Gold
  criteria JSONB, -- Criteria for earning the badge
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Crear tabla de badges de usuarios
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  badge_id VARCHAR REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- Store additional data like contest_id for winner badges
  UNIQUE(user_id, badge_id) -- Un usuario no puede tener el mismo badge múltiples veces
);

-- 3. Insertar definiciones de badges iniciales
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria) VALUES
-- Badges de escritura
('first_story', 'Primera Pluma', 'Has publicado tu primera historia', 'feather', '#10b981', 1, '{"type": "story_count", "threshold": 1}'),
('writer_5', 'Escritor Constante', 'Has publicado 5 historias', 'book-open', '#3b82f6', 2, '{"type": "story_count", "threshold": 5}'),
('writer_15', 'Veterano de las Letras', 'Has publicado 15 historias', 'scroll', '#8b5cf6', 3, '{"type": "story_count", "threshold": 15}'),

-- Badges de concursos
('contest_winner', 'Campeón del Mes', 'Has ganado un concurso mensual', 'crown', '#f59e0b', 3, '{"type": "contest_winner", "position": 1}'),
('contest_finalist', 'Finalista', 'Has quedado en 2do o 3er lugar en un concurso', 'medal', '#6b7280', 2, '{"type": "contest_winner", "position": [2, 3]}'),
('contest_winner_veteran', 'Ganador Veterano', 'Has ganado 2 o más concursos', 'trophy', '#dc2626', 3, '{"type": "contest_wins", "threshold": 2}');

-- 4. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges (badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges (earned_at);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas de seguridad
-- Todos pueden leer las definiciones de badges
CREATE POLICY "badge_definitions_read" ON public.badge_definitions
  FOR SELECT USING (true);

-- Solo los usuarios pueden ver sus propios badges
CREATE POLICY "user_badges_read_own" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el sistema puede insertar badges (usuarios no pueden auto-otorgarse badges)
CREATE POLICY "user_badges_insert_system" ON public.user_badges
  FOR INSERT WITH CHECK (false); -- Solo funciones del servidor pueden insertar

-- 7. Función para verificar y otorgar badges automáticamente
CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  story_count INTEGER;
  contest_wins INTEGER;
  new_badges JSON := '[]'::JSON;
  badge_record RECORD;
BEGIN
  -- Obtener estadísticas del usuario
  SELECT COUNT(*) INTO story_count 
  FROM public.stories 
  WHERE user_id = target_user_id AND published_at IS NOT NULL;
  
  SELECT COUNT(*) INTO contest_wins 
  FROM public.stories 
  WHERE user_id = target_user_id AND is_winner = true;
  
  -- Verificar badges de conteo de historias
  FOR badge_record IN 
    SELECT * FROM public.badge_definitions 
    WHERE criteria->>'type' = 'story_count'
  LOOP
    IF story_count >= (badge_record.criteria->>'threshold')::INTEGER THEN
      -- Intentar insertar el badge (si ya existe, será ignorado por UNIQUE constraint)
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (target_user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      -- Si fue insertado, agregarlo a la respuesta
      IF FOUND THEN
        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Verificar badges de victorias en concursos
  FOR badge_record IN 
    SELECT * FROM public.badge_definitions 
    WHERE criteria->>'type' = 'contest_wins'
  LOOP
    IF contest_wins >= (badge_record.criteria->>'threshold')::INTEGER THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (target_user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      IF FOUND THEN
        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN new_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para otorgar badge específico (para ganadores de concursos)
CREATE OR REPLACE FUNCTION award_specific_badge(target_user_id UUID, badge_type VARCHAR, contest_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  badge_id VARCHAR;
BEGIN
  -- Determinar qué badge otorgar basado en el tipo
  CASE badge_type
    WHEN 'contest_winner' THEN
      badge_id := 'contest_winner';
    WHEN 'contest_finalist' THEN
      badge_id := 'contest_finalist';
    ELSE
      RETURN false;
  END CASE;
  
  -- Insertar el badge
  INSERT INTO public.user_badges (user_id, badge_id, metadata)
  VALUES (target_user_id, badge_id, 
    CASE WHEN contest_id IS NOT NULL THEN 
      jsonb_build_object('contest_id', contest_id)
    ELSE 
      '{}'::jsonb 
    END)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Comentarios para documentación
COMMENT ON TABLE public.badge_definitions IS 'Definiciones de todos los badges disponibles en el sistema';
COMMENT ON TABLE public.user_badges IS 'Badges ganados por cada usuario';
COMMENT ON FUNCTION check_and_award_badges IS 'Verifica y otorga automáticamente badges basados en estadísticas del usuario';
COMMENT ON FUNCTION award_specific_badge IS 'Otorga un badge específico a un usuario (para eventos especiales como ganar concursos)';