CREATE OR REPLACE FUNCTION public.get_negative_sentiment_alerts(p_days integer DEFAULT 7)
 RETURNS TABLE(company_id uuid, company_name text, negative_count bigint, last_negative_date timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm)::text,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id AND i.sentiment = 'negative' AND i.data_interacao >= NOW() - (p_days || ' days')::interval),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id AND i.sentiment = 'negative')
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.sentiment = 'negative' AND i.data_interacao >= NOW() - (p_days || ' days')::interval)
  ORDER BY 3 DESC;
END;
$function$
