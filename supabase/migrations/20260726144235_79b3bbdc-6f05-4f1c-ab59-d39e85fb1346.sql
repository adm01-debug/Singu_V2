-- ============================================================
-- Rodada 63/10 — rpc_plan_snapshots (auto-EXPLAIN + diff)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rpc_plan_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rpc_name text NOT NULL,
  plan jsonb NOT NULL,
  plan_hash text NOT NULL,
  total_cost numeric,
  execution_ms numeric,
  reason text NOT NULL DEFAULT 'scheduled',
  captured_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rpc_plan_snapshots TO authenticated;
GRANT ALL ON public.rpc_plan_snapshots TO service_role;

ALTER TABLE public.rpc_plan_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_rpc_plan_snapshots" ON public.rpc_plan_snapshots;
CREATE POLICY "admins_read_rpc_plan_snapshots"
  ON public.rpc_plan_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "service_role_writes_rpc_plan_snapshots" ON public.rpc_plan_snapshots;
CREATE POLICY "service_role_writes_rpc_plan_snapshots"
  ON public.rpc_plan_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rpc_plan_snapshots_name_time
  ON public.rpc_plan_snapshots (rpc_name, captured_at DESC);

-- ------------------------------------------------------------
-- Captura de plano (allowlist rígida — sem SQL dinâmico do usuário)
-- ------------------------------------------------------------
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

  BEGIN
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || v_stmt INTO v_plan;
  EXCEPTION WHEN OTHERS THEN
    -- nunca deixa a captura derrubar o chamador
    RETURN NULL;
  END;

  v_cost := (v_plan -> 0 -> 'Plan' ->> 'Total Cost')::numeric;
  v_ms   := (v_plan -> 0 ->> 'Execution Time')::numeric;
  -- hash estrutural: ignora tempos/linhas variáveis
  v_hash := md5(
    regexp_replace(v_plan::text, '"(Actual [^"]*|Execution Time|Planning Time|Shared [^"]*)": *[0-9.]+', '', 'g')
  );

  SELECT plan_hash INTO v_last_hash
  FROM public.rpc_plan_snapshots
  WHERE rpc_name = _rpc_name
  ORDER BY captured_at DESC
  LIMIT 1;

  IF v_last_hash IS NOT DISTINCT FROM v_hash AND _reason = 'scheduled' THEN
    RETURN NULL; -- plano inalterado, evita bloat
  END IF;

  INSERT INTO public.rpc_plan_snapshots (rpc_name, plan, plan_hash, total_cost, execution_ms, reason)
  VALUES (_rpc_name, v_plan, v_hash, v_cost, v_ms, COALESCE(_reason, 'scheduled'))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_rpc_plan(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_rpc_plan(text, text) TO service_role;

-- ------------------------------------------------------------
-- Varredura: captura plano das RPCs atualmente degradadas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_degraded_rpc_plans()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r        record;
  v_count  integer := 0;
BEGIN
  FOR r IN
    SELECT rpc_name FROM public.get_slow_rpc_trend(1, 24, 20) WHERE is_degraded
  LOOP
    IF public.capture_rpc_plan(r.rpc_name, 'degradation') IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  DELETE FROM public.rpc_plan_snapshots WHERE captured_at < now() - interval '30 days';
  RETURN v_count;
EXCEPTION WHEN OTHERS THEN
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_degraded_rpc_plans() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_degraded_rpc_plans() TO service_role;

-- ------------------------------------------------------------
-- Leitura para o painel admin
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_rpc_plan_snapshots(_rpc_name text DEFAULT NULL, _limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  rpc_name text,
  plan_hash text,
  total_cost numeric,
  execution_ms numeric,
  reason text,
  captured_at timestamptz,
  plan_changed boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.id, s.rpc_name, s.plan_hash, s.total_cost, s.execution_ms, s.reason, s.captured_at,
         s.plan_hash IS DISTINCT FROM lag(s.plan_hash) OVER (PARTITION BY s.rpc_name ORDER BY s.captured_at) AS plan_changed
  FROM public.rpc_plan_snapshots s
  WHERE (_rpc_name IS NULL OR s.rpc_name = _rpc_name)
  ORDER BY s.captured_at DESC
  LIMIT LEAST(COALESCE(_limit, 20), 200);
$$;

REVOKE ALL ON FUNCTION public.get_rpc_plan_snapshots(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rpc_plan_snapshots(text, integer) TO authenticated, service_role;
