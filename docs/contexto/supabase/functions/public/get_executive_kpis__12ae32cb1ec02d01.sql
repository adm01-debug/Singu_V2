CREATE OR REPLACE FUNCTION public.get_executive_kpis()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
    'total_customers', (SELECT COUNT(*) FROM companies WHERE is_customer = true AND deleted_at IS NULL),
    'total_contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
    'total_deals_open', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'revenue_mtd', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
    'revenue_ytd', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('year', NOW())),
    'deals_won_mtd', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
    'interactions_mtd', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', NOW())),
    'avg_deal_cycle_days', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1) FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - interval '90 days'),
    'win_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE closed_at >= NOW() - interval '90 days'),
    'active_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true),
    'updated_at', NOW()
  ) INTO v_result;
  RETURN v_result;
END;
$function$
