CREATE OR REPLACE FUNCTION public.find_potential_groups()
 RETURNS TABLE(cnpj_base text, companies_count bigint, company_names text[])
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT cnpj_base, COUNT(*), ARRAY_AGG(COALESCE(nome_fantasia, nome_crm))
  FROM companies WHERE cnpj_base IS NOT NULL AND deleted_at IS NULL AND grupo_economico_id IS NULL
  GROUP BY cnpj_base HAVING COUNT(*) > 1
  ORDER BY 2 DESC;
$function$
