CREATE OR REPLACE FUNCTION public.get_loss_reason_analysis(p_days integer DEFAULT 90)
 RETURNS TABLE(reason_id uuid, reason_name text, category text, count bigint, total_value numeric, pct_of_total numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total_lost bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_lost FROM deals WHERE status = 'perdido' AND closed_at >= NOW() - (p_days || ' days')::interval;
  
  RETURN QUERY
  SELECT 
    lr.id as reason_id,
    lr.nome::text as reason_name,
    lr.categoria::text as category,
    COUNT(d.id)::bigint as count,
    COALESCE(SUM(d.valor), 0)::numeric as total_value,
    ROUND(COUNT(d.id)::numeric / NULLIF(v_total_lost, 0) * 100, 2) as pct_of_total
  FROM loss_reasons lr
  LEFT JOIN deals d ON d.loss_reason_id = lr.id AND d.status = 'perdido' AND d.closed_at >= NOW() - (p_days || ' days')::interval
  WHERE lr.is_active = true
  GROUP BY lr.id, lr.nome, lr.categoria
  ORDER BY count DESC;
END;
$function$
