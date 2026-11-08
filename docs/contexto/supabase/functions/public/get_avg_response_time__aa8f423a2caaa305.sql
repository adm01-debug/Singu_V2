CREATE OR REPLACE FUNCTION public.get_avg_response_time(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'avg_hours', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM first_response - created_at) / 3600), 1)
      FROM (
        SELECT c.created_at, (SELECT MIN(i.data_interacao) FROM interactions i WHERE i.company_id = c.id) as first_response
        FROM companies c
        WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - (p_days || ' days')::interval
      ) t
      WHERE first_response IS NOT NULL
    ),
    'median_hours', (
      SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM first_response - created_at) / 3600), 1)
      FROM (
        SELECT c.created_at, (SELECT MIN(i.data_interacao) FROM interactions i WHERE i.company_id = c.id) as first_response
        FROM companies c
        WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - (p_days || ' days')::interval
      ) t
      WHERE first_response IS NOT NULL
    ),
    'companies_contacted', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - (p_days || ' days')::interval AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)),
    'companies_not_contacted', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - (p_days || ' days')::interval AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)),
    'sla_compliance_pct', ROUND((
      SELECT COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM first_response - created_at) / 3600 <= 24)::numeric / NULLIF(COUNT(*), 0) * 100
      FROM (SELECT c.created_at, (SELECT MIN(i.data_interacao) FROM interactions i WHERE i.company_id = c.id) as first_response FROM companies c WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - (p_days || ' days')::interval) t
      WHERE first_response IS NOT NULL
    ), 1)
  );
END;
$function$
