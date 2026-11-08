CREATE OR REPLACE FUNCTION public.get_rpc_perf_stats(_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(row_to_json(s) ORDER BY s.samples DESC)
    INTO _result
    FROM (
      SELECT rpc_name,
             COUNT(*)::int AS samples,
             ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 1) AS p50_ms,
             ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 1) AS p95_ms,
             ROUND((percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms))::numeric, 1) AS p99_ms,
             ROUND(MAX(duration_ms), 1) AS max_ms,
             ROUND(AVG(duration_ms), 1) AS avg_ms,
             MAX(created_at) AS last_seen
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - make_interval(hours => _hours)
       GROUP BY rpc_name
    ) s;

  RETURN jsonb_build_object(
    'window_hours', _hours,
    'stats', COALESCE(_result, '[]'::jsonb),
    'generated_at', now()
  );
END;
$function$
