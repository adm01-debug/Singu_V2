CREATE OR REPLACE FUNCTION public.get_sla_violations(p_days integer DEFAULT 30)
 RETURNS TABLE(company_id uuid, company_name text, created_at timestamp with time zone, first_response_at timestamp with time zone, response_hours numeric, sla_target_hours integer, violation_hours numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH company_sla AS (
    SELECT 
      c.id,
      COALESCE(c.nome_fantasia, c.nome_crm)::text as nome,
      c.created_at,
      (SELECT MIN(i.data_interacao) FROM interactions i WHERE i.company_id = c.id) as first_response,
      24 as sla_hours
    FROM companies c
    WHERE c.deleted_at IS NULL
      AND c.created_at >= NOW() - (p_days || ' days')::interval
  )
  SELECT 
    cs.id,
    cs.nome,
    cs.created_at,
    cs.first_response,
    ROUND(EXTRACT(EPOCH FROM cs.first_response - cs.created_at) / 3600, 1),
    cs.sla_hours,
    ROUND(EXTRACT(EPOCH FROM cs.first_response - cs.created_at) / 3600 - cs.sla_hours, 1)
  FROM company_sla cs
  WHERE cs.first_response IS NOT NULL
    AND EXTRACT(EPOCH FROM cs.first_response - cs.created_at) / 3600 > cs.sla_hours
  ORDER BY 7 DESC;
END;
$function$
