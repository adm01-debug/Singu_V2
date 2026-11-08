CREATE OR REPLACE FUNCTION public.get_workflow_history(p_company_id uuid DEFAULT NULL::uuid, p_event_type text DEFAULT NULL::text, p_days integer DEFAULT 30)
 RETURNS TABLE(event_id uuid, company_id uuid, company_name text, event_type text, created_at timestamp with time zone, payload jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.company_id,
    c.nome_fantasia::TEXT,
    i.metadata->>'event_type',
    i.created_at,
    i.metadata
  FROM interactions i
  LEFT JOIN companies c ON c.id = i.company_id
  WHERE i.type = 'workflow_event'
    AND i.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_company_id IS NULL OR i.company_id = p_company_id)
    AND (p_event_type IS NULL OR i.metadata->>'event_type' = p_event_type)
  ORDER BY i.created_at DESC;
END;
$function$
