CREATE OR REPLACE FUNCTION public.compare_productivity(p_days integer DEFAULT 30)
 RETURNS TABLE(user_id uuid, user_name text, interactions bigint, deals bigint, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT p.id, COALESCE(p.full_name, p.email),
    (SELECT COUNT(*) FROM interactions i WHERE i.user_id = p.id AND i.data_interacao >= NOW() - (p_days || ' days')::interval),
    (SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= NOW() - (p_days || ' days')::interval),
    (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= NOW() - (p_days || ' days')::interval)
  FROM profiles p WHERE p.is_active = true ORDER BY 3 DESC;
$function$
