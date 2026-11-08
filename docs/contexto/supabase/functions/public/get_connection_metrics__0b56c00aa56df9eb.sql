CREATE OR REPLACE FUNCTION public.get_connection_metrics(_connection_id uuid)
 RETURNS TABLE(p50 numeric, p95 numeric, p99 numeric, success_rate numeric, total_calls bigint, failures bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p50,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p95,
    COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p99,
    CASE WHEN COUNT(*) = 0 THEN 100::NUMERIC
         ELSE ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC * 100) / COUNT(*), 2)
    END AS success_rate,
    COUNT(*)::BIGINT AS total_calls,
    COUNT(*) FILTER (WHERE status = 'error')::BIGINT AS failures
  FROM public.connection_test_logs
  WHERE connection_id = _connection_id
    AND created_at >= now() - interval '7 days';
END;
$function$
