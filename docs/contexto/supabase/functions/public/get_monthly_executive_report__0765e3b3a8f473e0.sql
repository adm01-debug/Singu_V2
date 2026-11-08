CREATE OR REPLACE FUNCTION public.get_monthly_executive_report(p_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer, p_month integer DEFAULT (EXTRACT(month FROM CURRENT_DATE))::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date := make_date(p_year, p_month, 1);
  v_end_date date := (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::date;
  v_prev_start date := v_start_date - INTERVAL '1 month';
  v_prev_end date := v_start_date - INTERVAL '1 day';
BEGIN
  RETURN jsonb_build_object(
    'period', jsonb_build_object(
      'year', p_year,
      'month', p_month,
      'start_date', v_start_date,
      'end_date', v_end_date
    ),
    
    'current_month', jsonb_build_object(
      'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN v_start_date AND v_end_date AND deleted_at IS NULL),
      'new_contacts', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN v_start_date AND v_end_date AND deleted_at IS NULL),
      'total_interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao::date BETWEEN v_start_date AND v_end_date),
      'deals_created', (SELECT COUNT(*) FROM deals WHERE created_at::date BETWEEN v_start_date AND v_end_date),
      'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN v_start_date AND v_end_date),
      'deals_lost', (SELECT COUNT(*) FROM deals WHERE status = 'perdido' AND closed_at::date BETWEEN v_start_date AND v_end_date),
      'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN v_start_date AND v_end_date),
      'proposals_sent', (SELECT COUNT(*) FROM proposals WHERE created_at::date BETWEEN v_start_date AND v_end_date)
    ),
    
    'previous_month', jsonb_build_object(
      'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN v_prev_start AND v_prev_end AND deleted_at IS NULL),
      'total_interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao::date BETWEEN v_prev_start AND v_prev_end),
      'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN v_prev_start AND v_prev_end),
      'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN v_prev_start AND v_prev_end)
    ),
    
    'totals', jsonb_build_object(
      'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'active_customers', (SELECT COUNT(*) FROM companies WHERE is_customer = true AND deleted_at IS NULL),
      'total_contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'open_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')),
      'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado'))
    ),
    
    'top_performers', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          p.id,
          COALESCE(p.full_name, p.email) as name,
          COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'ganho') as deals_won,
          COALESCE(SUM(d.valor) FILTER (WHERE d.status = 'ganho'), 0) as revenue
        FROM profiles p
        LEFT JOIN deals d ON d.user_id = p.id AND d.closed_at::date BETWEEN v_start_date AND v_end_date
        WHERE p.is_active = true
        GROUP BY p.id, p.full_name, p.email
        ORDER BY revenue DESC
        LIMIT 5
      ) t
    ),
    
    'generated_at', NOW()
  );
END;
$function$
