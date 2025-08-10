-- Actualización de permisos premium para incluir bio, location, website
-- Ejecutar en Supabase SQL Editor después de la migración principal

-- 1. Actualizar la función get_user_limits para incluir las nuevas funciones premium
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

-- 2. Función helper para verificar permisos específicos de perfil
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

-- 3. Política de seguridad para actualización de perfil (RLS)
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

-- 4. Aplicar trigger de validación premium
DROP TRIGGER IF EXISTS tr_check_premium_profile ON public.user_profiles;
CREATE TRIGGER tr_check_premium_profile
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_premium_profile_update();

-- 5. Función para limpiar datos premium de usuarios que downgradearon
CREATE OR REPLACE FUNCTION cleanup_downgraded_profile(user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_limits JSONB;
BEGIN
    user_limits := get_user_limits(user_id);
    
    -- Si ya no es premium, limpiar campos premium
    IF NOT (user_limits->>'can_edit_bio')::boolean THEN
        UPDATE public.user_profiles 
        SET bio = NULL,
            location = NULL,
            website = NULL,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Función helper para obtener perfil con permisos
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

-- 7. Comentarios actualizados
COMMENT ON FUNCTION get_user_limits(UUID) IS 'Obtiene límites y permisos del usuario según su plan';
COMMENT ON FUNCTION can_edit_profile_field(UUID, TEXT) IS 'Verifica si usuario puede editar campo específico del perfil';
COMMENT ON FUNCTION cleanup_downgraded_profile(UUID) IS 'Limpia campos premium de usuarios que perdieron acceso premium';
COMMENT ON FUNCTION get_user_profile_with_permissions(UUID) IS 'Obtiene perfil del usuario con solo los campos que puede ver/editar';

-- 8. Índices adicionales si son necesarios
CREATE INDEX IF NOT EXISTS idx_user_profiles_bio_not_null 
ON public.user_profiles (bio) 
WHERE bio IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_website_not_null 
ON public.user_profiles (website) 
WHERE website IS NOT NULL;