CREATE OR REPLACE FUNCTION public.get_loss_trend(p_months integer DEFAULT 6)
 RETURNS TABLE(month text, deals_lost bigint, value_lost numeric, win_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    TO_CHAR(DATE_TRUNC('month', closed_at), 'YYYY-MM'),
    COUNT(*) FILTER (WHERE status = 'perdido'),
    COALESCE(SUM(valor) FILTER (WHERE status = 'perdido'), 0),
    ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*), 0) * 100, 1)
  FROM deals
  WHERE closed_at >= NOW() - (p_months || ' months')::interval AND status IN ('ganho', 'perdido')
  GROUP BY DATE_TRUNC('month', closed_at)
  ORDER BY 1;
$function$
