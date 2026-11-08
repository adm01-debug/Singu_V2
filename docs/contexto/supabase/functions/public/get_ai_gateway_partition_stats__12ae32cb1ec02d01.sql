CREATE OR REPLACE FUNCTION public.get_ai_gateway_partition_stats()
 RETURNS TABLE(partition_name text, range_start timestamp with time zone, range_end timestamp with time zone, estimated_rows bigint, total_bytes bigint, min_created_at timestamp with time zone, max_created_at timestamp with time zone, is_current boolean, is_future boolean, is_expiring boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec    record;
  bounds text;
  s      timestamptz;
  e      timestamptz;
  cutoff timestamptz := now() - interval '90 days';
  now_ts timestamptz := now();
  _t0    timestamptz := clock_timestamp();
BEGIN
  IF NOT (current_setting('role') IN ('postgres', 'service_role')
          OR (current_setting('role') = 'none' AND session_user = 'postgres'))
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  FOR rec IN
    SELECT c.oid, c.relname
      FROM pg_inherits i
      JOIN pg_class c ON c.oid = i.inhrelid
     WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass
     ORDER BY c.relname
  LOOP
    bounds := pg_get_expr((SELECT relpartbound FROM pg_class WHERE oid = rec.oid), rec.oid);
    s := (regexp_match(bounds, 'FROM \(''([^'']+)''\)'))[1]::timestamptz;
    e := (regexp_match(bounds, 'TO \(''([^'']+)''\)'))[1]::timestamptz;

    EXECUTE format('SELECT min(created_at), max(created_at) FROM public.%I', rec.relname)
      INTO min_created_at, max_created_at;

    partition_name := rec.relname;
    range_start    := s;
    range_end      := e;
    estimated_rows := GREATEST((SELECT c.reltuples::bigint FROM pg_class c WHERE c.oid = rec.oid), 0);
    total_bytes    := pg_total_relation_size(rec.oid);
    is_current     := (now_ts >= s AND now_ts < e);
    is_future      := (s > now_ts);
    is_expiring    := (e <= cutoff);
    RETURN NEXT;
  END LOOP;

  PERFORM public.record_rpc_perf_sample(
    'get_ai_gateway_partition_stats', EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000.0
  );
END;
$function$
