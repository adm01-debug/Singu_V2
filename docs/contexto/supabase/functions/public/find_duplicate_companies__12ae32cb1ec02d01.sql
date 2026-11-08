CREATE OR REPLACE FUNCTION public.find_duplicate_companies()
 RETURNS TABLE(cnpj text, cnt bigint, ids uuid[])
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT cnpj, COUNT(*), ARRAY_AGG(id) FROM companies WHERE deleted_at IS NULL AND cnpj IS NOT NULL AND cnpj != ''
  GROUP BY cnpj HAVING COUNT(*) > 1 ORDER BY 2 DESC;
$function$
