CREATE OR REPLACE FUNCTION public.get_all_tags_in_use()
 RETURNS TABLE(tag text, company_count bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT UNNEST(tags_array) as tag, COUNT(*) as company_count
  FROM companies
  WHERE tags_array IS NOT NULL AND array_length(tags_array, 1) > 0
  GROUP BY 1
  ORDER BY 2 DESC;
END;
$function$
