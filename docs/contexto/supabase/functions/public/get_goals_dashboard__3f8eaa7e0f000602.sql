CREATE OR REPLACE FUNCTION public.get_goals_dashboard(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_active_goals jsonb;
  v_summary jsonb;
  v_recent_achievements jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Metas ativas
  SELECT COALESCE(jsonb_agg(row_to_json(g.*)), '[]'::jsonb)
  INTO v_active_goals
  FROM (
    SELECT 
      sg.id,
      sg.goal_type,
      sg.target_value,
      COALESCE(sg.current_value, 0) as current_value,
      ROUND((COALESCE(sg.current_value, 0)::numeric / NULLIF(sg.target_value, 1)) * 100, 1) as progress_pct,
      sg.period_start,
      sg.period_end,
      (sg.period_end - CURRENT_DATE) as days_remaining
    FROM sales_goals sg
    WHERE (p_user_id IS NULL OR sg.user_id = p_user_id)
      AND CURRENT_DATE BETWEEN sg.period_start AND sg.period_end
    ORDER BY sg.period_end
  ) g;

  -- Resumo
  SELECT jsonb_build_object(
    'total_goals', COUNT(*),
    'achieved', COUNT(*) FILTER (WHERE COALESCE(sg.current_value, 0) >= sg.target_value),
    'in_progress', COUNT(*) FILTER (WHERE COALESCE(sg.current_value, 0) < sg.target_value AND sg.period_end >= CURRENT_DATE),
    'avg_progress', ROUND(AVG(COALESCE(sg.current_value, 0)::numeric / NULLIF(sg.target_value, 1)) * 100, 1)
  )
  INTO v_summary
  FROM sales_goals sg
  WHERE (p_user_id IS NULL OR sg.user_id = p_user_id)
    AND sg.period_start >= DATE_TRUNC('month', CURRENT_DATE);

  -- Conquistas recentes
  SELECT COALESCE(jsonb_agg(row_to_json(a.*)), '[]'::jsonb)
  INTO v_recent_achievements
  FROM (
    SELECT 
      ac.achievement_type,
      ac.achievement_date,
      ac.details
    FROM achievements ac
    WHERE (p_user_id IS NULL OR ac.salesperson_id = p_user_id)
      AND ac.achievement_date >= CURRENT_DATE - 30
    ORDER BY ac.achievement_date DESC
    LIMIT 10
  ) a;

  v_result := jsonb_build_object(
    'generated_at', NOW(),
    'user_id', p_user_id,
    'summary', COALESCE(v_summary, '{}'::jsonb),
    'active_goals', v_active_goals,
    'recent_achievements', v_recent_achievements
  );

  RETURN v_result;
END;
$function$
