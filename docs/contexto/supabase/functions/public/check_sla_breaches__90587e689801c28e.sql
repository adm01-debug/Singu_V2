CREATE OR REPLACE FUNCTION public.check_sla_breaches(p_hours_threshold integer DEFAULT 48, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(interaction_id uuid, company_id uuid, company_name text, interaction_type text, created_at timestamp with time zone, hours_pending numeric, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    i.id,
    i.company_id,
    c.nome_fantasia::TEXT,
    i.type,
    i.created_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600, 1),
    COALESCE(i.prioridade, 'normal')::TEXT
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.status IN ('pendente', 'em_andamento', 'aguardando')
    AND i.created_at < NOW() - (p_hours_threshold || ' hours')::INTERVAL
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
    AND c.deleted_at IS NULL
  ORDER BY i.created_at ASC;
END;
$function$
