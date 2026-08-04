CREATE OR REPLACE FUNCTION public.capture_rpc_plan(_rpc_name text, _reason text DEFAULT 'scheduled')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stmt      text;
  v_plan      jsonb;
  v_hash      text;
  v_last_hash text;
  v_cost      numeric;
  v_ms        numeric;
  v_id        uuid;
BEGIN
  v_stmt := CASE _rpc_name
    WHEN 'get_ai_gateway_health'          THEN 'SELECT * FROM public.get_ai_gateway_health()'
    WHEN 'get_ai_gateway_partition_stats' THEN 'SELECT * FROM public.get_ai_gateway_partition_stats()'
    WHEN 'get_rpc_perf_stats'             THEN 'SELECT * FROM public.get_rpc_perf_stats()'
    WHEN 'get_top_slow_rpcs'              THEN 'SELECT * FROM public.get_top_slow_rpcs()'
    WHEN 'get_slow_rpc_trend'             THEN 'SELECT * FROM public.get_slow_rpc_trend()'
    ELSE NULL
  END;

  IF v_stmt IS NULL THEN
    RAISE EXCEPTION 'RPC % nao esta na allowlist de captura de plano', _rpc_name
      USING ERRCODE = '22023';
  END IF;

  -- 1) tenta plano real (ANALYZE). Rotinas admin-only falham fora de sessao admin.
  BEGIN
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || v_stmt INTO v_plan;
  EXCEPTION WHEN OTHERS THEN
    v_plan := NULL;
    RAISE WARNING 'capture_rpc_plan(%): EXPLAIN ANALYZE falhou (%), caindo para plano estimado',
      _rpc_name, SQLERRM;
  END;

  -- 2) fallback: plano estimado (nao executa a funcao)
  IF v_plan IS NULL THEN
    BEGIN
      EXECUTE 'EXPLAIN (FORMAT JSON) ' || v_stmt INTO v_plan;
      _reason := COALESCE(_reason, 'scheduled') || '+estimated';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'capture_rpc_plan(%): EXPLAIN falhou (%)', _rpc_name, SQLERRM;
      RETURN NULL;
    END;
  END IF;

  v_cost := (v_plan -> 0 -> 'Plan' ->> 'Total Cost')::numeric;
  v_ms   := (v_plan -> 0 ->> 'Execution Time')::numeric;
  v_hash := md5(
    regexp_replace(v_plan::text, '"(Actual [^"]*|Execution Time|Planning Time|Shared [^"]*)": *[0-9.]+', '', 'g')
  );

  SELECT plan_hash INTO v_last_hash
  FROM public.rpc_plan_snapshots
  WHERE rpc_name = _rpc_name
  ORDER BY captured_at DESC
  LIMIT 1;

  IF v_last_hash IS NOT DISTINCT FROM v_hash AND _reason LIKE 'scheduled%' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.rpc_plan_snapshots (rpc_name, plan, plan_hash, total_cost, execution_ms, reason)
  VALUES (_rpc_name, v_plan, v_hash, v_cost, v_ms, COALESCE(_reason, 'scheduled'))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_rpc_plan(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_rpc_plan(text, text) TO service_role;
