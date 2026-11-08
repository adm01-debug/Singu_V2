CREATE OR REPLACE FUNCTION public.get_cores_marca(p_company_id uuid)
 RETURNS cor_grupo[]
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT cores_marca 
    FROM companies 
    WHERE id = p_company_id 
      AND cores_marca IS NOT NULL;
$function$
