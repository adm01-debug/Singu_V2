CREATE OR REPLACE FUNCTION public.get_priority_actions(p_user_id uuid)
 RETURNS TABLE(action_type text, description text, company_id uuid, due_date date)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'follow_up'::text, 'Follow-up agendado: ' || i.resumo, i.company_id, i.follow_up_date
  FROM interactions i WHERE i.user_id = p_user_id AND i.follow_up_date = CURRENT_DATE
  UNION ALL
  SELECT 'reminder', r.title, r.company_id, r.reminder_date::date
  FROM reminders r WHERE r.user_id = p_user_id AND r.is_completed = false AND r.reminder_date::date <= CURRENT_DATE
  ORDER BY 4 LIMIT 20;
$function$
