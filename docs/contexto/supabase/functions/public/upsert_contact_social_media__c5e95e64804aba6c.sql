CREATE OR REPLACE FUNCTION public.upsert_contact_social_media(p_contact_id uuid, p_plataforma social_media_platform, p_handle character varying DEFAULT NULL::character varying, p_url character varying DEFAULT NULL::character varying, p_nome_perfil character varying DEFAULT NULL::character varying, p_is_verified boolean DEFAULT false, p_observacoes text DEFAULT NULL::text, p_updated_by uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id UUID;
BEGIN
    INSERT INTO contact_social_media (contact_id, plataforma, handle, url, nome_perfil, is_verified, observacoes, created_by, updated_by)
    VALUES (p_contact_id, p_plataforma, p_handle, p_url, p_nome_perfil, p_is_verified, p_observacoes, p_updated_by, p_updated_by)
    ON CONFLICT (contact_id, plataforma) DO UPDATE SET
        handle = COALESCE(EXCLUDED.handle, contact_social_media.handle),
        url = COALESCE(EXCLUDED.url, contact_social_media.url),
        nome_perfil = COALESCE(EXCLUDED.nome_perfil, contact_social_media.nome_perfil),
        is_verified = EXCLUDED.is_verified, is_active = TRUE,
        observacoes = COALESCE(EXCLUDED.observacoes, contact_social_media.observacoes),
        updated_by = p_updated_by, updated_at = NOW()
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$function$
