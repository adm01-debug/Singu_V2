CREATE OR REPLACE FUNCTION public.deactivate_social_media(p_entity_type character varying, p_entity_id uuid, p_plataforma social_media_platform)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF p_entity_type = 'company' THEN
        UPDATE company_social_media SET is_active = FALSE, updated_at = NOW()
        WHERE company_id = p_entity_id AND plataforma = p_plataforma;
    ELSIF p_entity_type = 'contact' THEN
        UPDATE contact_social_media SET is_active = FALSE, updated_at = NOW()
        WHERE contact_id = p_entity_id AND plataforma = p_plataforma;
    ELSE
        RAISE EXCEPTION 'entity_type inválido: %', p_entity_type;
    END IF;
    RETURN FOUND;
END;
$function$
