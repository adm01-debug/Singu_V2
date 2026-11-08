CREATE OR REPLACE FUNCTION public.list_pending_alerts(p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(alert_id uuid, tipo text, mensagem text, prioridade text, company_id uuid, nome_crm text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as alert_id,
    a.tipo,
    a.mensagem,
    a.prioridade,
    a.company_id,
    c.nome_crm,
    a.created_at
  FROM alerts a
  JOIN companies c ON c.id = a.company_id
  LEFT JOIN customers cu ON cu.company_id = a.company_id
  WHERE a.resolved_at IS NULL
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  ORDER BY 
    CASE a.prioridade WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    a.created_at DESC
  LIMIT p_limit;
END;
$function$
