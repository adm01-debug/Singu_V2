CREATE OR REPLACE FUNCTION public.count_unread_messages(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(company_id uuid, company_name text, unread_count bigint, oldest_unread timestamp with time zone, latest_unread timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    i.company_id,
    c.nome_fantasia::TEXT,
    COUNT(*),
    MIN(i.created_at),
    MAX(i.created_at)
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.status IN ('pendente', 'nao_lido')
    AND i.direction = 'inbound'
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
    AND c.deleted_at IS NULL
  GROUP BY i.company_id, c.nome_fantasia
  ORDER BY COUNT(*) DESC;
END;
$function$
