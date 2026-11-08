CREATE OR REPLACE FUNCTION public.find_companies_by_cor(p_cor cor_grupo)
 RETURNS TABLE(id uuid, title text, cnpj character varying, cores_marca cor_grupo[], status company_status)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT c.id, c.title, c.cnpj, c.cores_marca, c.status
    FROM companies c
    WHERE ARRAY[p_cor] <@ c.cores_marca
      AND c.deleted_at IS NULL
    ORDER BY c.title;
$function$
