CREATE OR REPLACE FUNCTION public.get_analysis_by_segment()
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
    'top_20_segmentos', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(SUBSTRING(c.cnae_principal FROM 1 FOR 2), 'N/I') as cnae_grupo,
          COUNT(DISTINCT c.id) as total,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.ja_comprou = true) as compradores,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor_total
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY SUBSTRING(c.cnae_principal FROM 1 FOR 2)
        ORDER BY COUNT(DISTINCT c.id) DESC
        LIMIT 20
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
