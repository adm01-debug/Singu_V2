CREATE OR REPLACE FUNCTION public.get_inactive_companies(p_days integer DEFAULT 30, p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, company_name text, last_interaction_date date, days_inactive integer, is_customer boolean, total_revenue numeric, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    (SELECT MAX(i.data_interacao)::date FROM interactions i WHERE i.company_id = c.id),
    EXTRACT(DAY FROM NOW() - COALESCE((SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id), c.created_at))::int,
    c.is_customer,
    COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho'), 0),
    CASE 
      WHEN c.is_customer AND COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho'), 0) > 10000 THEN 'CRÍTICA'
      WHEN c.is_customer THEN 'ALTA'
      WHEN COALESCE(c.lead_score, 0) >= 50 THEN 'MÉDIA'
      ELSE 'BAIXA'
    END::text
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND c.status = 'ativo'
    AND (
      NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)
      OR (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id) < NOW() - (p_days || ' days')::interval
    )
  ORDER BY 
    CASE WHEN c.is_customer THEN 0 ELSE 1 END,
    6 DESC, 4 DESC
  LIMIT p_limit;
END;
$function$
