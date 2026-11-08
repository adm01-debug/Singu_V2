CREATE OR REPLACE FUNCTION public.get_conversion_metrics(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date := CURRENT_DATE - p_days;
BEGIN
  RETURN jsonb_build_object(
    'period_days', p_days,
    'period_start', v_start_date,
    
    -- Funil de Vendas
    'total_leads_created', (SELECT COUNT(*) FROM companies WHERE created_at >= v_start_date AND deleted_at IS NULL),
    'leads_contacted', (SELECT COUNT(DISTINCT i.company_id) FROM interactions i WHERE i.data_interacao >= v_start_date),
    'deals_created', (SELECT COUNT(*) FROM deals WHERE created_at >= v_start_date),
    'proposals_sent', (SELECT COUNT(*) FROM proposals WHERE created_at >= v_start_date),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= v_start_date),
    'deals_lost', (SELECT COUNT(*) FROM deals WHERE status = 'perdido' AND closed_at >= v_start_date),
    
    -- Taxas de Conversão
    'contact_rate', (
      SELECT CASE WHEN (SELECT COUNT(*) FROM companies WHERE created_at >= v_start_date AND deleted_at IS NULL) > 0
        THEN ROUND(100.0 * (SELECT COUNT(DISTINCT i.company_id) FROM interactions i WHERE i.data_interacao >= v_start_date) / 
             (SELECT COUNT(*) FROM companies WHERE created_at >= v_start_date AND deleted_at IS NULL), 1)
        ELSE 0 END
    ),
    'deal_creation_rate', (
      SELECT CASE WHEN (SELECT COUNT(DISTINCT i.company_id) FROM interactions i WHERE i.data_interacao >= v_start_date) > 0
        THEN ROUND(100.0 * (SELECT COUNT(*) FROM deals WHERE created_at >= v_start_date) / 
             (SELECT COUNT(DISTINCT i.company_id) FROM interactions i WHERE i.data_interacao >= v_start_date), 1)
        ELSE 0 END
    ),
    'proposal_rate', (
      SELECT CASE WHEN (SELECT COUNT(*) FROM deals WHERE created_at >= v_start_date) > 0
        THEN ROUND(100.0 * (SELECT COUNT(*) FROM proposals WHERE created_at >= v_start_date) / 
             (SELECT COUNT(*) FROM deals WHERE created_at >= v_start_date), 1)
        ELSE 0 END
    ),
    'win_rate', (
      SELECT CASE WHEN (SELECT COUNT(*) FROM deals WHERE status IN ('ganho', 'perdido') AND closed_at >= v_start_date) > 0
        THEN ROUND(100.0 * (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= v_start_date) / 
             (SELECT COUNT(*) FROM deals WHERE status IN ('ganho', 'perdido') AND closed_at >= v_start_date), 1)
        ELSE 0 END
    ),
    
    -- Valores
    'total_revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= v_start_date),
    'avg_deal_value', (SELECT COALESCE(AVG(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= v_start_date),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')),
    
    -- Ciclo de Vendas
    'avg_days_to_close', (
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 0)::int 
      FROM deals WHERE status = 'ganho' AND closed_at >= v_start_date
    ),
    
    'calculated_at', NOW()
  );
END;
$function$
