CREATE OR REPLACE FUNCTION public.find_companies_by_cores(p_cores cor_grupo[])
 RETURNS TABLE(id uuid, title text, cnpj character varying, cores_marca cor_grupo[], cores_match cor_grupo[], status company_status)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT 
        c.id, 
        c.title, 
        c.cnpj, 
        c.cores_marca, 
        -- Retorna apenas as cores que deram match
        ARRAY(
            SELECT unnest(c.cores_marca) 
            INTERSECT 
            SELECT unnest(p_cores)
        )::cor_grupo[] AS cores_match,
        c.status
    FROM companies c
    WHERE c.cores_marca && p_cores
      AND c.deleted_at IS NULL
    ORDER BY c.title;
$function$
