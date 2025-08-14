-- Migración simplificada para badges - ejecutar paso a paso
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Crear tabla de definiciones de badges
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  color VARCHAR DEFAULT '#6366f1',
  tier INTEGER DEFAULT 1,
  criteria JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PASO 2: Crear tabla de badges de usuarios
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  badge_id VARCHAR REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- PASO 3: Insertar definiciones de badges
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria) VALUES
('first_story', 'Primera Pluma', 'Has publicado tu primera historia', 'feather', '#10b981', 1, '{"type": "story_count", "threshold": 1}'),
('writer_5', 'Escritor Constante', 'Has publicado 5 historias', 'book-open', '#3b82f6', 2, '{"type": "story_count", "threshold": 5}'),
('writer_15', 'Veterano de las Letras', 'Has publicado 15 historias', 'scroll', '#8b5cf6', 3, '{"type": "story_count", "threshold": 15}'),
('contest_winner', 'Campeón del Mes', 'Has ganado un concurso mensual', 'crown', '#f59e0b', 3, '{"type": "contest_winner", "position": 1}'),
('contest_finalist', 'Finalista', 'Has quedado en 2do o 3er lugar en un concurso', 'medal', '#6b7280', 2, '{"type": "contest_winner", "position": [2, 3]}'),
('contest_winner_veteran', 'Ganador Veterano', 'Has ganado 2 o más concursos', 'trophy', '#dc2626', 3, '{"type": "contest_wins", "threshold": 2}')
ON CONFLICT (id) DO NOTHING;

-- PASO 4: Función para verificar y otorgar badges automáticamente
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
      -- Intentar insertar el badge
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
  
  RETURN new_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Habilitar RLS
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- PASO 6: Políticas de seguridad básicas
CREATE POLICY "badge_definitions_read" ON public.badge_definitions
  FOR SELECT USING (true);

CREATE POLICY "user_badges_read_own" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Verificar que todo funciona
SELECT 'Setup completed successfully!' as status;