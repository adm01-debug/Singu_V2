CREATE OR REPLACE FUNCTION public.get_master_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      -- VISÃO GERAL
      'overview', jsonb_build_object(
        'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
        'total_contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
        'active_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')),
        'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')),
        'active_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true)
      ),
      
      -- KPIs DO MÊS
      'monthly_kpis', jsonb_build_object(
        'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'new_deals', (SELECT COUNT(*) FROM deals WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'deals_lost', (SELECT COUNT(*) FROM deals WHERE status = 'perdido' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', CURRENT_DATE)),
        'proposals_sent', (SELECT COUNT(*) FROM proposals WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'proposals_accepted', (SELECT COUNT(*) FROM proposals WHERE status = 'aceita' AND data_resposta >= DATE_TRUNC('month', CURRENT_DATE)),
        'conversion_rate', (
          SELECT ROUND(
            COUNT(*) FILTER (WHERE status = 'aceita')::numeric / 
            NULLIF(COUNT(*) FILTER (WHERE status IN ('aceita', 'rejeitada')), 0) * 100, 2
          ) FROM proposals WHERE data_resposta >= DATE_TRUNC('month', CURRENT_DATE)
        )
      ),
      
      -- PIPELINE POR ESTÁGIO
      'pipeline_by_stage', (
        SELECT jsonb_agg(jsonb_build_object('stage', pipeline_stage, 'count', cnt, 'value', val))
        FROM (SELECT pipeline_stage, COUNT(*) cnt, SUM(valor) val FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado') GROUP BY pipeline_stage) t
      ),
      
      -- TOP 5 VENDEDORES
      'top_sellers', (
        SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'name', name, 'deals_won', deals_won, 'revenue', revenue, 'interactions', interactions))
        FROM (
          SELECT pr.id as user_id, pr.full_name as name,
            (SELECT COUNT(*) FROM deals WHERE user_id = pr.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)) as deals_won,
            (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = pr.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)) as revenue,
            (SELECT COUNT(*) FROM interactions WHERE user_id = pr.id AND data_interacao >= DATE_TRUNC('month', CURRENT_DATE)) as interactions
          FROM profiles pr WHERE pr.is_active = true ORDER BY revenue DESC LIMIT 5
        ) t
      ),
      
      -- ALERTAS
      'alerts', jsonb_build_object(
        'overdue_follow_ups', (SELECT COUNT(*) FROM interactions WHERE follow_up_date < CURRENT_DATE AND COALESCE(followup_concluido, false) = false),
        'stale_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - INTERVAL '14 days'),
        'pending_tasks', (SELECT COUNT(*) FROM tasks WHERE status = 'pending' AND due_date < CURRENT_DATE),
        'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false)
      ),
      
      -- FORECAST 3 MESES
      'forecast_90d', jsonb_build_object(
        'total', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND previsao_fechamento <= CURRENT_DATE + 90),
        'weighted', (SELECT COALESCE(SUM(valor * probabilidade / 100), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND previsao_fechamento <= CURRENT_DATE + 90)
      ),
      
      -- NPS
      'nps', (SELECT calculate_nps(90)),
      
      -- HEALTH CHECK
      'health', (SELECT get_crm_health_check()),
      
      'generated_at', NOW()
    )
  );
END;
$function$
