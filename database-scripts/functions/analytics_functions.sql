-- Funciones SQL para Analytics Dashboard
-- Estas funciones optimizan las consultas para el dashboard de administración

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
BEGIN
    RETURN QUERY
    SELECT 
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
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY user_id
    ) s ON s.user_id = up.id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as vote_count
        FROM votes 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY user_id
    ) v ON v.user_id = up.id  
    LEFT JOIN (
        SELECT user_id, COUNT(*) as comment_count
        FROM comments 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY user_id
    ) c ON c.user_id = up.id
    WHERE up.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND (
        COALESCE(s.story_count, 0) * 10 + 
        COALESCE(v.vote_count, 0) * 2 + 
        COALESCE(c.comment_count, 0) * 3
    ) >= 50
    AND COALESCE(s.story_count, 0) >= 2
    ORDER BY engagement_score DESC;
END;
$$;

-- Función para métricas de engagement por concurso
CREATE OR REPLACE FUNCTION get_contest_engagement_metrics(contest_id UUID)
RETURNS TABLE (
    total_stories BIGINT,
    unique_participants BIGINT,
    unique_voters BIGINT,
    unique_commenters BIGINT,
    super_users BIGINT,
    total_votes BIGINT,
    total_comments BIGINT,
    total_likes INTEGER,
    total_views INTEGER,
    total_words INTEGER,
    avg_likes_per_story NUMERIC,
    avg_words_per_story NUMERIC,
    participation_rate NUMERIC,
    comment_rate NUMERIC,
    super_user_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    contest_stories UUID[];
    participant_count BIGINT;
BEGIN
    -- Obtener todas las historias del concurso
    SELECT ARRAY_AGG(id) INTO contest_stories
    FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id;
    
    -- Contar participantes únicos
    SELECT COUNT(DISTINCT user_id) INTO participant_count
    FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id;
    
    RETURN QUERY
    SELECT 
        -- Métricas básicas
        (SELECT COUNT(*) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id)::BIGINT as total_stories,
        participant_count as unique_participants,
        (SELECT COUNT(DISTINCT user_id) FROM votes WHERE story_id = ANY(contest_stories))::BIGINT as unique_voters,
        (SELECT COUNT(DISTINCT user_id) FROM comments WHERE story_id = ANY(contest_stories))::BIGINT as unique_commenters,
        
        -- Super usuarios (participan AND votan AND comentan)
        (SELECT COUNT(*)
         FROM (
            SELECT user_id FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id
            INTERSECT
            SELECT user_id FROM votes WHERE story_id = ANY(contest_stories)  
            INTERSECT
            SELECT user_id FROM comments WHERE story_id = ANY(contest_stories)
         ) super_users_subquery
        )::BIGINT as super_users,
        
        (SELECT COUNT(*) FROM votes WHERE story_id = ANY(contest_stories))::BIGINT as total_votes,
        (SELECT COUNT(*) FROM comments WHERE story_id = ANY(contest_stories))::BIGINT as total_comments,
        (SELECT SUM(likes_count) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id)::INTEGER as total_likes,
        (SELECT SUM(views_count) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id)::INTEGER as total_views,
        (SELECT SUM(word_count) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id)::INTEGER as total_words,
        
        -- Promedios
        CASE WHEN (SELECT COUNT(*) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id) > 0 
        THEN (SELECT AVG(likes_count) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id)
        ELSE 0 END as avg_likes_per_story,
        
        CASE WHEN (SELECT COUNT(*) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id) > 0
        THEN (SELECT AVG(word_count) FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id)  
        ELSE 0 END as avg_words_per_story,
        
        -- Tasas de engagement
        CASE WHEN participant_count > 0 
        THEN ((SELECT COUNT(DISTINCT user_id) FROM votes WHERE story_id = ANY(contest_stories))::NUMERIC / participant_count * 100)
        ELSE 0 END as participation_rate,
        
        CASE WHEN participant_count > 0
        THEN ((SELECT COUNT(DISTINCT user_id) FROM comments WHERE story_id = ANY(contest_stories))::NUMERIC / participant_count * 100) 
        ELSE 0 END as comment_rate,
        
        CASE WHEN participant_count > 0
        THEN ((SELECT COUNT(*) FROM (
            SELECT user_id FROM stories WHERE stories.contest_id = get_contest_engagement_metrics.contest_id
            INTERSECT 
            SELECT user_id FROM votes WHERE story_id = ANY(contest_stories)
            INTERSECT
            SELECT user_id FROM comments WHERE story_id = ANY(contest_stories)
        ) super_users_subquery)::NUMERIC / participant_count * 100)
        ELSE 0 END as super_user_rate;
END;
$$;

-- Función para obtener métricas globales de engagement
CREATE OR REPLACE FUNCTION get_global_engagement_metrics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_users BIGINT,
    active_creators BIGINT,
    active_voters BIGINT, 
    active_commenters BIGINT,
    super_active_users BIGINT,
    creator_rate NUMERIC,
    voter_rate NUMERIC,
    commenter_rate NUMERIC,
    super_active_rate NUMERIC,
    average_engagement_score NUMERIC
)
LANGUAGE plpgsql  
AS $$
DECLARE
    user_count BIGINT;
BEGIN
    -- Obtener total de usuarios en el período
    SELECT COUNT(*) INTO user_count
    FROM user_profiles 
    WHERE created_at >= NOW() - INTERVAL '%s days';
    
    RETURN QUERY
    WITH user_activities AS (
        SELECT 
            up.id as user_id,
            COALESCE(s.story_count, 0) as stories_count,
            COALESCE(v.vote_count, 0) as votes_given, 
            COALESCE(c.comment_count, 0) as comments_given,
            (
                COALESCE(s.story_count, 0) * 10 + 
                COALESCE(v.vote_count, 0) * 2 + 
                COALESCE(c.comment_count, 0) * 3
            ) as engagement_score
        FROM user_profiles up
        LEFT JOIN (
            SELECT user_id, COUNT(*) as story_count
            FROM stories 
            WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
            GROUP BY user_id
        ) s ON s.user_id = up.id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as vote_count  
            FROM votes
            WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
            GROUP BY user_id
        ) v ON v.user_id = up.id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as comment_count
            FROM comments 
            WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
            GROUP BY user_id  
        ) c ON c.user_id = up.id
        WHERE up.created_at >= NOW() - (days_back || ' days')::INTERVAL
    )
    SELECT 
        user_count as total_users,
        (SELECT COUNT(*) FROM user_activities WHERE stories_count > 0)::BIGINT as active_creators,
        (SELECT COUNT(*) FROM user_activities WHERE votes_given > 0)::BIGINT as active_voters,
        (SELECT COUNT(*) FROM user_activities WHERE comments_given > 0)::BIGINT as active_commenters,
        (SELECT COUNT(*) FROM user_activities WHERE stories_count > 0 AND votes_given > 0 AND comments_given > 0)::BIGINT as super_active_users,
        
        -- Tasas de engagement
        CASE WHEN user_count > 0 
        THEN ((SELECT COUNT(*) FROM user_activities WHERE stories_count > 0)::NUMERIC / user_count * 100)
        ELSE 0 END as creator_rate,
        
        CASE WHEN user_count > 0
        THEN ((SELECT COUNT(*) FROM user_activities WHERE votes_given > 0)::NUMERIC / user_count * 100)  
        ELSE 0 END as voter_rate,
        
        CASE WHEN user_count > 0
        THEN ((SELECT COUNT(*) FROM user_activities WHERE comments_given > 0)::NUMERIC / user_count * 100)
        ELSE 0 END as commenter_rate,
        
        CASE WHEN user_count > 0
        THEN ((SELECT COUNT(*) FROM user_activities WHERE stories_count > 0 AND votes_given > 0 AND comments_given > 0)::NUMERIC / user_count * 100)
        ELSE 0 END as super_active_rate,
        
        (SELECT AVG(engagement_score) FROM user_activities)::NUMERIC as average_engagement_score;
END;
$$;

-- Función para obtener top usuarios por engagement
CREATE OR REPLACE FUNCTION get_top_engagement_users(days_back INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    engagement_score INTEGER,
    stories_count BIGINT,
    votes_given BIGINT,
    comments_given BIGINT,
    likes_received INTEGER,
    views_received INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as user_id,
        up.display_name,
        (
            COALESCE(s.story_count, 0) * 10 + 
            COALESCE(v.vote_count, 0) * 2 + 
            COALESCE(c.comment_count, 0) * 3
        )::INTEGER as engagement_score,
        COALESCE(s.story_count, 0) as stories_count,
        COALESCE(v.vote_count, 0) as votes_given,
        COALESCE(c.comment_count, 0) as comments_given,
        COALESCE(s.total_likes, 0) as likes_received,
        COALESCE(s.total_views, 0) as views_received
    FROM user_profiles up
    LEFT JOIN (
        SELECT 
            user_id, 
            COUNT(*) as story_count,
            SUM(likes_count) as total_likes,
            SUM(views_count) as total_views
        FROM stories 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY user_id
    ) s ON s.user_id = up.id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as vote_count
        FROM votes 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY user_id
    ) v ON v.user_id = up.id  
    LEFT JOIN (
        SELECT user_id, COUNT(*) as comment_count
        FROM comments 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY user_id
    ) c ON c.user_id = up.id
    WHERE up.created_at >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY engagement_score DESC
    LIMIT limit_count;
END;
$$;

-- Crear índices para optimizar rendimiento
CREATE INDEX IF NOT EXISTS idx_stories_contest_created ON stories(contest_id, created_at);
CREATE INDEX IF NOT EXISTS idx_votes_story_created ON votes(story_id, created_at);  
CREATE INDEX IF NOT EXISTS idx_comments_story_created ON comments(story_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created ON user_profiles(created_at);

-- Función para limpiar y actualizar estadísticas cached
CREATE OR REPLACE FUNCTION refresh_analytics_cache()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar cache de rankings si existe
    DELETE FROM cached_rankings WHERE created_at < NOW() - INTERVAL '1 hour';
    
    -- Aquí podrían agregarse otras limpiezas de cache según sea necesario
    
    RETURN 'Analytics cache refreshed successfully';
END;
$$;