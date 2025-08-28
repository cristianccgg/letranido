-- Funciones SQL para Analytics Dashboard - VERSIÓN CORREGIDA
-- Sintaxis PostgreSQL válida

-- Función para obtener usuarios premium-ready
CREATE OR REPLACE FUNCTION get_premium_ready_users(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    engagement_score INTEGER,
    stories_count BIGINT,
    votes_count BIGINT,
    comments_count BIGINT,
    likes_received INTEGER,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    interval_text TEXT;
BEGIN
    interval_text := days_back || ' days';
    
    RETURN QUERY
    EXECUTE 'SELECT 
        up.id as user_id,
        up.display_name,
        (
            COALESCE(s.story_count, 0) * 10 + 
            COALESCE(v.vote_count, 0) * 2 + 
            COALESCE(c.comment_count, 0) * 3
        )::INTEGER as engagement_score,
        COALESCE(s.story_count, 0) as stories_count,
        COALESCE(v.vote_count, 0) as votes_count, 
        COALESCE(c.comment_count, 0) as comments_count,
        COALESCE(s.total_likes, 0) as likes_received,
        up.created_at
    FROM user_profiles up
    LEFT JOIN (
        SELECT 
            user_id, 
            COUNT(*) as story_count,
            SUM(likes_count) as total_likes
        FROM stories 
        WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''
        GROUP BY user_id
    ) s ON s.user_id = up.id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as vote_count
        FROM votes 
        WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''
        GROUP BY user_id
    ) v ON v.user_id = up.id  
    LEFT JOIN (
        SELECT user_id, COUNT(*) as comment_count
        FROM comments 
        WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''
        GROUP BY user_id
    ) c ON c.user_id = up.id
    WHERE up.created_at >= NOW() - INTERVAL ''' || interval_text || '''
    AND (
        COALESCE(s.story_count, 0) * 10 + 
        COALESCE(v.vote_count, 0) * 2 + 
        COALESCE(c.comment_count, 0) * 3
    ) >= 50
    AND COALESCE(s.story_count, 0) >= 2
    ORDER BY engagement_score DESC';
END;
$$;

-- Función simplificada para métricas básicas de engagement
CREATE OR REPLACE FUNCTION get_basic_engagement_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_users BIGINT,
    active_creators BIGINT,
    active_voters BIGINT,
    active_commenters BIGINT,
    super_active_users BIGINT,
    creator_rate NUMERIC,
    voter_rate NUMERIC,
    commenter_rate NUMERIC,
    super_active_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    interval_text TEXT;
    user_count BIGINT;
BEGIN
    interval_text := days_back || ' days';
    
    -- Obtener total de usuarios en el período
    EXECUTE 'SELECT COUNT(*) FROM user_profiles WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''' INTO user_count;
    
    RETURN QUERY
    EXECUTE 'WITH user_activities AS (
        SELECT 
            up.id as user_id,
            COALESCE(s.story_count, 0) as stories_count,
            COALESCE(v.vote_count, 0) as votes_given, 
            COALESCE(c.comment_count, 0) as comments_given
        FROM user_profiles up
        LEFT JOIN (
            SELECT user_id, COUNT(*) as story_count
            FROM stories 
            WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''
            GROUP BY user_id
        ) s ON s.user_id = up.id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as vote_count  
            FROM votes
            WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''
            GROUP BY user_id
        ) v ON v.user_id = up.id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as comment_count
            FROM comments 
            WHERE created_at >= NOW() - INTERVAL ''' || interval_text || '''
            GROUP BY user_id  
        ) c ON c.user_id = up.id
        WHERE up.created_at >= NOW() - INTERVAL ''' || interval_text || '''
    )
    SELECT 
        ' || user_count || '::BIGINT as total_users,
        (SELECT COUNT(*) FROM user_activities WHERE stories_count > 0)::BIGINT as active_creators,
        (SELECT COUNT(*) FROM user_activities WHERE votes_given > 0)::BIGINT as active_voters,
        (SELECT COUNT(*) FROM user_activities WHERE comments_given > 0)::BIGINT as active_commenters,
        (SELECT COUNT(*) FROM user_activities WHERE stories_count > 0 AND votes_given > 0 AND comments_given > 0)::BIGINT as super_active_users,
        
        CASE WHEN ' || user_count || ' > 0 
        THEN ((SELECT COUNT(*) FROM user_activities WHERE stories_count > 0)::NUMERIC / ' || user_count || ' * 100)
        ELSE 0 END as creator_rate,
        
        CASE WHEN ' || user_count || ' > 0
        THEN ((SELECT COUNT(*) FROM user_activities WHERE votes_given > 0)::NUMERIC / ' || user_count || ' * 100)  
        ELSE 0 END as voter_rate,
        
        CASE WHEN ' || user_count || ' > 0
        THEN ((SELECT COUNT(*) FROM user_activities WHERE comments_given > 0)::NUMERIC / ' || user_count || ' * 100)
        ELSE 0 END as commenter_rate,
        
        CASE WHEN ' || user_count || ' > 0
        THEN ((SELECT COUNT(*) FROM user_activities WHERE stories_count > 0 AND votes_given > 0 AND comments_given > 0)::NUMERIC / ' || user_count || ' * 100)
        ELSE 0 END as super_active_rate';
END;
$$;