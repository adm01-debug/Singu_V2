CREATE OR REPLACE FUNCTION public.get_sales_funnel()
 RETURNS TABLE(stage text, stage_order integer, count bigint, value numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH stages AS (
    SELECT unnest(ARRAY['novo', 'contatado', 'qualificando', 'qualificado', 'negociacao', 'proposta', 'fechamento', 'cliente', 'perdido']) as stage_name,
           generate_series(1, 9) as stage_order
  )
  SELECT 
    s.stage_name::text as stage,
    s.stage_order::int,
    COALESCE(COUNT(c.id), 0)::bigint as count,
    COALESCE(SUM(d.valor), 0)::numeric as value
  FROM stages s
  LEFT JOIN companies c ON c.lead_status = s.stage_name AND c.deleted_at IS NULL
  LEFT JOIN deals d ON d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido')
  GROUP BY s.stage_name, s.stage_order
  ORDER BY s.stage_order;
END;
$function$
