CREATE OR REPLACE FUNCTION public.get_urgent_interactions(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(interaction_id uuid, company_id uuid, company_name text, type text, title text, prioridade text, created_at timestamp with time zone, sentiment text, hours_old numeric)
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
    i.title,
    COALESCE(i.prioridade, 'normal')::TEXT,
    i.created_at,
    i.sentiment,
    ROUND(EXTRACT(EPOCH FROM (NOW() - i.created_at)) / 3600, 1)
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.status IN ('pendente', 'em_andamento')
    AND (i.prioridade = 'alta' OR i.prioridade = 'urgente' OR i.sentiment = 'negativo')
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
    AND c.deleted_at IS NULL
  ORDER BY 
    CASE i.prioridade 
      WHEN 'urgente' THEN 1 
      WHEN 'alta' THEN 2 
      ELSE 3 
    END,
    i.created_at ASC
  LIMIT p_limit;
END;
$function$
