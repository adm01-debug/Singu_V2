CREATE OR REPLACE FUNCTION public.get_top_performers(p_metric text DEFAULT 'revenue'::text, p_limit integer DEFAULT 5)
 RETURNS TABLE(rank integer, user_name text, value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT ROW_NUMBER() OVER (ORDER BY val DESC)::int, name, val FROM (
    SELECT COALESCE(p.full_name, p.email) as name,
      CASE p_metric
        WHEN 'revenue' THEN (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW()))
        WHEN 'deals' THEN (SELECT COUNT(*)::numeric FROM deals WHERE user_id = p.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW()))
        WHEN 'interactions' THEN (SELECT COUNT(*)::numeric FROM interactions WHERE user_id = p.id AND data_interacao >= DATE_TRUNC('month', NOW()))
      END as val
    FROM profiles p WHERE p.is_active = true
  ) sub ORDER BY val DESC LIMIT p_limit;
$function$
