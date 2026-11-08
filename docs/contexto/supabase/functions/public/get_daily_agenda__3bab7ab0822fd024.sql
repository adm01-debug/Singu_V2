CREATE OR REPLACE FUNCTION public.get_daily_agenda(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_follow_ups jsonb;
  v_visits jsonb;
  v_reminders jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Follow-ups do dia
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'company_id', i.company_id,
    'company_name', COALESCE(c.nome_fantasia, c.nome_crm),
    'notes', COALESCE(i.resumo, i.content),
    'type', i.type
  )), '[]'::jsonb) INTO v_follow_ups
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.follow_up_date = p_date AND i.user_id = p_user_id
    AND COALESCE(i.followup_concluido, false) = false;
  
  -- Visitas do dia
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'visit_id', sv.id,
    'company_id', sv.company_id,
    'company_name', COALESCE(c.nome_fantasia, c.nome_crm),
    'visit_type', sv.visit_type,
    'notes', sv.notes
  )), '[]'::jsonb) INTO v_visits
  FROM scheduled_visits sv
  JOIN companies c ON c.id = sv.company_id
  WHERE sv.visit_date::date = p_date AND sv.user_id = p_user_id AND sv.status = 'pending';
  
  -- Lembretes do dia
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'reminder_id', r.id,
    'title', r.title,
    'company_id', r.company_id
  )), '[]'::jsonb) INTO v_reminders
  FROM reminders r
  WHERE r.reminder_date::date = p_date AND r.user_id = p_user_id AND r.is_completed = false;

  v_result := jsonb_build_object(
    'date', p_date,
    'user_id', p_user_id,
    'follow_ups', v_follow_ups,
    'follow_ups_count', jsonb_array_length(v_follow_ups),
    'visits', v_visits,
    'visits_count', jsonb_array_length(v_visits),
    'reminders', v_reminders,
    'reminders_count', jsonb_array_length(v_reminders)
  );
  
  RETURN v_result;
END;
$function$
