CREATE OR REPLACE FUNCTION public.get_active_conversations(p_user_id uuid DEFAULT NULL::uuid, p_hours integer DEFAULT 24)
 RETURNS TABLE(company_id uuid, company_name text, last_message_at timestamp with time zone, last_direction text, messages_today bigint, awaiting_response boolean, contact_phone text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  WITH recent_msgs AS (
    SELECT 
      i.company_id,
      MAX(i.created_at) as last_msg,
      (SELECT direction FROM interactions 
       WHERE company_id = i.company_id 
       ORDER BY created_at DESC LIMIT 1) as last_dir,
      COUNT(*) FILTER (WHERE i.created_at::DATE = CURRENT_DATE) as today_count
    FROM interactions i
    WHERE i.channel = 'whatsapp'
      AND i.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
      AND (p_user_id IS NULL OR i.user_id = p_user_id)
    GROUP BY i.company_id
  )
  SELECT 
    c.id,
    c.nome_fantasia::TEXT,
    rm.last_msg,
    rm.last_dir,
    rm.today_count,
    (rm.last_dir = 'inbound'),
    (SELECT phone FROM contact_phones cp 
     JOIN contacts ct ON ct.id = cp.contact_id 
     WHERE ct.company_id = c.id LIMIT 1)
  FROM recent_msgs rm
  JOIN companies c ON c.id = rm.company_id
  WHERE c.deleted_at IS NULL
  ORDER BY rm.last_msg DESC;
END;
$function$
