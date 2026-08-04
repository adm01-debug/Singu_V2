
-- Instrument get_ai_gateway_partition_stats
CREATE OR REPLACE FUNCTION public.get_ai_gateway_partition_stats()
RETURNS TABLE(partition_name text, range_start timestamptz, range_end timestamptz, estimated_rows bigint, total_bytes bigint, min_created_at timestamptz, max_created_at timestamptz, is_current boolean, is_future boolean, is_expiring boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
  bounds text;
  s timestamptz;
  e timestamptz;
  min_ts timestamptz;
  max_ts timestamptz;
  cutoff timestamptz := now() - interval '90 days';
  now_ts timestamptz := now();
  _t0 timestamptz := clock_timestamp();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  FOR rec IN
    SELECT c.oid, c.relname
    FROM pg_inherits i
    JOIN pg_class c  ON c.oid = i.inhrelid
    JOIN pg_class p  ON p.oid = i.inhparent
    JOIN pg_namespace np ON np.oid = p.relnamespace
    WHERE np.nspname = 'public' AND p.relname = 'ai_gateway_metrics'
    ORDER BY c.relname
  LOOP
    bounds := pg_get_expr((SELECT relpartbound FROM pg_class WHERE oid = rec.oid), rec.oid);
    s := (regexp_match(bounds, 'FROM \(''([^'']+)''\)'))[1]::timestamptz;
    e := (regexp_match(bounds, 'TO \(''([^'']+)''\)'))[1]::timestamptz;

    EXECUTE format('SELECT min(created_at), max(created_at) FROM public.%I', rec.relname)
      INTO min_ts, max_ts;

    partition_name := rec.relname;
    range_start    := s;
    range_end      := e;
    estimated_rows := (SELECT c.reltuples::bigint FROM pg_class c WHERE c.oid = rec.oid);
    total_bytes    := pg_total_relation_size(rec.oid);
    min_created_at := min_ts;
    max_created_at := max_ts;
    is_current     := (now_ts >= s AND now_ts < e);
    is_future      := (s > now_ts);
    is_expiring    := (e <= cutoff);
    RETURN NEXT;
  END LOOP;

  PERFORM public.record_rpc_perf_sample(
    'get_ai_gateway_partition_stats',
    EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000.0
  );
END;
$function$;

-- Auto-instrument get_rpc_perf_stats itself
CREATE OR REPLACE FUNCTION public.get_rpc_perf_stats(_hours INTEGER DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _since TIMESTAMPTZ := now() - make_interval(hours => _hours);
  _result jsonb;
  _t0 timestamptz := clock_timestamp();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(row_to_json(s) ORDER BY s.samples DESC)
  INTO _result
  FROM (
    SELECT
      rpc_name,
      COUNT(*)::int AS samples,
      ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p50_ms,
      ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p95_ms,
      ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p99_ms,
      ROUND(MAX(duration_ms)::numeric, 1) AS max_ms,
      ROUND(AVG(duration_ms)::numeric, 1) AS avg_ms,
      MAX(created_at) AS last_seen
    FROM public.rpc_perf_samples
    WHERE created_at >= _since
    GROUP BY rpc_name
  ) s;

  PERFORM public.record_rpc_perf_sample(
    'get_rpc_perf_stats',
    EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000.0
  );

  RETURN jsonb_build_object(
    'window_hours', _hours,
    'stats', COALESCE(_result, '[]'::jsonb),
    'generated_at', now()
  );
END;
$$;

-- Top slow RPCs helper (used by future dashboards / prometheus recording rules)
CREATE OR REPLACE FUNCTION public.get_top_slow_rpcs(_hours INTEGER DEFAULT 24, _limit INTEGER DEFAULT 5)
RETURNS TABLE(rpc_name TEXT, samples INT, p95_ms NUMERIC, p99_ms NUMERIC, max_ms NUMERIC)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.rpc_name,
    COUNT(*)::int AS samples,
    ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms)::numeric, 1) AS p95_ms,
    ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY s.duration_ms)::numeric, 1) AS p99_ms,
    ROUND(MAX(s.duration_ms)::numeric, 1) AS max_ms
  FROM public.rpc_perf_samples s
  WHERE s.created_at >= now() - make_interval(hours => _hours)
  GROUP BY s.rpc_name
  HAVING COUNT(*) >= 3
  ORDER BY percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms) DESC
  LIMIT COALESCE(_limit, 5);
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_slow_rpcs(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_slow_rpcs(INTEGER, INTEGER) TO authenticated;
