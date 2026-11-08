CREATE OR REPLACE FUNCTION public.get_opportunities_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_identified', (SELECT COUNT(*) FROM sales_opportunities WHERE status = 'identified'),
    'total_pursuing', (SELECT COUNT(*) FROM sales_opportunities WHERE status = 'pursuing'),
    'total_value_pipeline', (
      SELECT COALESCE(SUM(estimated_value), 0) 
      FROM sales_opportunities 
      WHERE status IN ('identified', 'qualified', 'pursuing')
    ),
    'by_type', (
      SELECT COALESCE(jsonb_agg(t), '[]')
      FROM (
        SELECT opportunity_type, COUNT(*) as count, SUM(estimated_value) as value
        FROM sales_opportunities
        WHERE status IN ('identified', 'qualified', 'pursuing')
        GROUP BY opportunity_type
      ) t
    ),
    'by_priority', (
      SELECT COALESCE(jsonb_agg(p), '[]')
      FROM (
        SELECT priority, COUNT(*) as count
        FROM sales_opportunities
        WHERE status IN ('identified', 'qualified', 'pursuing')
        GROUP BY priority
      ) p
    ),
    'won_this_month', (
      SELECT COUNT(*) FROM sales_opportunities 
      WHERE status = 'won' 
        AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'won_value_this_month', (
      SELECT COALESCE(SUM(estimated_value), 0) 
      FROM sales_opportunities 
      WHERE status = 'won' 
        AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)
    )
  );
END;
$function$
