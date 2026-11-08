CREATE OR REPLACE FUNCTION public.compare_with_competitors()
 RETURNS TABLE(metric text, our_value text, market_avg text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'Win Rate'::text, 
    (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1)::text || '%' FROM deals),
    '~50%'
  UNION ALL
  SELECT 'Ticket Médio',
    (SELECT 'R$ ' || ROUND(AVG(valor), 0)::text FROM deals WHERE status = 'ganho'),
    'R$ 5.000'
  UNION ALL
  SELECT 'Ciclo de Vendas',
    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 0)::text || ' dias' FROM deals WHERE status = 'ganho' AND closed_at IS NOT NULL),
    '30 dias';
$function$
