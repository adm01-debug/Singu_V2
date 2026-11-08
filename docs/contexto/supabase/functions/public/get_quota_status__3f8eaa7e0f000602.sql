CREATE OR REPLACE FUNCTION public.get_quota_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_quota numeric := 0;
  v_achieved numeric := 0;
  v_days_elapsed integer;
  v_days_total integer;
  v_daily_required numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Buscar quota de revenue do mês atual
  SELECT 
    COALESCE(sg.target_value, 0),
    COALESCE(sg.current_value, 0),
    CURRENT_DATE - sg.period_start,
    sg.period_end - sg.period_start
  INTO v_quota, v_achieved, v_days_elapsed, v_days_total
  FROM sales_goals sg
  WHERE sg.user_id = p_user_id
    AND sg.goal_type = 'revenue'
    AND CURRENT_DATE BETWEEN sg.period_start AND sg.period_end
  ORDER BY sg.period_end DESC
  LIMIT 1;

  -- Calcular valor diário necessário
  IF v_days_total > v_days_elapsed THEN
    v_daily_required := (v_quota - v_achieved) / (v_days_total - v_days_elapsed);
  ELSE
    v_daily_required := 0;
  END IF;

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'quota', v_quota,
    'achieved', v_achieved,
    'remaining', GREATEST(0, v_quota - v_achieved),
    'pct_achieved', CASE WHEN v_quota > 0 THEN ROUND((v_achieved / v_quota) * 100, 1) ELSE 0 END,
    'days_elapsed', v_days_elapsed,
    'days_remaining', GREATEST(0, v_days_total - v_days_elapsed),
    'daily_required', ROUND(GREATEST(0, v_daily_required), 2),
    'on_track', v_achieved >= (v_quota * v_days_elapsed / NULLIF(v_days_total, 0)),
    'pace_pct', CASE 
      WHEN v_days_elapsed > 0 AND v_quota > 0 
      THEN ROUND(((v_achieved / v_days_elapsed) * v_days_total / v_quota) * 100, 1)
      ELSE 0 
    END
  );

  RETURN v_result;
END;
$function$
