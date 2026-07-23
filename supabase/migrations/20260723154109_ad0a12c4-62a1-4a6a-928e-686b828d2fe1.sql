
-- Drop legacy first to free constraint/index names
DROP TABLE IF EXISTS public.ai_gateway_metrics CASCADE;

CREATE TABLE public.ai_gateway_metrics (
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

GRANT SELECT ON public.ai_gateway_metrics TO authenticated;
GRANT ALL    ON public.ai_gateway_metrics TO service_role;

ALTER TABLE public.ai_gateway_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai_gateway_metrics"
  ON public.ai_gateway_metrics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages ai_gateway_metrics"
  ON public.ai_gateway_metrics
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_ai_gateway_metrics_created
  ON public.ai_gateway_metrics (created_at DESC);
CREATE INDEX idx_ai_gateway_metrics_fn_created
  ON public.ai_gateway_metrics (function_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.ensure_ai_gateway_metrics_partition(target_month date DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_start date;
  m_end   date;
  part_name text;
BEGIN
  m_start := date_trunc('month', COALESCE(target_month, (now() + interval '1 month')::date))::date;
  m_end   := (m_start + interval '1 month')::date;
  part_name := format('ai_gateway_metrics_%s', to_char(m_start, 'YYYY_MM'));

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = part_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)',
      part_name, m_start, m_end
    );
  END IF;

  RETURN part_name;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_ai_gateway_metrics_partition(date) FROM PUBLIC, anon, authenticated;

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
    JOIN pg_class p ON p.oid = i.inhparent
    JOIN pg_namespace np ON np.oid = p.relnamespace
    WHERE np.nspname = 'public' AND p.relname = 'ai_gateway_metrics'
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

REVOKE ALL ON FUNCTION public.drop_old_ai_gateway_metrics_partitions(integer) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE i int;
BEGIN
  FOR i IN -3..3 LOOP
    PERFORM public.ensure_ai_gateway_metrics_partition((date_trunc('month', now()) + make_interval(months => i))::date);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job
      WHERE jobname IN ('ai-gateway-metrics-ensure-partition','ai-gateway-metrics-drop-old');

    PERFORM cron.schedule(
      'ai-gateway-metrics-ensure-partition',
      '15 3 * * *',
      $c$SELECT public.ensure_ai_gateway_metrics_partition();$c$
    );

    PERFORM cron.schedule(
      'ai-gateway-metrics-drop-old',
      '0 4 * * 0',
      $c$SELECT public.drop_old_ai_gateway_metrics_partitions(90);$c$
    );
  END IF;
END $$;
