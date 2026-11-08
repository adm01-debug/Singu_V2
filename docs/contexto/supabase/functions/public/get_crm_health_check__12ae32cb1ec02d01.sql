CREATE OR REPLACE FUNCTION public.get_crm_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_score int := 100;
  v_issues jsonb := '[]'::jsonb;
BEGIN
  -- Verificar empresas sem usuário responsável
  IF (SELECT COUNT(*) FROM companies WHERE user_id IS NULL AND deleted_at IS NULL) > 100 THEN
    v_score := v_score - 10;
    v_issues := v_issues || jsonb_build_object('type', 'warning', 'message', 'Muitas empresas sem responsável atribuído');
  END IF;
  
  -- Verificar deals parados
  IF (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - INTERVAL '30 days') > 50 THEN
    v_score := v_score - 15;
    v_issues := v_issues || jsonb_build_object('type', 'error', 'message', 'Deals parados há mais de 30 dias');
  END IF;
  
  -- Verificar follow-ups vencidos
  IF (SELECT COUNT(*) FROM interactions WHERE follow_up_date < CURRENT_DATE AND COALESCE(followup_concluido, false) = false) > 100 THEN
    v_score := v_score - 10;
    v_issues := v_issues || jsonb_build_object('type', 'warning', 'message', 'Muitos follow-ups vencidos');
  END IF;
  
  -- Verificar tarefas atrasadas
  IF (SELECT COUNT(*) FROM tasks WHERE due_date < CURRENT_DATE AND status = 'pending') > 50 THEN
    v_score := v_score - 10;
    v_issues := v_issues || jsonb_build_object('type', 'warning', 'message', 'Tarefas atrasadas pendentes');
  END IF;
  
  -- Verificar leads sem score
  IF (SELECT COUNT(*) FROM companies WHERE lead_score IS NULL AND deleted_at IS NULL) > 1000 THEN
    v_score := v_score - 5;
    v_issues := v_issues || jsonb_build_object('type', 'info', 'message', 'Empresas sem lead score calculado');
  END IF;
  
  SELECT jsonb_build_object(
    'health_score', GREATEST(v_score, 0),
    'status', CASE 
      WHEN v_score >= 80 THEN 'healthy'
      WHEN v_score >= 60 THEN 'attention'
      WHEN v_score >= 40 THEN 'warning'
      ELSE 'critical'
    END,
    'issues', v_issues,
    'stats', jsonb_build_object(
      'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'total_contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'total_deals', (SELECT COUNT(*) FROM deals),
      'open_deals_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')),
      'monthly_interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', CURRENT_DATE)),
      'active_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true)
    ),
    'checked_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
