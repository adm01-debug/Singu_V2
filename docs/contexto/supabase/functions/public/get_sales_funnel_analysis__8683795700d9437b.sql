CREATE OR REPLACE FUNCTION public.get_sales_funnel_analysis(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(stage text, deals_count bigint, total_value numeric, avg_days_in_stage numeric, conversion_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH stage_data AS (
    SELECT d.pipeline_stage, COUNT(*) as cnt, SUM(d.valor) as total,
      AVG(EXTRACT(EPOCH FROM (NOW() - d.created_at))/86400) as avg_days
    FROM deals d
    WHERE (p_user_id IS NULL OR d.user_id = p_user_id) AND d.created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY d.pipeline_stage
  ),
  total_deals AS (SELECT SUM(cnt) as total FROM stage_data)
  SELECT sd.pipeline_stage, sd.cnt, COALESCE(sd.total, 0), ROUND(sd.avg_days::numeric, 1),
    ROUND((sd.cnt::numeric / NULLIF((SELECT total FROM total_deals), 0) * 100), 1)
  FROM stage_data sd ORDER BY sd.cnt DESC;
$function$
