CREATE OR REPLACE FUNCTION public.get_follow_up_queue(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, company_name text, contact_name text, follow_up_date date, days_overdue integer, priority text, last_notes text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT DISTINCT ON (i.company_id)
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    (SELECT COALESCE(ct.full_name, ct.first_name) FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL LIMIT 1)::text as contact_name,
    i.follow_up_date,
    (CURRENT_DATE - i.follow_up_date)::int as days_overdue,
    CASE 
      WHEN i.follow_up_date < CURRENT_DATE - 7 THEN 'critical'
      WHEN i.follow_up_date < CURRENT_DATE THEN 'high'
      WHEN i.follow_up_date = CURRENT_DATE THEN 'today'
      ELSE 'upcoming'
    END::text as priority,
    COALESCE(i.resumo, i.content)::text as last_notes
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.follow_up_date IS NOT NULL
    AND i.follow_up_date <= CURRENT_DATE + 7
    AND COALESCE(i.followup_concluido, false) = false
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
    AND c.deleted_at IS NULL
  ORDER BY i.company_id, i.follow_up_date ASC
  LIMIT p_limit;
END;
$function$
