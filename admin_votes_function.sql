-- Función para que los admins puedan ver todas las estadísticas de votos
-- Esta función se ejecuta con permisos SECURITY DEFINER (como superusuario)

CREATE OR REPLACE FUNCTION get_contest_stats_admin(contest_uuid UUID)
RETURNS TABLE (
    total_stories BIGINT,
    total_votes BIGINT,
    total_comments BIGINT,
    unique_voters BIGINT,
    unique_commenters BIGINT,
    unique_participants BIGINT,
    recent_votes_24h BIGINT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH contest_data AS (
        SELECT s.id as story_id, s.user_id as story_author
        FROM stories s
        WHERE s.contest_id = contest_uuid
    ),
    vote_data AS (
        SELECT v.user_id, v.story_id, v.created_at
        FROM votes v
        INNER JOIN contest_data cd ON v.story_id = cd.story_id
    ),
    comment_data AS (
        SELECT c.user_id, c.story_id, c.created_at
        FROM comments c  
        INNER JOIN contest_data cd ON c.story_id = cd.story_id
    )
    SELECT 
        (SELECT COUNT(*) FROM contest_data)::BIGINT,
        (SELECT COUNT(*) FROM vote_data)::BIGINT,
        (SELECT COUNT(*) FROM comment_data)::BIGINT,
        (SELECT COUNT(DISTINCT user_id) FROM vote_data)::BIGINT,
        (SELECT COUNT(DISTINCT user_id) FROM comment_data)::BIGINT,
        (SELECT COUNT(DISTINCT story_author) FROM contest_data)::BIGINT,
        (SELECT COUNT(*) FROM vote_data WHERE created_at >= NOW() - INTERVAL '24 hours')::BIGINT;
END;
$$;

-- Dar permisos a usuarios autenticados para ejecutar esta función
GRANT EXECUTE ON FUNCTION get_contest_stats_admin(UUID) TO authenticated;