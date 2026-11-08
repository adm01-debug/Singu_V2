CREATE OR REPLACE FUNCTION public.detect_cnpj_duplicates()
 RETURNS TABLE(cnpj text, count bigint, company_ids uuid[])
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.cnpj::text,
    COUNT(*)::bigint,
    array_agg(c.id) as company_ids
  FROM companies c
  WHERE c.cnpj IS NOT NULL 
    AND c.deleted_at IS NULL
    AND LENGTH(REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g')) = 14
  GROUP BY c.cnpj
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC
  LIMIT 100;
END;
$function$
