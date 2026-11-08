CREATE OR REPLACE FUNCTION public.get_pipeline_stats(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  WITH stage_counts AS (
    SELECT 
      ps.id as stage_id,
      ps.name as stage_name,
      ps.sort_order,
      COUNT(c.id) as total_customers,
      SUM(COALESCE(c.valor_total_compras, 0)) as total_valor
    FROM pipeline_stages ps
    LEFT JOIN customers c ON c.pipeline_stage_id = ps.id AND c.deleted_at IS NULL
      AND (p_vendedor_id IS NULL OR c.vendedor_id = p_vendedor_id)
    GROUP BY ps.id, ps.name, ps.sort_order
    ORDER BY ps.sort_order
  )
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'timestamp', now(),
    'stages', (SELECT jsonb_agg(row_to_json(sc)) FROM stage_counts sc),
    'totals', jsonb_build_object(
      'total_customers', (SELECT SUM(total_customers) FROM stage_counts),
      'total_valor', (SELECT SUM(total_valor) FROM stage_counts)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
