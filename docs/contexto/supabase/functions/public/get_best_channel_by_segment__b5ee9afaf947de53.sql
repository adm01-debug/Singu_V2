CREATE OR REPLACE FUNCTION public.get_best_channel_by_segment(p_segment text)
 RETURNS TABLE(channel text, success_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT i.channel, ROUND(COUNT(DISTINCT i.company_id) FILTER (WHERE c.is_customer = true)::numeric / NULLIF(COUNT(DISTINCT i.company_id), 0) * 100, 1)
  FROM interactions i JOIN companies c ON c.id = i.company_id
  WHERE c.ramo_atividade = p_segment GROUP BY i.channel ORDER BY 2 DESC NULLS LAST;
$function$
