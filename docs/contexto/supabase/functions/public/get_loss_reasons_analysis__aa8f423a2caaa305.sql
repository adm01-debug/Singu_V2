CREATE OR REPLACE FUNCTION public.get_loss_reasons_analysis(p_days integer DEFAULT 90)
 RETURNS TABLE(reason text, loss_count bigint, total_value numeric, avg_value numeric, pct_of_total numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH losses AS (
    SELECT motivo_perda, COUNT(*) as cnt, SUM(valor) as total, AVG(valor) as avg_val
    FROM deals
    WHERE status = 'perdido' AND closed_at >= NOW() - (p_days || ' days')::interval
    GROUP BY motivo_perda
  ),
  total AS (SELECT SUM(cnt) as total_cnt FROM losses)
  SELECT 
    COALESCE(l.motivo_perda, 'Não informado'),
    l.cnt, COALESCE(l.total, 0), ROUND(COALESCE(l.avg_val, 0), 2),
    ROUND((l.cnt::numeric / NULLIF((SELECT total_cnt FROM total), 0) * 100), 1)
  FROM losses l ORDER BY l.cnt DESC;
$function$
