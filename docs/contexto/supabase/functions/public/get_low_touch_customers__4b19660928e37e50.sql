CREATE OR REPLACE FUNCTION public.get_low_touch_customers(p_min_days integer DEFAULT 14)
 RETURNS TABLE(company_id uuid, name text, days_since_touch integer, touchpoints_total bigint, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id),
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - (p_min_days || ' days')::interval)
  ORDER BY 5 DESC LIMIT 100;
$function$
