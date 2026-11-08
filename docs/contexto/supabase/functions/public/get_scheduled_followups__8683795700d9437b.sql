CREATE OR REPLACE FUNCTION public.get_scheduled_followups(p_user_id uuid, p_days integer DEFAULT 7)
 RETURNS TABLE(interaction_id uuid, company_name text, follow_up_date date, resumo text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT i.id, (SELECT COALESCE(c.nome_fantasia, c.nome_crm) FROM companies c WHERE c.id = i.company_id),
    i.follow_up_date, i.resumo
  FROM interactions i WHERE i.user_id = p_user_id AND i.follow_up_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days
  ORDER BY i.follow_up_date;
$function$
