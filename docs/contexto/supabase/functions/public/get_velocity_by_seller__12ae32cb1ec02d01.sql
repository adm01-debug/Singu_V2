CREATE OR REPLACE FUNCTION public.get_velocity_by_seller()
 RETURNS TABLE(user_name text, avg_cycle_days numeric, deals_won bigint, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = d.user_id),
    ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1), COUNT(*), SUM(valor)
  FROM deals d WHERE d.status = 'ganho' AND d.closed_at IS NOT NULL AND d.closed_at >= NOW() - interval '90 days'
  GROUP BY d.user_id ORDER BY 2;
$function$
