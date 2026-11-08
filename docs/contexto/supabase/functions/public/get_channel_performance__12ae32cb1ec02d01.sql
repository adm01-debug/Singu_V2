CREATE OR REPLACE FUNCTION public.get_channel_performance()
 RETURNS TABLE(channel text, interactions bigint, unique_companies bigint, deals_influenced bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT i.channel, COUNT(*), COUNT(DISTINCT i.company_id),
    (SELECT COUNT(DISTINCT d.id) FROM deals d WHERE d.company_id = ANY(ARRAY_AGG(i.company_id)) AND d.status = 'ganho')
  FROM interactions i WHERE i.data_interacao >= NOW() - interval '90 days'
  GROUP BY i.channel ORDER BY 2 DESC;
$function$
