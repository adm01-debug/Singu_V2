CREATE OR REPLACE FUNCTION public.get_seller_strengths(p_user_id uuid)
 RETURNS TABLE(strength text, score numeric, benchmark numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'Conversão'::text, 
    (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE user_id = p_user_id),
    (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals)
  UNION ALL
  SELECT 'Volume de Atividade',
    (SELECT COUNT(*)::numeric FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - interval '30 days'),
    (SELECT AVG(cnt) FROM (SELECT COUNT(*) as cnt FROM interactions WHERE data_interacao >= NOW() - interval '30 days' GROUP BY user_id) sub)
  UNION ALL
  SELECT 'Ticket Médio',
    (SELECT ROUND(AVG(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho'),
    (SELECT ROUND(AVG(valor), 0) FROM deals WHERE status = 'ganho');
$function$
