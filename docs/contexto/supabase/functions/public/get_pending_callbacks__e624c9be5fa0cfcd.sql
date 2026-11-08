CREATE OR REPLACE FUNCTION public.get_pending_callbacks(p_user_id uuid DEFAULT NULL::uuid, p_include_overdue boolean DEFAULT true)
 RETURNS TABLE(interaction_id uuid, company_id uuid, company_name text, contact_name text, scheduled_date timestamp with time zone, is_overdue boolean, hours_until numeric, assunto text, channel text)
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
    ct.full_name,
    i.data_agendada,
    i.data_agendada < NOW(),
    ROUND(EXTRACT(EPOCH FROM (i.data_agendada - NOW())) / 3600, 1),
    i.assunto,
    i.channel
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  LEFT JOIN contacts ct ON ct.id = i.contact_id
  WHERE i.data_agendada IS NOT NULL
    AND i.status IN ('agendado', 'pendente')
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
    AND c.deleted_at IS NULL
    AND (p_include_overdue OR i.data_agendada >= NOW())
  ORDER BY i.data_agendada ASC;
END;
$function$
