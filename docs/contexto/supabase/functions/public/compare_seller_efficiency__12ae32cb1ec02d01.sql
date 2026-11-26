CREATE OR REPLACE FUNCTION public.compare_seller_efficiency()
 RETURNS TABLE(user_name text, interactions_per_deal numeric, conversion_rate numeric, avg_cycle_days numeric, efficiency_rank integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH stats AS (
    SELECT p.id, COALESCE(p.full_name, p.email) as name,
      (SELECT COUNT(*) FROM interactions i WHERE i.user_id = p.id)::numeric / NULLIF((SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho'), 0) as ipd,
      (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE user_id = p.id) as cr,
      (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1) FROM deals WHERE user_id = p.id AND status = 'ganho') as acd
    FROM profiles p WHERE p.is_active = true
  )
  SELECT name, ROUND(ipd, 1), cr, acd, ROW_NUMBER() OVER (ORDER BY cr DESC NULLS LAST, ipd ASC NULLS LAST)::int
  FROM stats ORDER BY 5;
$function$
