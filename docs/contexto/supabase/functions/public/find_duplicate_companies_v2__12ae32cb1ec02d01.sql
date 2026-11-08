CREATE OR REPLACE FUNCTION public.find_duplicate_companies_v2()
 RETURNS TABLE(cnpj text, count bigint, company_ids uuid[])
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.cnpj::text, COUNT(*)::bigint, ARRAY_AGG(c.id)
  FROM companies c
  WHERE c.deleted_at IS NULL AND c.cnpj IS NOT NULL AND c.cnpj != ''
  GROUP BY c.cnpj
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$function$
