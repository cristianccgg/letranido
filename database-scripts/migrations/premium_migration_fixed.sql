-- Migración Premium - VERSIÓN CORREGIDA
-- Solo 2 planes: básico y premium (escritor pro)
-- Feedback profesional: incluido en premium, pay-per-use para básicos

-- 1. Primero crear el ENUM de tipos de planes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_types') THEN
        CREATE TYPE plan_types AS ENUM ('basic', 'premium');
    END IF;
END $$;

-- 2. Agregar nuevas columnas para sistema premium (usando el ENUM)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS plan_type plan_types DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS subscription_id TEXT NULL,
ADD COLUMN IF NOT EXISTS payment_method TEXT NULL,
ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{}';

-- 3. Migrar datos existentes - IMPORTANTE: mantener compatibilidad
UPDATE public.user_profiles 
SET plan_type = CASE 
    WHEN is_pro = true THEN 'premium'::plan_types 
    ELSE 'basic'::plan_types 
END
WHERE plan_type = 'basic'::plan_types;

-- 4. Función helper para verificar si plan está activo
CREATE OR REPLACE FUNCTION is_premium_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan RECORD;
BEGIN
    SELECT plan_type, plan_expires_at, is_pro
    FROM public.user_profiles 
    WHERE id = user_id
    INTO user_plan;
    
    -- Si no existe el usuario
    IF user_plan IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Compatibilidad: si is_pro = true, siempre premium
    IF user_plan.is_pro = true THEN
        RETURN TRUE;
    END IF;
    
    -- Si plan básico, no premium
    IF user_plan.plan_type = 'basic' THEN
        RETURN FALSE;
    END IF;
    
    -- Si no tiene fecha de expiración, es permanente
    IF user_plan.plan_expires_at IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar si no ha expirado
    RETURN user_plan.plan_expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Función helper para obtener límites por plan (VERSIÓN FINAL ACTUALIZADA)
CREATE OR REPLACE FUNCTION get_user_limits(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_plan RECORD;
    limits JSONB;
BEGIN
    SELECT plan_type, is_pro
    FROM public.user_profiles 
    WHERE id = user_id
    INTO user_plan;
    
    -- Valores por defecto (plan básico)
    limits := '{
        "max_words": 1000,
        "contests_per_month": 1,
        "can_use_portfolio": false,
        "has_premium_feedback": false,
        "can_buy_feedback": true,
        "can_edit_bio": false,
        "can_set_location": false,
        "can_add_website": false,
        "profile_features": "basic"
    }'::jsonb;
    
    -- Si es premium (escritor pro)
    IF user_plan.is_pro = true OR user_plan.plan_type = 'premium' THEN
        limits := '{
            "max_words": 3000,
            "contests_per_month": 999,
            "can_use_portfolio": true,
            "has_premium_feedback": true,
            "can_buy_feedback": false,
            "can_edit_bio": true,
            "can_set_location": true,
            "can_add_website": true,
            "profile_features": "premium"
        }'::jsonb;
    END IF;
    
    RETURN limits;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_type 
ON public.user_profiles (plan_type);

CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_expires_at 
ON public.user_profiles (plan_expires_at) 
WHERE plan_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_id 
ON public.user_profiles (subscription_id) 
WHERE subscription_id IS NOT NULL;

-- 7. Trigger para mantener is_pro sincronizado (compatibilidad)
CREATE OR REPLACE FUNCTION sync_is_pro()
RETURNS TRIGGER AS $$
BEGIN
    -- Si plan_type cambia a premium, actualizar is_pro
    IF NEW.plan_type = 'premium' THEN
        NEW.is_pro := true;
    ELSIF NEW.plan_type = 'basic' THEN
        -- Solo actualizar is_pro si no fue forzado manualmente
        IF OLD.is_pro = false THEN
            NEW.is_pro := false;
        END IF;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_is_pro ON public.user_profiles;
CREATE TRIGGER tr_sync_is_pro
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_is_pro();

-- 8. Comentarios para documentación
COMMENT ON COLUMN public.user_profiles.plan_type IS 'Tipo de plan actual: basic, premium (escritor pro)';
COMMENT ON COLUMN public.user_profiles.plan_expires_at IS 'Fecha de expiración del plan (NULL = permanente)';
COMMENT ON COLUMN public.user_profiles.subscription_id IS 'ID de suscripción en Stripe/PayU';
COMMENT ON COLUMN public.user_profiles.payment_method IS 'Método de pago usado';
COMMENT ON COLUMN public.user_profiles.premium_features IS 'Configuración específica de funciones premium';

-- 9. Crear tabla para feedback pay-per-use (para usuarios básicos)
CREATE TABLE IF NOT EXISTS public.feedback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    story_title TEXT NOT NULL,
    story_content TEXT NOT NULL,
    payment_id TEXT NULL, -- Stripe payment intent ID
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_amount INTEGER NULL, -- En centavos (249 para $2.49)
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'assigned', 'in_review', 'completed', 'cancelled'
    professional_id UUID NULL, -- ID del profesional asignado
    feedback_text TEXT NULL,
    feedback_rating INTEGER NULL, -- 1-5 estrellas del usuario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla de feedback
CREATE INDEX IF NOT EXISTS idx_feedback_requests_user_id 
ON public.feedback_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_status 
ON public.feedback_requests (status);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_payment_status 
ON public.feedback_requests (payment_status);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_professional_id 
ON public.feedback_requests (professional_id) 
WHERE professional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_requests_created_at 
ON public.feedback_requests (created_at);

-- Trigger para actualizar updated_at en feedback
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_feedback_updated_at ON public.feedback_requests;
CREATE TRIGGER tr_feedback_updated_at
    BEFORE UPDATE ON public.feedback_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Comentarios para la tabla de feedback
COMMENT ON TABLE public.feedback_requests IS 'Solicitudes de feedback profesional pay-per-use';
COMMENT ON COLUMN public.feedback_requests.payment_amount IS 'Monto en centavos (ej: 249 = $2.49)';
COMMENT ON COLUMN public.feedback_requests.status IS 'Estado: pending, paid, assigned, in_review, completed, cancelled';
COMMENT ON COLUMN public.feedback_requests.payment_status IS 'Estado del pago: pending, paid, failed, refunded';

-- ===============================================================================
-- FUNCIONES ADICIONALES PARA MANEJO AVANZADO DE PERMISOS
-- ===============================================================================

-- Función helper para verificar permisos específicos de perfil
CREATE OR REPLACE FUNCTION can_edit_profile_field(user_id UUID, field_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_limits JSONB;
BEGIN
    user_limits := get_user_limits(user_id);
    
    CASE field_name
        WHEN 'bio' THEN
            RETURN (user_limits->>'can_edit_bio')::boolean;
        WHEN 'location' THEN
            RETURN (user_limits->>'can_set_location')::boolean;
        WHEN 'website' THEN
            RETURN (user_limits->>'can_add_website')::boolean;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Política de seguridad para actualización de perfil (RLS)
-- Solo usuarios premium pueden actualizar bio, location, website
CREATE OR REPLACE FUNCTION check_premium_profile_update()
RETURNS TRIGGER AS $$
DECLARE
    user_limits JSONB;
BEGIN
    -- Obtener límites del usuario
    user_limits := get_user_limits(NEW.id);
    
    -- Si intenta cambiar bio pero no es premium
    IF NEW.bio IS DISTINCT FROM OLD.bio AND NEW.bio IS NOT NULL THEN
        IF NOT (user_limits->>'can_edit_bio')::boolean THEN
            RAISE EXCEPTION 'Bio personalizada solo disponible para usuarios premium';
        END IF;
    END IF;
    
    -- Si intenta cambiar location pero no es premium
    IF NEW.location IS DISTINCT FROM OLD.location AND NEW.location IS NOT NULL THEN
        IF NOT (user_limits->>'can_set_location')::boolean THEN
            RAISE EXCEPTION 'Ubicación solo disponible para usuarios premium';
        END IF;
    END IF;
    
    -- Si intenta cambiar website pero no es premium
    IF NEW.website IS DISTINCT FROM OLD.website AND NEW.website IS NOT NULL THEN
        IF NOT (user_limits->>'can_add_website')::boolean THEN
            RAISE EXCEPTION 'Website personal solo disponible para usuarios premium';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de validación premium
DROP TRIGGER IF EXISTS tr_check_premium_profile ON public.user_profiles;
CREATE TRIGGER tr_check_premium_profile
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_premium_profile_update();

-- Función para limpiar datos premium de usuarios que downgradearon (DEGRADACIÓN SUAVE)
-- IMPORTANTE: No borra datos, solo los convierte en solo-lectura
CREATE OR REPLACE FUNCTION cleanup_downgraded_profile(user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_limits JSONB;
BEGIN
    user_limits := get_user_limits(user_id);
    
    -- NOTA: En degradación suave, NO borramos datos
    -- Solo marcamos como read-only o deshabilitamos edición
    -- Los datos se conservan para cuando el usuario vuelva a ser premium
    
    -- Esta función está lista para implementar lógica de degradación
    -- cuando sea necesario
    RAISE NOTICE 'Usuario % degradado. Datos conservados en modo solo-lectura.', user_id;
END;
$$ LANGUAGE plpgsql;

-- Función helper para obtener perfil con permisos
CREATE OR REPLACE FUNCTION get_user_profile_with_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile RECORD;
    limits JSONB;
    result JSONB;
BEGIN
    SELECT * FROM public.user_profiles WHERE id = user_id INTO profile;
    
    IF profile IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;
    
    limits := get_user_limits(user_id);
    
    -- Construir respuesta con datos y permisos
    result := jsonb_build_object(
        'id', profile.id,
        'display_name', profile.display_name,
        'avatar_url', profile.avatar_url,
        'created_at', profile.created_at,
        'stories_count', profile.stories_count,
        'wins_count', profile.wins_count,
        'total_likes', profile.total_likes,
        'is_pro', profile.is_pro,
        'plan_type', profile.plan_type
    );
    
    -- Solo incluir campos premium si tiene permisos
    IF (limits->>'can_edit_bio')::boolean THEN
        result := result || jsonb_build_object('bio', profile.bio);
    END IF;
    
    IF (limits->>'can_set_location')::boolean THEN
        result := result || jsonb_build_object('location', profile.location);
    END IF;
    
    IF (limits->>'can_add_website')::boolean THEN
        result := result || jsonb_build_object('website', profile.website);
    END IF;
    
    -- Agregar información de permisos
    result := result || jsonb_build_object('permissions', limits);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comentarios actualizados para las nuevas funciones
COMMENT ON FUNCTION get_user_limits(UUID) IS 'Obtiene límites y permisos del usuario según su plan - INCLUYE PERMISOS DE PERFIL';
COMMENT ON FUNCTION can_edit_profile_field(UUID, TEXT) IS 'Verifica si usuario puede editar campo específico del perfil';
COMMENT ON FUNCTION cleanup_downgraded_profile(UUID) IS 'Degradación suave: conserva datos pero desactiva edición';
COMMENT ON FUNCTION get_user_profile_with_permissions(UUID) IS 'Obtiene perfil del usuario con solo los campos que puede ver/editar';

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_user_profiles_bio_not_null 
ON public.user_profiles (bio) 
WHERE bio IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_website_not_null 
ON public.user_profiles (website) 
WHERE website IS NOT NULL;