CREATE OR REPLACE FUNCTION public.compare_periods(p_metric text, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_current numeric; v_previous numeric; v_change numeric;
BEGIN
  IF p_metric = 'revenue' THEN
    SELECT COALESCE(SUM(valor), 0) INTO v_current FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval;
    SELECT COALESCE(SUM(valor), 0) INTO v_previous FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days * 2 || ' days')::interval AND closed_at < NOW() - (p_days || ' days')::interval;
  ELSIF p_metric = 'deals' THEN
    SELECT COUNT(*) INTO v_current FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval;
    SELECT COUNT(*) INTO v_previous FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days * 2 || ' days')::interval AND closed_at < NOW() - (p_days || ' days')::interval;
  ELSIF p_metric = 'interactions' THEN
    SELECT COUNT(*) INTO v_current FROM interactions WHERE data_interacao >= NOW() - (p_days || ' days')::interval;
    SELECT COUNT(*) INTO v_previous FROM interactions WHERE data_interacao >= NOW() - (p_days * 2 || ' days')::interval AND data_interacao < NOW() - (p_days || ' days')::interval;
  ELSIF p_metric = 'leads' THEN
    SELECT COUNT(*) INTO v_current FROM companies WHERE created_at >= NOW() - (p_days || ' days')::interval AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_previous FROM companies WHERE created_at >= NOW() - (p_days * 2 || ' days')::interval AND created_at < NOW() - (p_days || ' days')::interval AND deleted_at IS NULL;
  END IF;
  
  v_change := ROUND((v_current - v_previous) / NULLIF(v_previous, 0) * 100, 1);
  
  RETURN jsonb_build_object(
    'metric', p_metric, 'period_days', p_days,
    'current', v_current, 'previous', v_previous,
    'change_pct', v_change,
    'trend', CASE WHEN v_change > 0 THEN 'up' WHEN v_change < 0 THEN 'down' ELSE 'stable' END
  );
END;
$function$
