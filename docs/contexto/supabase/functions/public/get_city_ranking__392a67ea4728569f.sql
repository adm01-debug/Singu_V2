CREATE OR REPLACE FUNCTION public.get_city_ranking(p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'ranking', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(cidade, 'N/I') as cidade,
          uf,
          COUNT(*) as total,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor_total
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY cidade, uf
        ORDER BY COUNT(*) DESC
        LIMIT p_limit
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
