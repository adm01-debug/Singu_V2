CREATE OR REPLACE FUNCTION public.get_executive_report(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'period_days', p_days,
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'deals_lost', (SELECT COUNT(*) FROM deals WHERE status = 'perdido' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at >= NOW() - (p_days || ' days')::interval AND deleted_at IS NULL),
    'total_interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= NOW() - (p_days || ' days')::interval),
    'avg_deal_value', (SELECT ROUND(AVG(valor), 2) FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'generated_at', NOW()
  ) INTO v_result;
  RETURN v_result;
END;
$function$
