-- Migración: Nuevos badges de participación, comunidad y escritura avanzada
-- Fecha: Enero 2026
--
-- NUEVOS BADGES:
-- 1. writer_25 (Novelista) - 25 historias publicadas
-- 2. participant_3 (Participante) - 3 retos participados
-- 3. participant_6 (Participante Fiel) - 6 retos participados
-- 4. participant_10 (Veterano de Retos) - 10 retos participados
-- 5. explorer_30 (Explorador) - Leer de 30 autores distintos
-- 6. voter_10 (Votante Comprometido) - Votar en 10 retos diferentes
--
-- IMPORTANTE: Ejecutar este script DESPUÉS de verificar que las funciones actuales funcionan

-- ============================================================================
-- PASO 1: Insertar definiciones de nuevos badges
-- ============================================================================

-- Badge de escritura avanzada
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'writer_25',
  'Novelista',
  'Has publicado 25 historias',
  'pen-tool',
  '#8b5cf6',
  3,
  '{"type": "story_count", "threshold": 25}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

-- Badges de participación (progresión 3 → 6 → 10)
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'participant_3',
  'Participante',
  'Has participado en 3 retos',
  'flag',
  '#10b981',
  1,
  '{"type": "contest_participation", "threshold": 3}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'participant_6',
  'Participante Fiel',
  'Has participado en 6 retos',
  'flag',
  '#3b82f6',
  2,
  '{"type": "contest_participation", "threshold": 6}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'participant_10',
  'Veterano de Retos',
  'Has participado en 10 retos',
  'flag',
  '#8b5cf6',
  3,
  '{"type": "contest_participation", "threshold": 10}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

-- Badge de comunidad: Explorador (leer de 30 autores distintos)
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'explorer_30',
  'Explorador',
  'Has leído historias de 30 autores diferentes',
  'compass',
  '#f59e0b',
  3,
  '{"type": "unique_authors_read", "threshold": 30}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

-- Badge de comunidad: Votante Comprometido (votar en 10 retos)
INSERT INTO public.badge_definitions (id, name, description, icon, color, tier, criteria)
VALUES (
  'voter_10',
  'Votante Comprometido',
  'Has votado en 10 retos diferentes',
  'check-circle',
  '#ec4899',
  3,
  '{"type": "contests_voted", "threshold": 10}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria;

-- ============================================================================
-- PASO 2: Actualizar función check_and_award_badges para incluir nuevos tipos
-- ============================================================================

DROP FUNCTION IF EXISTS check_and_award_badges(UUID);

CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_story_count INTEGER;
  v_contest_wins INTEGER;
  v_contest_participations INTEGER;
  v_unique_authors_read INTEGER;
  v_contests_voted INTEGER;
  new_badges JSONB := '[]'::JSONB;
  badge_record RECORD;
  badge_exists BOOLEAN;
BEGIN
  -- ========================================
  -- OBTENER ESTADÍSTICAS DEL USUARIO
  -- ========================================

  -- Contar historias publicadas
  SELECT COUNT(*) INTO v_story_count
  FROM public.stories
  WHERE user_id = target_user_id AND published_at IS NOT NULL;

  -- Contar solo victorias en PRIMER lugar (winner_position = 1)
  SELECT COUNT(*) INTO v_contest_wins
  FROM public.stories
  WHERE user_id = target_user_id
    AND is_winner = true
    AND winner_position = 1;

  -- Contar retos en los que ha participado (historias publicadas en retos únicos)
  SELECT COUNT(DISTINCT contest_id) INTO v_contest_participations
  FROM public.stories
  WHERE user_id = target_user_id
    AND published_at IS NOT NULL
    AND contest_id IS NOT NULL;

  -- Contar autores únicos cuyas historias ha leído
  SELECT COUNT(DISTINCT s.user_id) INTO v_unique_authors_read
  FROM public.user_story_reads usr
  JOIN public.stories s ON usr.story_id = s.id
  WHERE usr.user_id = target_user_id
    AND s.user_id != target_user_id;  -- No contar historias propias

  -- Contar retos en los que ha votado
  SELECT COUNT(DISTINCT s.contest_id) INTO v_contests_voted
  FROM public.votes v
  JOIN public.stories s ON v.story_id = s.id
  WHERE v.user_id = target_user_id
    AND s.contest_id IS NOT NULL;

  -- ========================================
  -- VERIFICAR BADGES DE CONTEO DE HISTORIAS
  -- ========================================
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'story_count'
  LOOP
    IF v_story_count >= (badge_record.criteria->>'threshold')::INTEGER THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  -- ========================================
  -- VERIFICAR BADGES DE VICTORIAS EN CONCURSOS
  -- ========================================
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'contest_wins'
  LOOP
    IF v_contest_wins >= (badge_record.criteria->>'threshold')::INTEGER THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  -- ========================================
  -- VERIFICAR BADGES DE PARTICIPACIÓN EN RETOS
  -- ========================================
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'contest_participation'
  LOOP
    IF v_contest_participations >= (badge_record.criteria->>'threshold')::INTEGER THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  -- ========================================
  -- VERIFICAR BADGE DE EXPLORADOR (autores leídos)
  -- ========================================
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'unique_authors_read'
  LOOP
    IF v_unique_authors_read >= (badge_record.criteria->>'threshold')::INTEGER THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

        new_badges := new_badges || jsonb_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description
        );
      END IF;
    END IF;
  END LOOP;

  -- ========================================
  -- VERIFICAR BADGE DE VOTANTE COMPROMETIDO
  -- ========================================
  FOR badge_record IN
    SELECT * FROM public.badge_definitions
    WHERE criteria->>'type' = 'contests_voted'
  LOOP
    IF v_contests_voted >= (badge_record.criteria->>'threshold')::INTEGER THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_badges
        WHERE user_id = target_user_id AND badge_id = badge_record.id
      ) INTO badge_exists;

      IF NOT badge_exists THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, badge_record.id);

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

COMMENT ON FUNCTION check_and_award_badges IS 'Verifica y otorga badges automáticos. Tipos soportados: story_count, contest_wins, contest_participation, unique_authors_read, contests_voted. Variables con prefijo v_ para evitar ambigüedad. Retorna JSONB.';

-- ============================================================================
-- PASO 3: Crear función para asignar badges retroactivos a usuarios existentes
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_retroactive_badges()
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  badges_awarded JSONB
) AS $$
DECLARE
  user_record RECORD;
  awarded JSONB;
BEGIN
  -- Iterar sobre todos los usuarios con historias publicadas
  FOR user_record IN
    SELECT DISTINCT up.id, up.display_name
    FROM public.user_profiles up
    JOIN public.stories s ON s.user_id = up.id
    WHERE s.published_at IS NOT NULL
  LOOP
    -- Llamar check_and_award_badges para cada usuario
    SELECT check_and_award_badges(user_record.id) INTO awarded;

    -- Solo retornar usuarios que recibieron badges
    IF awarded IS NOT NULL AND jsonb_array_length(awarded) > 0 THEN
      user_id := user_record.id;
      display_name := user_record.display_name;
      badges_awarded := awarded;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_retroactive_badges IS 'Asigna badges retroactivos a todos los usuarios existentes que califican. Usar después de agregar nuevos badges.';

-- ============================================================================
-- PASO 4: Verificar que las definiciones se insertaron correctamente
-- ============================================================================

SELECT
  id,
  name,
  tier,
  criteria->>'type' as type,
  criteria->>'threshold' as threshold
FROM public.badge_definitions
ORDER BY
  CASE criteria->>'type'
    WHEN 'story_count' THEN 1
    WHEN 'contest_participation' THEN 2
    WHEN 'contest_wins' THEN 3
    WHEN 'unique_authors_read' THEN 4
    WHEN 'contests_voted' THEN 5
    ELSE 6
  END,
  (criteria->>'threshold')::INTEGER;

-- ============================================================================
-- PASO 5: EJECUTAR ASIGNACIÓN RETROACTIVA (descomentar cuando esté listo)
-- ============================================================================

-- ⚠️ IMPORTANTE: Ejecutar esto SOLO después de verificar que todo está bien
-- SELECT * FROM assign_retroactive_badges();
