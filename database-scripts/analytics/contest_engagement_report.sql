-- ============================================================================
-- Reporte de acogida/participación por reto mensual
-- ============================================================================
-- Objetivo: ver la evolución de participación (historias, autores únicos,
-- votos, votantes únicos) reto por reto en orden cronológico, para detectar
-- si la caída coincide con ciertos prompts/categorías o es una tendencia
-- general en el tiempo.
--
-- Uso: correr tal cual en el SQL Editor de Supabase (producción o local).
-- ============================================================================

SELECT
    c.id,
    c.month,
    c.title,
    c.category,
    c.status,
    c.created_at::date AS fecha_creacion,
    c.submission_deadline::date AS fecha_limite_envio,

    -- Participación en historias
    COUNT(DISTINCT s.id) AS total_historias,
    COUNT(DISTINCT s.user_id) AS autores_unicos,

    -- Participación en votación
    COUNT(DISTINCT v.id) AS total_votos,
    COUNT(DISTINCT v.user_id) AS votantes_unicos,

    -- Engagement adicional
    COALESCE(SUM(s.likes_count), 0) AS total_likes,
    COALESCE(SUM(s.comments_count), 0) AS total_comentarios,
    ROUND(AVG(s.word_count)) AS promedio_palabras,

    -- Ratio de votos por historia (qué tanto se movió la fase de votación)
    ROUND(
        COUNT(DISTINCT v.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0),
        2
    ) AS votos_por_historia

FROM contests c
LEFT JOIN stories s ON s.contest_id = c.id
LEFT JOIN votes v ON v.story_id = s.id
GROUP BY c.id, c.month, c.title, c.category, c.status, c.created_at, c.submission_deadline
ORDER BY c.created_at ASC;

-- ============================================================================
-- Variante: solo retos ya finalizados, con ranking de "acogida" (más a menos)
-- ============================================================================
-- SELECT
--     c.month,
--     c.title,
--     c.category,
--     COUNT(DISTINCT s.id) AS total_historias,
--     COUNT(DISTINCT s.user_id) AS autores_unicos,
--     COUNT(DISTINCT v.id) AS total_votos,
--     COUNT(DISTINCT v.user_id) AS votantes_unicos
-- FROM contests c
-- LEFT JOIN stories s ON s.contest_id = c.id
-- LEFT JOIN votes v ON v.story_id = s.id
-- WHERE c.status = 'results'
-- GROUP BY c.id, c.month, c.title, c.category
-- ORDER BY total_historias DESC, votantes_unicos DESC;

-- ============================================================================
-- Variante: comparar participación por categoría/tema de prompt
-- (útil para responder "¿ciertos prompts atraen menos gente?")
-- ============================================================================
-- SELECT
--     c.category,
--     COUNT(DISTINCT c.id) AS retos_con_esta_categoria,
--     ROUND(AVG(sub.total_historias), 1) AS promedio_historias,
--     ROUND(AVG(sub.autores_unicos), 1) AS promedio_autores,
--     ROUND(AVG(sub.votantes_unicos), 1) AS promedio_votantes
-- FROM contests c
-- JOIN LATERAL (
--     SELECT
--         COUNT(DISTINCT s.id) AS total_historias,
--         COUNT(DISTINCT s.user_id) AS autores_unicos,
--         COUNT(DISTINCT v.user_id) AS votantes_unicos
--     FROM stories s
--     LEFT JOIN votes v ON v.story_id = s.id
--     WHERE s.contest_id = c.id
-- ) sub ON true
-- GROUP BY c.category
-- ORDER BY promedio_historias DESC;
