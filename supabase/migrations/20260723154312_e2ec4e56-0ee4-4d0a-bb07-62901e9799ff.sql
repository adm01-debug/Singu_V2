
CREATE OR REPLACE FUNCTION public.get_ai_gateway_partition_stats()
RETURNS TABLE (
  partition_name text,
  range_start    timestamptz,
  range_end      timestamptz,
  estimated_rows bigint,
  total_bytes    bigint,
  min_created_at timestamptz,
  max_created_at timestamptz,
  is_current     boolean,
  is_future      boolean,
  is_expiring    boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  bounds text;
  s timestamptz;
  e timestamptz;
  min_ts timestamptz;
  max_ts timestamptz;
  cutoff timestamptz := now() - interval '90 days';
  now_ts timestamptz := now();
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
    bounds := pg_get_expr(
      (SELECT relpartbound FROM pg_class WHERE oid = rec.oid), rec.oid
    );
    -- Expected shape: FOR VALUES FROM ('YYYY-MM-DD ...') TO ('YYYY-MM-DD ...')
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
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_gateway_partition_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_gateway_partition_stats() TO authenticated;
