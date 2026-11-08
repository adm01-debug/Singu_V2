CREATE OR REPLACE FUNCTION public.get_productivity_score(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_interactions_count int;
  v_tasks_completed int;
  v_tasks_overdue int;
  v_companies_contacted int;
  v_score int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT COUNT(*) INTO v_interactions_count
  FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - (p_days || ' days')::interval;
  
  SELECT COUNT(*) INTO v_tasks_completed
  FROM interactions WHERE user_id = p_user_id AND followup_concluido = true AND updated_at >= NOW() - (p_days || ' days')::interval;
  
  SELECT COUNT(*) INTO v_tasks_overdue
  FROM interactions WHERE user_id = p_user_id AND follow_up_date < CURRENT_DATE AND COALESCE(followup_concluido, false) = false;
  
  SELECT COUNT(DISTINCT company_id) INTO v_companies_contacted
  FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - (p_days || ' days')::interval;
  
  v_score := LEAST(v_interactions_count, 100) + (v_tasks_completed * 2) - (v_tasks_overdue * 5) + (v_companies_contacted * 3);
  v_score := GREATEST(v_score, 0);

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'period_days', p_days,
    'productivity_score', v_score,
    'interactions_count', v_interactions_count,
    'tasks_completed', v_tasks_completed,
    'tasks_overdue', v_tasks_overdue,
    'companies_contacted', v_companies_contacted,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
