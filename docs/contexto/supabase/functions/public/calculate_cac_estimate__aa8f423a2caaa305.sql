CREATE OR REPLACE FUNCTION public.calculate_cac_estimate(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_interactions int; v_new_customers int; v_revenue numeric;
BEGIN
  SELECT COUNT(*) INTO v_interactions FROM interactions WHERE data_interacao >= NOW() - (p_days || ' days')::interval;
  SELECT COUNT(DISTINCT company_id) INTO v_new_customers FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval;
  SELECT COALESCE(SUM(valor), 0) INTO v_revenue FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval;
  
  RETURN jsonb_build_object(
    'period_days', p_days,
    'interactions', v_interactions,
    'new_customers', v_new_customers,
    'revenue', v_revenue,
    'effort_per_customer', ROUND(v_interactions::numeric / NULLIF(v_new_customers, 0), 1),
    'avg_ticket', ROUND(v_revenue / NULLIF(v_new_customers, 0), 2)
  );
END;
$function$
