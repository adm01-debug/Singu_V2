CREATE OR REPLACE FUNCTION public.get_churn_risk_companies(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, name text, days_since_interaction integer, last_deal_value numeric, churn_risk text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int,
    (SELECT d.valor FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho' ORDER BY d.closed_at DESC LIMIT 1),
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '90 days') THEN 'ALTO'
      WHEN NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '60 days') THEN 'MÉDIO'
      ELSE 'BAIXO'
    END
  FROM companies c
  WHERE c.is_customer = true AND c.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days')
  ORDER BY 3 DESC NULLS LAST
  LIMIT p_limit;
$function$
