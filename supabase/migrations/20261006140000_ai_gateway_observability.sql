-- Observabilidade do AI Gateway e das RPCs admin no banco canônico.
-- Consolida as migrations 20260723152549..20260726154947 (nunca aplicadas aqui) no estado
-- final, alinhado às colunas que as edge functions gravam (status, http_status, duration_ms,
-- error_message) e aos campos que o painel admin lê (dow ISO 1..7, computed_at).

-- 1) Métricas do AI Gateway (particionada por mês)
CREATE TABLE IF NOT EXISTS public.ai_gateway_metrics (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  function_name text        NOT NULL,
  model         text,
  status        text        NOT NULL,
  http_status   integer,
  duration_ms   integer     NOT NULL,
  tokens_in     integer,
  tokens_out    integer,
  error_code    text,
  error_message text,
  user_id       uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at),
  CHECK (duration_ms >= 0),
  CHECK (status IN ('success','error','rate_limited','timeout'))
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_ai_gateway_metrics_created
  ON public.ai_gateway_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_metrics_fn_created
  ON public.ai_gateway_metrics (function_name, created_at DESC);

REVOKE ALL ON public.ai_gateway_metrics FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_gateway_metrics TO service_role;
ALTER TABLE public.ai_gateway_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages ai_gateway_metrics" ON public.ai_gateway_metrics;
CREATE POLICY "Service role manages ai_gateway_metrics"
  ON public.ai_gateway_metrics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.ensure_ai_gateway_metrics_partition(target_month date DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_start   date := date_trunc('month', COALESCE(target_month, (now() + interval '1 month')::date))::date;
  m_end     date;
  part_name text;
BEGIN
  m_end := (m_start + interval '1 month')::date;
  part_name := format('ai_gateway_metrics_%s', to_char(m_start, 'YYYY_MM'));

  IF to_regclass(format('public.%I', part_name)) IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)',
      part_name, m_start, m_end
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', part_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', part_name);
  END IF;

  RETURN part_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.drop_old_ai_gateway_metrics_partitions(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff   date := (now() - make_interval(days => retention_days))::date;
  rec      record;
  dropped  integer := 0;
  part_end date;
BEGIN
  FOR rec IN
    SELECT c.relname
      FROM pg_inherits i
      JOIN pg_class c ON c.oid = i.inhrelid
     WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass
  LOOP
    BEGIN
      part_end := (to_date(substring(rec.relname from 'ai_gateway_metrics_(\d{4}_\d{2})'), 'YYYY_MM')
                   + interval '1 month')::date;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    IF part_end < cutoff THEN
      EXECUTE format('DROP TABLE IF EXISTS public.%I', rec.relname);
      dropped := dropped + 1;
    END IF;
  END LOOP;

  RETURN dropped;
END;
$$;

DO $$
DECLARE i int;
BEGIN
  FOR i IN -3..3 LOOP
    PERFORM public.ensure_ai_gateway_metrics_partition((date_trunc('month', now()) + make_interval(months => i))::date);
  END LOOP;
END $$;

-- 2) Amostras de latência das RPCs admin
CREATE TABLE IF NOT EXISTS public.rpc_perf_samples (
  id          bigserial   PRIMARY KEY,
  rpc_name    text        NOT NULL,
  duration_ms numeric     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rpc_perf_samples_name_time_idx
  ON public.rpc_perf_samples (rpc_name, created_at DESC);

REVOKE ALL ON public.rpc_perf_samples FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.rpc_perf_samples_id_seq FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.rpc_perf_samples TO authenticated;
GRANT ALL ON public.rpc_perf_samples TO service_role;
ALTER TABLE public.rpc_perf_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read perf samples" ON public.rpc_perf_samples;
CREATE POLICY "Admins read perf samples"
  ON public.rpc_perf_samples FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.record_rpc_perf_sample(_rpc_name text, _duration_ms numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rpc_perf_samples (rpc_name, duration_ms) VALUES (_rpc_name, _duration_ms);
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_rpc_perf_samples()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rpc_perf_samples WHERE created_at < now() - interval '7 days';
END;
$$;

-- 3) Saúde do AI Gateway (admin; service_role/postgres para jobs e testes)
CREATE OR REPLACE FUNCTION public.get_ai_gateway_health(_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since  timestamptz := now() - make_interval(hours => _hours);
  _t0     timestamptz := clock_timestamp();
  _result jsonb;
BEGIN
  IF current_setting('role') NOT IN ('postgres', 'service_role')
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT function_name, model, status, duration_ms, tokens_in, tokens_out, created_at,
           (status <> 'success') AS is_error,
           (created_at AT TIME ZONE 'America/Sao_Paulo') AS local_ts
      FROM public.ai_gateway_metrics
     WHERE created_at >= _since
  ),
  totals AS (
    SELECT COUNT(*)::int AS requests,
           COUNT(*) FILTER (WHERE is_error)::int AS errors,
           ROUND(COUNT(*) FILTER (WHERE is_error)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS error_rate_pct,
           ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p50_ms,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p95_ms,
           ROUND((percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p99_ms,
           COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
           COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out
      FROM base
  ),
  by_function AS (
    SELECT jsonb_agg(row_to_json(f) ORDER BY f.requests DESC) AS data
      FROM (
        SELECT function_name,
               COUNT(*)::int AS requests,
               COUNT(*) FILTER (WHERE is_error)::int AS errors,
               ROUND(COUNT(*) FILTER (WHERE is_error)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS error_rate_pct,
               ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p50_ms,
               ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p95_ms,
               MAX(created_at) AS last_seen
          FROM base GROUP BY function_name
      ) f
  ),
  by_model AS (
    SELECT jsonb_agg(row_to_json(m) ORDER BY m.requests DESC) AS data
      FROM (
        SELECT COALESCE(model, 'unknown') AS model,
               COUNT(*)::int AS requests,
               COUNT(*) FILTER (WHERE is_error)::int AS errors,
               ROUND(COUNT(*) FILTER (WHERE is_error)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS error_rate_pct,
               ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p50_ms,
               ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p95_ms,
               COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
               COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out
          FROM base GROUP BY COALESCE(model, 'unknown')
      ) m
  ),
  active_alerts AS (
    SELECT jsonb_agg(row_to_json(a) ORDER BY a.created_at DESC) AS data
      FROM (
        SELECT id, alert_type, severity, message, metadata, created_at
          FROM public.system_alerts
         WHERE alert_type LIKE 'ai_gateway_%'
           AND acknowledged_at IS NULL
           AND created_at >= now() - interval '2 hours'
         ORDER BY created_at DESC
         LIMIT 20
      ) a
  ),
  resolved_recent AS (
    SELECT jsonb_agg(row_to_json(r) ORDER BY r.acknowledged_at DESC) AS data
      FROM (
        SELECT id, alert_type, severity, message, created_at, acknowledged_at,
               ROUND(EXTRACT(EPOCH FROM (acknowledged_at - created_at))::numeric / 60.0, 1) AS mttr_minutes,
               (metadata->>'auto_resolved')::boolean AS auto_resolved
          FROM public.system_alerts
         WHERE alert_type LIKE 'ai_gateway_%'
           AND acknowledged_at >= now() - interval '24 hours'
         ORDER BY acknowledged_at DESC
         LIMIT 10
      ) r
  ),
  resolved_mttr AS (
    SELECT jsonb_agg(row_to_json(mt) ORDER BY mt.alert_type) AS data
      FROM (
        SELECT alert_type,
               COUNT(*)::int AS resolved_count,
               ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS avg_mttr_minutes,
               ROUND(MAX(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS max_mttr_minutes
          FROM public.system_alerts
         WHERE alert_type LIKE 'ai_gateway_%'
           AND acknowledged_at >= now() - interval '24 hours'
         GROUP BY alert_type
      ) mt
  ),
  heatmap_raw AS (
    SELECT EXTRACT(ISODOW FROM local_ts)::int AS dow,
           EXTRACT(HOUR FROM local_ts)::int AS hour,
           COUNT(*)::int AS requests,
           COUNT(*) FILTER (WHERE is_error)::int AS errors
      FROM base
     GROUP BY 1, 2
  ),
  heatmap AS (
    SELECT jsonb_agg(row_to_json(h) ORDER BY h.dow, h.hour) AS data
      FROM (
        SELECT dow, hour, requests, errors,
               ROUND(errors::numeric / NULLIF(requests, 0) * 100, 2) AS error_rate_pct
          FROM heatmap_raw
      ) h
  ),
  worst_windows AS (
    SELECT jsonb_agg(row_to_json(w) ORDER BY w.error_rate_pct DESC) AS data
      FROM (
        SELECT dow, hour, requests, errors,
               ROUND(errors::numeric / NULLIF(requests, 0) * 100, 2) AS error_rate_pct
          FROM heatmap_raw
         WHERE requests >= 5
         ORDER BY errors::numeric / NULLIF(requests, 0) DESC NULLS LAST
         LIMIT 3
      ) w
  )
  SELECT jsonb_build_object(
           'window_hours', _hours,
           'totals', (SELECT row_to_json(totals) FROM totals),
           'by_function', COALESCE((SELECT data FROM by_function), '[]'::jsonb),
           'by_model', COALESCE((SELECT data FROM by_model), '[]'::jsonb),
           'active_alerts', COALESCE((SELECT data FROM active_alerts), '[]'::jsonb),
           'resolved_recent', COALESCE((SELECT data FROM resolved_recent), '[]'::jsonb),
           'resolved_mttr', COALESCE((SELECT data FROM resolved_mttr), '[]'::jsonb),
           'error_heatmap', COALESCE((SELECT data FROM heatmap), '[]'::jsonb),
           'worst_windows', COALESCE((SELECT data FROM worst_windows), '[]'::jsonb),
           'computed_at', now()
         )
    INTO _result;

  PERFORM public.record_rpc_perf_sample(
    'get_ai_gateway_health', EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000.0
  );
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_gateway_partition_stats()
RETURNS TABLE(partition_name text, range_start timestamptz, range_end timestamptz, estimated_rows bigint,
              total_bytes bigint, min_created_at timestamptz, max_created_at timestamptz,
              is_current boolean, is_future boolean, is_expiring boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec    record;
  bounds text;
  s      timestamptz;
  e      timestamptz;
  cutoff timestamptz := now() - interval '90 days';
  now_ts timestamptz := now();
  _t0    timestamptz := clock_timestamp();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
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
$$;

-- 4) Alertas automáticos do AI Gateway (system_alerts)
CREATE OR REPLACE FUNCTION public.evaluate_ai_gateway_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dedup_window   timestamptz := now() - interval '2 hours';
  _requests       integer;
  _errors         integer;
  _error_rate     numeric;
  _p95            numeric;
  _severity       text;
  _alerts_created integer := 0;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status <> 'success'),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
    INTO _requests, _errors, _p95
    FROM public.ai_gateway_metrics
   WHERE created_at >= now() - interval '15 minutes';

  IF _requests IS NULL OR _requests < 20 THEN
    RETURN 0;
  END IF;

  _error_rate := ROUND(_errors::numeric / NULLIF(_requests, 0) * 100, 2);

  IF _error_rate >= 5 AND NOT EXISTS (
    SELECT 1 FROM public.system_alerts
     WHERE alert_type = 'ai_gateway_error_rate' AND acknowledged_at IS NULL AND created_at >= _dedup_window
  ) THEN
    _severity := CASE WHEN _error_rate >= 10 THEN 'critical' ELSE 'high' END;
    INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
    VALUES ('ai_gateway_error_rate', _severity, 5, _error_rate,
            format('Taxa de erro do AI Gateway em %s%% nos últimos 15 min (%s/%s chamadas)', _error_rate, _errors, _requests),
            jsonb_build_object('requests', _requests, 'errors', _errors, 'window_minutes', 15));
    _alerts_created := _alerts_created + 1;
  END IF;

  IF _p95 >= 8000 AND NOT EXISTS (
    SELECT 1 FROM public.system_alerts
     WHERE alert_type = 'ai_gateway_latency_p95' AND acknowledged_at IS NULL AND created_at >= _dedup_window
  ) THEN
    _severity := CASE WHEN _p95 >= 15000 THEN 'critical' ELSE 'high' END;
    INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
    VALUES ('ai_gateway_latency_p95', _severity, 8000, _p95,
            format('Latência p95 do AI Gateway em %sms nos últimos 15 min (%s chamadas)', ROUND(_p95), _requests),
            jsonb_build_object('requests', _requests, 'p95_ms', ROUND(_p95), 'window_minutes', 15));
    _alerts_created := _alerts_created + 1;
  END IF;

  RETURN _alerts_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_resolve_ai_gateway_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requests   integer;
  _errors     integer;
  _error_rate numeric;
  _p95        numeric;
  _resolved   integer := 0;
  _n          integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status <> 'success'),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
    INTO _requests, _errors, _p95
    FROM public.ai_gateway_metrics
   WHERE created_at >= now() - interval '15 minutes';

  IF _requests IS NULL OR _requests < 20 THEN
    RETURN 0;
  END IF;

  _error_rate := ROUND(_errors::numeric / NULLIF(_requests, 0) * 100, 2);

  IF _error_rate < 3 THEN
    UPDATE public.system_alerts
       SET acknowledged_at = now(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'auto_resolved', true, 'resolved_at', now(),
             'recovery_error_rate_pct', _error_rate, 'recovery_requests', _requests)
     WHERE alert_type = 'ai_gateway_error_rate' AND acknowledged_at IS NULL;
    GET DIAGNOSTICS _n = ROW_COUNT;
    _resolved := _resolved + _n;
  END IF;

  IF _p95 < 6000 THEN
    UPDATE public.system_alerts
       SET acknowledged_at = now(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'auto_resolved', true, 'resolved_at', now(),
             'recovery_p95_ms', ROUND(_p95), 'recovery_requests', _requests)
     WHERE alert_type = 'ai_gateway_latency_p95' AND acknowledged_at IS NULL;
    GET DIAGNOSTICS _n = ROW_COUNT;
    _resolved := _resolved + _n;
  END IF;

  RETURN _resolved;
END;
$$;

-- 5) Leituras admin sob RLS (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.get_rpc_perf_stats(_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_top_slow_rpcs(_hours integer DEFAULT 24, _limit integer DEFAULT 5)
RETURNS TABLE(rpc_name text, samples int, p95_ms numeric, p99_ms numeric, max_ms numeric)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.rpc_name,
         COUNT(*)::int,
         ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 1),
         ROUND((percentile_cont(0.99) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 1),
         ROUND(MAX(s.duration_ms), 1)
    FROM public.rpc_perf_samples s
   WHERE s.created_at >= now() - make_interval(hours => _hours)
   GROUP BY s.rpc_name
  HAVING COUNT(*) >= 3
   ORDER BY percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms) DESC
   LIMIT COALESCE(_limit, 5);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_slow_rpc_trend(_hours_recent integer DEFAULT 1, _hours_baseline integer DEFAULT 24, _limit integer DEFAULT 5)
RETURNS TABLE(rpc_name text, samples_recent integer, samples_baseline integer, p95_recent_ms numeric,
              p95_baseline_ms numeric, ratio numeric, is_degraded boolean)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role')
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH recent AS (
    SELECT s.rpc_name, COUNT(*)::int AS samples,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 2) AS p95
      FROM public.rpc_perf_samples s
     WHERE s.created_at >= now() - make_interval(hours => _hours_recent)
     GROUP BY s.rpc_name
  ),
  baseline AS (
    SELECT s.rpc_name, COUNT(*)::int AS samples,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 2) AS p95
      FROM public.rpc_perf_samples s
     WHERE s.created_at >= now() - make_interval(hours => _hours_baseline)
       AND s.created_at <  now() - make_interval(hours => _hours_recent)
     GROUP BY s.rpc_name
  )
  SELECT COALESCE(r.rpc_name, b.rpc_name),
         COALESCE(r.samples, 0),
         COALESCE(b.samples, 0),
         COALESCE(r.p95, 0),
         COALESCE(b.p95, 0),
         CASE WHEN COALESCE(b.p95, 0) > 0 THEN ROUND(COALESCE(r.p95, 0) / b.p95, 2) END,
         (COALESCE(r.samples, 0) >= 3 AND COALESCE(b.samples, 0) >= 3 AND COALESCE(b.p95, 0) > 0 AND COALESCE(r.p95, 0) / b.p95 >= 1.5)
    FROM recent r
    FULL OUTER JOIN baseline b USING (rpc_name)
   ORDER BY 7 DESC, 4 DESC NULLS LAST
   LIMIT _limit;
END;
$$;

-- 6) Snapshots de plano (captura, diff e churn do painel admin)
CREATE TABLE IF NOT EXISTS public.rpc_plan_snapshots (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rpc_name     text        NOT NULL,
  plan         jsonb       NOT NULL,
  plan_hash    text        NOT NULL,
  total_cost   numeric,
  execution_ms numeric,
  reason       text        NOT NULL DEFAULT 'scheduled',
  plan_changed boolean     NOT NULL DEFAULT false,
  captured_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rpc_plan_snapshots_name_time
  ON public.rpc_plan_snapshots (rpc_name, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_rpc_plan_snapshots_changed
  ON public.rpc_plan_snapshots (rpc_name, captured_at DESC)
  WHERE plan_changed;

REVOKE ALL ON public.rpc_plan_snapshots FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.rpc_plan_snapshots TO authenticated;
GRANT ALL ON public.rpc_plan_snapshots TO service_role;
ALTER TABLE public.rpc_plan_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_rpc_plan_snapshots" ON public.rpc_plan_snapshots;
CREATE POLICY "admins_read_rpc_plan_snapshots"
  ON public.rpc_plan_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "service_role_writes_rpc_plan_snapshots" ON public.rpc_plan_snapshots;
CREATE POLICY "service_role_writes_rpc_plan_snapshots"
  ON public.rpc_plan_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- plan_changed só é verdadeiro quando existe snapshot anterior com hash diferente
CREATE OR REPLACE FUNCTION public.set_rpc_plan_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_prev text;
BEGIN
  SELECT plan_hash INTO v_prev
    FROM public.rpc_plan_snapshots
   WHERE rpc_name = NEW.rpc_name
   ORDER BY captured_at DESC
   LIMIT 1;

  NEW.plan_changed := v_prev IS NOT NULL AND v_prev IS DISTINCT FROM NEW.plan_hash;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rpc_plan_changed ON public.rpc_plan_snapshots;
CREATE TRIGGER trg_rpc_plan_changed
  BEFORE INSERT ON public.rpc_plan_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_rpc_plan_changed();

-- Captura com allowlist fixa (sem SQL dinâmico vindo do chamador)
CREATE OR REPLACE FUNCTION public.capture_rpc_plan(_rpc_name text, _reason text DEFAULT 'scheduled')
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_stmt      text;
  v_plan      jsonb;
  v_hash      text;
  v_last_hash text;
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

  -- hash estrutural: ignora tempos e contadores variáveis
  v_hash := md5(regexp_replace(
    v_plan::text, '"(Actual [^"]*|Execution Time|Planning Time|Shared [^"]*)": *[0-9.]+', '', 'g'));

  SELECT plan_hash INTO v_last_hash
    FROM public.rpc_plan_snapshots
   WHERE rpc_name = _rpc_name
   ORDER BY captured_at DESC
   LIMIT 1;

  IF v_last_hash IS NOT DISTINCT FROM v_hash AND _reason LIKE 'scheduled%' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.rpc_plan_snapshots (rpc_name, plan, plan_hash, total_cost, execution_ms, reason)
  VALUES (_rpc_name, v_plan, v_hash,
          (v_plan -> 0 -> 'Plan' ->> 'Total Cost')::numeric,
          (v_plan -> 0 ->> 'Execution Time')::numeric,
          _reason)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Job: plano de cada RPC monitorada (grava só quando muda) + RPCs degradadas; retenção 30 dias
CREATE OR REPLACE FUNCTION public.capture_degraded_rpc_plans()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r       record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT unnest(ARRAY['get_ai_gateway_health', 'get_ai_gateway_partition_stats',
                        'get_rpc_perf_stats', 'get_top_slow_rpcs', 'get_slow_rpc_trend']) AS rpc_name
  LOOP
    IF public.capture_rpc_plan(r.rpc_name, 'scheduled') IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  FOR r IN
    SELECT t.rpc_name FROM public.get_slow_rpc_trend(1, 24, 20) t
     WHERE t.is_degraded
       AND t.rpc_name IN ('get_ai_gateway_health', 'get_ai_gateway_partition_stats',
                          'get_rpc_perf_stats', 'get_top_slow_rpcs', 'get_slow_rpc_trend')
  LOOP
    IF public.capture_rpc_plan(r.rpc_name, 'degradation') IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  DELETE FROM public.rpc_plan_snapshots WHERE captured_at < now() - interval '30 days';
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rpc_plan_snapshots(_rpc_name text DEFAULT NULL, _limit integer DEFAULT 20)
RETURNS TABLE (id uuid, rpc_name text, plan_hash text, total_cost numeric, execution_ms numeric,
               reason text, captured_at timestamptz, plan_changed boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.id, s.rpc_name, s.plan_hash, s.total_cost, s.execution_ms, s.reason, s.captured_at,
         s.plan_changed
    FROM public.rpc_plan_snapshots s
   WHERE _rpc_name IS NULL OR s.rpc_name = _rpc_name
   ORDER BY s.captured_at DESC
   LIMIT LEAST(COALESCE(_limit, 20), 200);
$$;

CREATE OR REPLACE FUNCTION public.get_rpc_plan_diff(_rpc_name text)
RETURNS TABLE (slot text, id uuid, rpc_name text, plan_hash text, total_cost numeric,
               execution_ms numeric, reason text, captured_at timestamptz, plan jsonb)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH last_two AS (
    SELECT s.*, row_number() OVER (ORDER BY s.captured_at DESC) AS rn
      FROM public.rpc_plan_snapshots s
     WHERE s.rpc_name = _rpc_name
     ORDER BY s.captured_at DESC
     LIMIT 2
  )
  SELECT CASE WHEN l.rn = 1 THEN 'current' ELSE 'previous' END,
         l.id, l.rpc_name, l.plan_hash, l.total_cost, l.execution_ms, l.reason, l.captured_at, l.plan
    FROM last_two l
   ORDER BY l.rn;
$$;

CREATE OR REPLACE FUNCTION public.get_rpc_plan_change_counts(_hours integer DEFAULT 6)
RETURNS TABLE (rpc_name text, changes bigint, last_change timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.rpc_name, count(*)::bigint, max(s.captured_at)
    FROM public.rpc_plan_snapshots s
   WHERE s.plan_changed
     AND s.captured_at >= now() - make_interval(hours => LEAST(GREATEST(COALESCE(_hours, 6), 1), 168))
   GROUP BY s.rpc_name
   ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_rpc_plan_churn_timeline(_rpc_name text DEFAULT NULL, _hours integer DEFAULT 24)
RETURNS TABLE (bucket timestamptz, plan_changes bigint, samples bigint, p95_ms numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT date_trunc('hour', now())
             - make_interval(hours => LEAST(GREATEST(COALESCE(_hours, 24), 1), 168) - 1) AS from_ts,
           date_trunc('hour', now()) AS to_ts
  ),
  buckets AS (
    SELECT generate_series(b.from_ts, b.to_ts, interval '1 hour') AS bucket FROM bounds b
  ),
  changes AS (
    SELECT date_trunc('hour', s.captured_at) AS bucket, count(*)::bigint AS plan_changes
      FROM public.rpc_plan_snapshots s, bounds b
     WHERE s.plan_changed
       AND s.captured_at >= b.from_ts
       AND (_rpc_name IS NULL OR s.rpc_name = _rpc_name)
     GROUP BY 1
  ),
  perf AS (
    SELECT date_trunc('hour', r.created_at) AS bucket,
           count(*)::bigint AS samples,
           percentile_disc(0.95) WITHIN GROUP (ORDER BY r.duration_ms) AS p95_ms
      FROM public.rpc_perf_samples r, bounds b
     WHERE r.created_at >= b.from_ts
       AND (_rpc_name IS NULL OR r.rpc_name = _rpc_name)
     GROUP BY 1
  )
  SELECT k.bucket, COALESCE(c.plan_changes, 0), COALESCE(p.samples, 0), ROUND(COALESCE(p.p95_ms, 0), 1)
    FROM buckets k
    LEFT JOIN changes c ON c.bucket = k.bucket
    LEFT JOIN perf p ON p.bucket = k.bucket
   ORDER BY k.bucket;
$$;

-- 7) Privilégios das funções
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.ensure_ai_gateway_metrics_partition(date)',
    'public.drop_old_ai_gateway_metrics_partitions(integer)',
    'public.record_rpc_perf_sample(text,numeric)',
    'public.cleanup_rpc_perf_samples()',
    'public.evaluate_ai_gateway_alerts()',
    'public.auto_resolve_ai_gateway_alerts()',
    'public.set_rpc_plan_changed()',
    'public.capture_rpc_plan(text,text)',
    'public.capture_degraded_rpc_plans()'
  ]::regprocedure[] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;

  FOREACH fn IN ARRAY ARRAY[
    'public.get_ai_gateway_health(integer)',
    'public.get_ai_gateway_partition_stats()',
    'public.get_rpc_perf_stats(integer)',
    'public.get_top_slow_rpcs(integer,integer)',
    'public.get_slow_rpc_trend(integer,integer,integer)',
    'public.get_rpc_plan_snapshots(text,integer)',
    'public.get_rpc_plan_diff(text)',
    'public.get_rpc_plan_change_counts(integer)',
    'public.get_rpc_plan_churn_timeline(text,integer)'
  ]::regprocedure[] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;

-- 8) Jobs (pg_cron)
DO $$
DECLARE
  j record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN;
  END IF;

  FOR j IN
    SELECT * FROM (VALUES
      ('ai-gateway-alerts-eval',              '*/5 * * * *',   'SELECT public.evaluate_ai_gateway_alerts();'),
      ('auto_resolve_ai_gateway_alerts',      '2-59/5 * * * *', 'SELECT public.auto_resolve_ai_gateway_alerts();'),
      ('ai-gateway-metrics-ensure-partition', '15 3 * * *',    'SELECT public.ensure_ai_gateway_metrics_partition();'),
      ('ai-gateway-metrics-drop-old',         '0 4 * * 0',     'SELECT public.drop_old_ai_gateway_metrics_partitions(90);'),
      ('cleanup_rpc_perf_samples_daily',      '30 3 * * *',    'SELECT public.cleanup_rpc_perf_samples();'),
      ('capture-degraded-rpc-plans',          '*/15 * * * *',  'SELECT public.capture_degraded_rpc_plans();')
    ) AS v(name, schedule, command)
  LOOP
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = j.name;
    PERFORM cron.schedule(j.name, j.schedule, j.command);
  END LOOP;
END $$;
