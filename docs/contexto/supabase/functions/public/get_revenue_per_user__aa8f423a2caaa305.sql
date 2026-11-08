CREATE OR REPLACE FUNCTION public.get_revenue_per_user(p_days integer DEFAULT 30)
 RETURNS TABLE(user_id uuid, user_name text, revenue numeric, deals_count bigint, avg_deal numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT d.user_id, (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = d.user_id),
    SUM(d.valor), COUNT(*), ROUND(AVG(d.valor), 2)
  FROM deals d WHERE d.status = 'ganho' AND d.closed_at >= NOW() - (p_days || ' days')::interval
  GROUP BY d.user_id ORDER BY 3 DESC;
$function$
