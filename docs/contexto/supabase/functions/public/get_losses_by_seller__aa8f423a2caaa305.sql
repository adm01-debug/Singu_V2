CREATE OR REPLACE FUNCTION public.get_losses_by_seller(p_days integer DEFAULT 90)
 RETURNS TABLE(user_id uuid, user_name text, deals_lost bigint, value_lost numeric, win_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, COALESCE(p.full_name, p.email),
    (SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'perdido' AND d.closed_at >= NOW() - (p_days || ' days')::interval),
    (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE d.user_id = p.id AND d.status = 'perdido' AND d.closed_at >= NOW() - (p_days || ' days')::interval),
    (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1)
     FROM deals d WHERE d.user_id = p.id AND d.closed_at >= NOW() - (p_days || ' days')::interval)
  FROM profiles p WHERE p.is_active = true ORDER BY 3 DESC;
$function$
