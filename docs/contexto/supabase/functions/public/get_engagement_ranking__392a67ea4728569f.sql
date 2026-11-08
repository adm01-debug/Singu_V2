CREATE OR REPLACE FUNCTION public.get_engagement_ranking(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, name text, engagement_score integer, last_interaction timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_engagement_score(c.id),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id)
  FROM companies c WHERE c.deleted_at IS NULL ORDER BY 3 DESC LIMIT p_limit;
$function$
