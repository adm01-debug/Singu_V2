CREATE OR REPLACE FUNCTION public.get_contact_social_media(p_contact_id uuid)
 RETURNS TABLE(plataforma social_media_platform, handle character varying, url character varying, nome_perfil character varying, is_verified boolean, is_active boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY SELECT csm.plataforma, csm.handle, csm.url, csm.nome_perfil, csm.is_verified, csm.is_active
    FROM contact_social_media csm WHERE csm.contact_id = p_contact_id ORDER BY csm.plataforma;
END;
$function$
