CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period text DEFAULT 'month'::text)
 RETURNS TABLE(rank integer, user_id uuid, user_name text, revenue numeric, deals_won bigint, interactions bigint, points integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH period_filter AS (
    SELECT CASE 
      WHEN p_period = 'day' THEN NOW() - interval '1 day'
      WHEN p_period = 'week' THEN NOW() - interval '1 week'
      WHEN p_period = 'month' THEN NOW() - interval '1 month'
      WHEN p_period = 'quarter' THEN NOW() - interval '3 months'
      ELSE NOW() - interval '1 month'
    END as start_date
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY (
      COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= (SELECT start_date FROM period_filter)), 0) / 1000 +
      (SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= (SELECT start_date FROM period_filter)) * 50 +
      (SELECT COUNT(*) FROM interactions i WHERE i.user_id = p.id AND i.data_interacao >= (SELECT start_date FROM period_filter)) * 2
    ) DESC)::int,
    p.id,
    COALESCE(p.full_name, p.email),
    COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= (SELECT start_date FROM period_filter)), 0),
    (SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= (SELECT start_date FROM period_filter)),
    (SELECT COUNT(*) FROM interactions i WHERE i.user_id = p.id AND i.data_interacao >= (SELECT start_date FROM period_filter)),
    (
      COALESCE((SELECT SUM(d.valor)::int FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= (SELECT start_date FROM period_filter)), 0) / 1000 +
      (SELECT COUNT(*)::int FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= (SELECT start_date FROM period_filter)) * 50 +
      (SELECT COUNT(*)::int FROM interactions i WHERE i.user_id = p.id AND i.data_interacao >= (SELECT start_date FROM period_filter)) * 2
    )::int
  FROM profiles p
  WHERE p.is_active = true
  ORDER BY 7 DESC;
$function$
