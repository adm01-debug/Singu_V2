CREATE OR REPLACE FUNCTION public.get_performance_metrics(p_user_id uuid DEFAULT NULL::uuid, p_period text DEFAULT 'month'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date;
  v_prev_start_date date;
  v_current jsonb;
  v_previous jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  v_start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - 7
    WHEN 'month' THEN CURRENT_DATE - 30
    WHEN 'quarter' THEN CURRENT_DATE - 90
    ELSE CURRENT_DATE - 30
  END;
  
  v_prev_start_date := v_start_date - (CURRENT_DATE - v_start_date);
  
  -- Métricas do período atual
  SELECT jsonb_build_object(
    'interactions', COUNT(DISTINCT i.id),
    'companies_contacted', COUNT(DISTINCT i.company_id),
    'deals_created', (SELECT COUNT(*) FROM deals d WHERE (p_user_id IS NULL OR d.user_id = p_user_id) AND d.created_at >= v_start_date),
    'deals_won', (SELECT COUNT(*) FROM deals d WHERE (p_user_id IS NULL OR d.user_id = p_user_id) AND d.status = 'ganho' AND d.closed_at >= v_start_date),
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE (p_user_id IS NULL OR d.user_id = p_user_id) AND d.status = 'ganho' AND d.closed_at >= v_start_date),
    'proposals_sent', (SELECT COUNT(*) FROM proposals p WHERE (p_user_id IS NULL OR p.user_id = p_user_id) AND p.created_at >= v_start_date),
    'tasks_completed', (SELECT COUNT(*) FROM tasks t WHERE (p_user_id IS NULL OR t.user_id = p_user_id) AND t.status = 'completed' AND t.completed_at >= v_start_date)
  ) INTO v_current
  FROM interactions i
  WHERE (p_user_id IS NULL OR i.user_id = p_user_id) AND i.data_interacao >= v_start_date;
  
  -- Métricas do período anterior
  SELECT jsonb_build_object(
    'interactions', COUNT(DISTINCT i.id),
    'deals_won', (SELECT COUNT(*) FROM deals d WHERE (p_user_id IS NULL OR d.user_id = p_user_id) AND d.status = 'ganho' AND d.closed_at BETWEEN v_prev_start_date AND v_start_date),
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE (p_user_id IS NULL OR d.user_id = p_user_id) AND d.status = 'ganho' AND d.closed_at BETWEEN v_prev_start_date AND v_start_date)
  ) INTO v_previous
  FROM interactions i
  WHERE (p_user_id IS NULL OR i.user_id = p_user_id) AND i.data_interacao BETWEEN v_prev_start_date AND v_start_date;
  
  RETURN jsonb_build_object(
    'period', p_period,
    'start_date', v_start_date,
    'current', v_current,
    'previous', v_previous,
    'growth', jsonb_build_object(
      'interactions_pct', ROUND(((v_current->>'interactions')::numeric - (v_previous->>'interactions')::numeric) / NULLIF((v_previous->>'interactions')::numeric, 0) * 100, 1),
      'revenue_pct', ROUND(((v_current->>'revenue')::numeric - (v_previous->>'revenue')::numeric) / NULLIF((v_previous->>'revenue')::numeric, 0) * 100, 1)
    ),
    'calculated_at', NOW()
  );
END;
$function$
