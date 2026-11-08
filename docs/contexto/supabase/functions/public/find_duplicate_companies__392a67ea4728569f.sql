CREATE OR REPLACE FUNCTION public.find_duplicate_companies(p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'duplicates_by_cnpj', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          cnpj,
          COUNT(*) as count,
          array_agg(id) as ids,
          array_agg(nome_crm) as names
        FROM companies
        WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL
        GROUP BY cnpj
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT p_limit
      ) t
    ),
    'duplicates_by_razao', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          LOWER(TRIM(razao_social)) as razao_social_clean,
          COUNT(*) as count,
          array_agg(id) as ids
        FROM companies
        WHERE razao_social IS NOT NULL AND razao_social != '' AND deleted_at IS NULL
        GROUP BY LOWER(TRIM(razao_social))
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT p_limit
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
