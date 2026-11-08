CREATE OR REPLACE FUNCTION public.get_active_challenges()
 RETURNS TABLE(challenge_name text, target_value numeric, current_leaders jsonb, ends_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'Maior Receita do Mês'::text, 50000::numeric,
    (SELECT jsonb_agg(jsonb_build_object('name', COALESCE(p.full_name, p.email), 'value', rev))
     FROM (SELECT user_id, SUM(valor) as rev FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW()) GROUP BY user_id ORDER BY 2 DESC LIMIT 3) sub
     JOIN profiles p ON p.id = sub.user_id),
    (DATE_TRUNC('month', NOW()) + interval '1 month')::timestamptz
  UNION ALL
  SELECT 'Rei das Interações', 100, 
    (SELECT jsonb_agg(jsonb_build_object('name', COALESCE(p.full_name, p.email), 'value', cnt))
     FROM (SELECT user_id, COUNT(*) as cnt FROM interactions WHERE data_interacao >= DATE_TRUNC('week', NOW()) GROUP BY user_id ORDER BY 2 DESC LIMIT 3) sub
     JOIN profiles p ON p.id = sub.user_id),
    (DATE_TRUNC('week', NOW()) + interval '1 week')::timestamptz;
$function$
