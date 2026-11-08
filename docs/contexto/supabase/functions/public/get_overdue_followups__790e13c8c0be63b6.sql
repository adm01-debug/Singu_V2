CREATE OR REPLACE FUNCTION public.get_overdue_followups(p_user_id uuid DEFAULT NULL::uuid, p_days_overdue integer DEFAULT 0)
 RETURNS TABLE(interaction_id uuid, company_id uuid, company_name text, contact_name text, follow_up_date date, days_overdue integer, assunto text, prioridade text)
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
    i.follow_up_date,
    (CURRENT_DATE - i.follow_up_date)::INT,
    i.assunto,
    COALESCE(i.prioridade, 'normal')::TEXT
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  LEFT JOIN contacts ct ON ct.id = i.contact_id
  WHERE i.follow_up_required = TRUE
    AND i.followup_concluido IS NOT TRUE
    AND i.follow_up_date < CURRENT_DATE - p_days_overdue
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
    AND c.deleted_at IS NULL
  ORDER BY i.follow_up_date ASC;
END;
$function$
