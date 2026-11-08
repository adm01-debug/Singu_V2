CREATE OR REPLACE FUNCTION public.capture_rpc_plan(_rpc_name text, _reason text DEFAULT 'scheduled'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stmt      text;
  v_plan      jsonb;
  v_hash      text;
  v_last_hash text;
  v_inventory text;
  v_last_inventory text;
  v_new_inventory boolean := false;
  v_id        uuid;
BEGIN
  -- EXPLAIN de uma função plpgsql só mostra "Function Scan": explica a consulta principal de cada RPC
  v_stmt := CASE _rpc_name
    WHEN 'get_ai_gateway_health' THEN $q$
      SELECT function_name, model, status, duration_ms, tokens_in, tokens_out, created_at
        FROM public.ai_gateway_metrics
       WHERE created_at >= now() - interval '24 hours'$q$
    -- a RPC lê min/max de cada partição: esse é o custo que degrada, não a listagem do catálogo
    WHEN 'get_ai_gateway_partition_stats' THEN COALESCE(
      (SELECT string_agg(format('SELECT %L::text AS partition_name, min(created_at), max(created_at) FROM public.%I',
                                c.relname, c.relname), ' UNION ALL ' ORDER BY c.relname)
         FROM pg_inherits i
         JOIN pg_class c ON c.oid = i.inhrelid
        WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass),
      $q$
      SELECT c.oid, c.relname, pg_get_expr(c.relpartbound, c.oid)
        FROM pg_inherits i
        JOIN pg_class c ON c.oid = i.inhrelid
       WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass$q$)
    WHEN 'get_rpc_perf_stats' THEN $q$
      SELECT rpc_name, COUNT(*), percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), MAX(created_at)
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - interval '24 hours'
       GROUP BY rpc_name$q$
    WHEN 'get_top_slow_rpcs' THEN $q$
      SELECT rpc_name, COUNT(*), percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - interval '24 hours'
       GROUP BY rpc_name
      HAVING COUNT(*) >= 3
       ORDER BY p95 DESC
       LIMIT 5$q$
    WHEN 'get_slow_rpc_trend' THEN $q$
      SELECT rpc_name, COUNT(*), percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - interval '24 hours'
         AND created_at <  now() - interval '1 hour'
       GROUP BY rpc_name$q$
    ELSE NULL
  END;

  IF v_stmt IS NULL THEN
    RAISE EXCEPTION 'RPC % nao esta na allowlist de captura de plano', _rpc_name
      USING ERRCODE = '22023';
  END IF;

  _reason := COALESCE(_reason, 'scheduled');

  BEGIN
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || v_stmt INTO v_plan;
  EXCEPTION WHEN OTHERS THEN
    v_plan := NULL;
  END;

  IF v_plan IS NULL THEN
    BEGIN
      EXECUTE 'EXPLAIN (FORMAT JSON) ' || v_stmt INTO v_plan;
      _reason := _reason || '+estimated';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'capture_rpc_plan(%): EXPLAIN falhou (%)', _rpc_name, SQLERRM;
      RETURN NULL;
    END;
  END IF;

  v_hash := md5(public.rpc_plan_structure(v_plan -> 0 -> 'Plan')::text);

  IF _rpc_name = 'get_ai_gateway_partition_stats' THEN
    v_inventory := md5(v_stmt);
    v_plan := jsonb_set(v_plan, '{0,Partition Inventory}', to_jsonb(v_inventory));
  END IF;

  SELECT plan_hash, plan -> 0 ->> 'Partition Inventory' INTO v_last_hash, v_last_inventory
    FROM public.rpc_plan_snapshots
   WHERE rpc_name = _rpc_name
   ORDER BY captured_at DESC, id DESC
   LIMIT 1;

  v_new_inventory := _rpc_name = 'get_ai_gateway_partition_stats'
    AND v_inventory IS DISTINCT FROM v_last_inventory;
  IF v_last_hash IS NOT DISTINCT FROM v_hash AND NOT v_new_inventory THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.rpc_plan_snapshots (rpc_name, plan, plan_hash, total_cost, execution_ms, reason)
  VALUES (_rpc_name, v_plan, v_hash,
          (v_plan -> 0 -> 'Plan' ->> 'Total Cost')::numeric,
          (v_plan -> 0 ->> 'Execution Time')::numeric,
          CASE WHEN v_new_inventory THEN 'baseline' ELSE _reason END)
  RETURNING id INTO v_id;

  IF v_new_inventory THEN
    UPDATE public.rpc_plan_snapshots SET plan_changed = false WHERE id = v_id;
  END IF;
  RETURN v_id;
END;
$function$
