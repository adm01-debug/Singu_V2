CREATE OR REPLACE FUNCTION public.get_salesperson_kpis(p_user_id uuid, p_period_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date := CURRENT_DATE - p_period_days;
  v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'period_days', p_period_days,
    'period_start', v_start_date,
    
    -- Atividades
    'total_interactions', (SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p_user_id AND i.data_interacao >= v_start_date),
    'calls', (SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p_user_id AND i.type = 'call' AND i.data_interacao >= v_start_date),
    'emails', (SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p_user_id AND i.type = 'email' AND i.data_interacao >= v_start_date),
    'whatsapp', (SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p_user_id AND i.type = 'whatsapp' AND i.data_interacao >= v_start_date),
    'meetings', (SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p_user_id AND i.type = 'meeting' AND i.data_interacao >= v_start_date),
    
    -- Pipeline
    'active_deals', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido', 'arquivado')),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido', 'arquivado')),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= v_start_date),
    'deals_lost', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'perdido' AND closed_at >= v_start_date),
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= v_start_date),
    
    -- Propostas
    'proposals_sent', (SELECT COUNT(*) FROM proposals p JOIN deals d ON d.id = p.deal_id WHERE d.user_id = p_user_id AND p.created_at >= v_start_date),
    'proposals_approved', (SELECT COUNT(*) FROM proposals p JOIN deals d ON d.id = p.deal_id WHERE d.user_id = p_user_id AND p.status = 'approved' AND p.created_at >= v_start_date),
    
    -- Carteira
    'total_companies', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND deleted_at IS NULL),
    'new_companies', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND created_at >= v_start_date AND deleted_at IS NULL),
    
    -- Taxas
    'win_rate', (
      SELECT CASE 
        WHEN (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status IN ('ganho', 'perdido') AND closed_at >= v_start_date) > 0
        THEN ROUND(100.0 * (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= v_start_date) / 
             (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status IN ('ganho', 'perdido') AND closed_at >= v_start_date), 1)
        ELSE 0
      END
    ),
    'avg_deal_value', (SELECT COALESCE(AVG(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= v_start_date)
    
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
