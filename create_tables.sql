-- Script para recrear todas las tablas en Supabase Local
-- Basado en la estructura de producción

-- Crear tipos personalizados primero
CREATE TYPE plan_types AS ENUM ('basic', 'premium', 'pro');

-- Tabla admin_contest_stats
CREATE TABLE admin_contest_stats (
    id UUID,
    title TEXT,
    month TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    finalized_at TIMESTAMPTZ,
    total_stories BIGINT,
    unique_participants BIGINT,
    total_likes BIGINT,
    avg_likes_per_story NUMERIC,
    max_likes INTEGER
);

-- Tabla badge_definitions
CREATE TABLE badge_definitions (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    icon VARCHAR,
    color VARCHAR DEFAULT '#6366f1',
    tier INTEGER DEFAULT 1,
    criteria JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla cached_rankings
CREATE TABLE cached_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT NOT NULL,
    total_karma INTEGER NOT NULL DEFAULT 0,
    total_stories INTEGER NOT NULL DEFAULT 0,
    votes_given INTEGER NOT NULL DEFAULT 0,
    comments_given INTEGER NOT NULL DEFAULT 0,
    comments_received INTEGER NOT NULL DEFAULT 0,
    contest_wins INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla contests
CREATE TABLE contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'submission',
    submission_deadline TIMESTAMPTZ NOT NULL,
    voting_deadline TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL DEFAULT 'Ficción',
    month TEXT NOT NULL,
    prize TEXT DEFAULT 'Insignia de Oro + Destacado del mes',
    participants_count INTEGER DEFAULT 0,
    min_words INTEGER DEFAULT 100,
    max_words INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ
);

-- Tabla user_profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    display_name TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    avatar_url TEXT,
    stories_count INTEGER DEFAULT 0,
    wins_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    rank_position INTEGER DEFAULT 0,
    email_notifications BOOLEAN DEFAULT TRUE,
    is_pro BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{"theme": "light", "language": "es"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_founder BOOLEAN DEFAULT FALSE,
    founded_at TIMESTAMPTZ,
    is_admin BOOLEAN DEFAULT FALSE,
    last_badge_check TIMESTAMPTZ,
    email TEXT,
    contest_notifications BOOLEAN DEFAULT TRUE,
    general_notifications BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT TRUE,
    newsletter_contests BOOLEAN DEFAULT TRUE,
    terms_accepted_at TIMESTAMPTZ,
    plan_type plan_types DEFAULT 'basic',
    plan_expires_at TIMESTAMPTZ,
    subscription_id TEXT,
    payment_method TEXT,
    premium_features JSONB DEFAULT '{}'
);

-- Tabla stories
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    word_count INTEGER NOT NULL,
    read_time TEXT,
    user_id UUID REFERENCES user_profiles(id),
    contest_id UUID REFERENCES contests(id),
    is_mature BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_winner BOOLEAN DEFAULT FALSE,
    winner_position INTEGER,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    story_id UUID REFERENCES stories(id),
    parent_id UUID REFERENCES comments(id),
    likes_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    story_id UUID REFERENCES stories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla maintenance_mode
CREATE TABLE maintenance_mode (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_active BOOLEAN DEFAULT FALSE,
    message TEXT DEFAULT 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.',
    estimated_duration TEXT DEFAULT '10 minutos',
    activated_at TIMESTAMPTZ,
    activated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla email_subscribers
CREATE TABLE email_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    user_id UUID REFERENCES user_profiles(id),
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    email_preferences JSONB DEFAULT '{"tips": true, "weekly": true, "winners": true, "contests": true}',
    source TEXT DEFAULT 'landing',
    unsubscribe_token TEXT DEFAULT gen_random_uuid()::TEXT,
    last_email_sent TIMESTAMPTZ,
    total_emails_sent INTEGER DEFAULT 0,
    total_emails_opened INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla user_badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    badge_id VARCHAR REFERENCES badge_definitions(id),
    earned_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Otras tablas adicionales
CREATE TABLE popular_stories AS SELECT * FROM stories WHERE FALSE;
CREATE TABLE user_stats AS SELECT * FROM user_profiles WHERE FALSE;
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'landing_page',
    unsubscribe_token TEXT DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    contest_id UUID REFERENCES contests(id),
    external_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type TEXT NOT NULL,
    contest_id UUID REFERENCES contests(id),
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES user_profiles(id),
    reported_comment_id UUID NOT NULL REFERENCES comments(id),
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', NOW()),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE feedback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    story_title TEXT NOT NULL,
    story_content TEXT NOT NULL,
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_amount INTEGER,
    status TEXT DEFAULT 'pending',
    professional_id UUID REFERENCES user_profiles(id),
    feedback_text TEXT,
    feedback_rating INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submission_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    story_id UUID REFERENCES stories(id),
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    original_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    no_ai_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    share_winner_content_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    mature_content_marked BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ranking_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_updated TIMESTAMP DEFAULT NOW(),
    total_users INTEGER DEFAULT 0,
    contest_period TEXT,
    updated_by_admin BOOLEAN DEFAULT TRUE
);

-- Insertar datos básicos
INSERT INTO maintenance_mode (id, is_active) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

-- Función para obtener estado de mantenimiento
CREATE OR REPLACE FUNCTION get_maintenance_status()
RETURNS TABLE(is_active BOOLEAN, message TEXT, estimated_duration TEXT, activated_at TIMESTAMPTZ)
LANGUAGE sql
AS $$
    SELECT m.is_active, m.message, m.estimated_duration, m.activated_at 
    FROM maintenance_mode m 
    WHERE m.id = 1;
$$;