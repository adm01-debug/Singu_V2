CREATE OR REPLACE FUNCTION public.compare_sellers(p_days integer DEFAULT 30)
 RETURNS TABLE(user_id uuid, user_name text, deals_won bigint, revenue numeric, interactions bigint, ranking integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, COALESCE(p.full_name, p.email),
    (SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= NOW() - (p_days || ' days')::interval),
    (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= NOW() - (p_days || ' days')::interval),
    (SELECT COUNT(*) FROM interactions i WHERE i.user_id = p.id AND i.data_interacao >= NOW() - (p_days || ' days')::interval),
    ROW_NUMBER() OVER (ORDER BY (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho') DESC)::int
  FROM profiles p WHERE p.is_active = true ORDER BY 4 DESC;
$function$
