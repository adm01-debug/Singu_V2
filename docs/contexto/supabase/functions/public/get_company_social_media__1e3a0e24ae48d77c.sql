CREATE OR REPLACE FUNCTION public.get_company_social_media(p_company_id uuid)
 RETURNS TABLE(plataforma social_media_platform, handle character varying, url character varying, nome_perfil character varying, is_verified boolean, is_active boolean, seguidores integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY SELECT csm.plataforma, csm.handle, csm.url, csm.nome_perfil, csm.is_verified, csm.is_active, csm.seguidores
    FROM company_social_media csm WHERE csm.company_id = p_company_id ORDER BY csm.plataforma;
END;
$function$
