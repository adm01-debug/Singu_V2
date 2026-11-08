CREATE OR REPLACE FUNCTION public.get_at_risk_pareto_customers()
 RETURNS TABLE(company_id uuid, name text, revenue numeric, days_since_contact integer, risk_level text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT company_id, name, revenue,
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = p.company_id))::int,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = p.company_id AND i.data_interacao >= NOW() - interval '60 days') THEN 'CRÍTICO'
      WHEN NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = p.company_id AND i.data_interacao >= NOW() - interval '30 days') THEN 'ALTO'
      ELSE 'OK'
    END
  FROM get_pareto_customers() p WHERE pareto_group = 'Top 20%'
  ORDER BY revenue DESC;
$function$
