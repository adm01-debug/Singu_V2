CREATE OR REPLACE FUNCTION public.get_competitive_analysis(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_losses', (
      SELECT COUNT(*) FROM competitive_losses 
      WHERE created_at >= CURRENT_DATE - p_days
    ),
    'total_value_lost', (
      SELECT COALESCE(SUM(d.valor), 0) 
      FROM competitive_losses cl
      JOIN deals d ON d.id = cl.deal_id
      WHERE cl.created_at >= CURRENT_DATE - p_days
    ),
    'by_competitor', (
      SELECT COALESCE(jsonb_agg(c ORDER BY c.losses DESC), '[]')
      FROM (
        SELECT 
          COALESCE(comp.name, cl.competitor_name) as competitor_name,
          COUNT(*) as losses,
          SUM(d.valor) as value_lost,
          ROUND(AVG(cl.price_difference)::numeric, 2) as avg_price_diff
        FROM competitive_losses cl
        LEFT JOIN competitors comp ON comp.id = cl.competitor_id
        LEFT JOIN deals d ON d.id = cl.deal_id
        WHERE cl.created_at >= CURRENT_DATE - p_days
        GROUP BY COALESCE(comp.name, cl.competitor_name)
        ORDER BY COUNT(*) DESC
      ) c
    ),
    'by_reason', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT loss_reason, COUNT(*) as count
        FROM competitive_losses
        WHERE created_at >= CURRENT_DATE - p_days
          AND loss_reason IS NOT NULL
        GROUP BY loss_reason
        ORDER BY COUNT(*) DESC
      ) r
    ),
    'price_analysis', (
      SELECT jsonb_build_object(
        'lost_on_price', COUNT(*) FILTER (WHERE price_difference > 0),
        'won_on_price', COUNT(*) FILTER (WHERE price_difference < 0),
        'avg_price_gap', ROUND(AVG(price_difference)::numeric, 2)
      )
      FROM competitive_losses
      WHERE created_at >= CURRENT_DATE - p_days
        AND price_difference IS NOT NULL
    )
  );
END;
$function$
