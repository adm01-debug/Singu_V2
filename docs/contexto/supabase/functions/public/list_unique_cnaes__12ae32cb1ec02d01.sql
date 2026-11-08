CREATE OR REPLACE FUNCTION public.list_unique_cnaes()
 RETURNS TABLE(cnae text, total bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.cnae,
    COUNT(*) as total
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND c.cnae IS NOT NULL AND c.cnae != ''
  GROUP BY c.cnae
  ORDER BY COUNT(*) DESC;
END;
$function$
