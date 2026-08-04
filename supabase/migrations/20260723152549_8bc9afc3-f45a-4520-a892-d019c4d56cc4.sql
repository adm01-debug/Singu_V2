
CREATE TABLE public.ai_gateway_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  model TEXT,
  status TEXT NOT NULL CHECK (status IN ('success','error','rate_limited','timeout')),
  http_status INTEGER,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  tokens_in INTEGER,
  tokens_out INTEGER,
  error_code TEXT,
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_gateway_metrics_created ON public.ai_gateway_metrics (created_at DESC);
CREATE INDEX idx_ai_gateway_metrics_fn_created ON public.ai_gateway_metrics (function_name, created_at DESC);

GRANT ALL ON public.ai_gateway_metrics TO service_role;
-- authenticated/anon: no direct access. Reads via RPC below (admin-only).

ALTER TABLE public.ai_gateway_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai_gateway_metrics"
  ON public.ai_gateway_metrics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages ai_gateway_metrics"
  ON public.ai_gateway_metrics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Aggregated health RPC for the /admin/error-budget page. Admin-only.
CREATE OR REPLACE FUNCTION public.get_ai_gateway_health(_hours INTEGER DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _result JSONB;
  _window_start TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  _hours := GREATEST(1, LEAST(_hours, 24 * 30));
  _window_start := now() - make_interval(hours => _hours);

  SELECT jsonb_build_object(
    'window_hours', _hours,
    'computed_at', now(),
    'totals', COALESCE((
      SELECT jsonb_build_object(
        'requests', COUNT(*),
        'errors', COUNT(*) FILTER (WHERE status <> 'success'),
        'error_rate_pct', ROUND((COUNT(*) FILTER (WHERE status <> 'success'))::numeric
                          / NULLIF(COUNT(*),0) * 100, 2),
        'p50_ms', percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms),
        'p95_ms', percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms),
        'p99_ms', percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)
      )
      FROM public.ai_gateway_metrics
      WHERE created_at >= _window_start
    ), '{}'::jsonb),
    'by_function', COALESCE((
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.requests DESC)
      FROM (
        SELECT
          function_name,
          COUNT(*) AS requests,
          COUNT(*) FILTER (WHERE status <> 'success') AS errors,
          ROUND((COUNT(*) FILTER (WHERE status <> 'success'))::numeric
            / NULLIF(COUNT(*),0) * 100, 2) AS error_rate_pct,
          ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) AS p50_ms,
          ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) AS p95_ms,
          MAX(created_at) AS last_seen
        FROM public.ai_gateway_metrics
        WHERE created_at >= _window_start
        GROUP BY function_name
      ) t
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_ai_gateway_health(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_gateway_health(INTEGER) TO authenticated;
