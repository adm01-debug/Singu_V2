-- Rodada 65/10: materializa plan_changed em rpc_plan_snapshots
ALTER TABLE public.rpc_plan_snapshots
  ADD COLUMN IF NOT EXISTS plan_changed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_rpc_plan_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Backfill histórico
WITH calc AS (
  SELECT id,
         plan_hash IS DISTINCT FROM lag(plan_hash) OVER (PARTITION BY rpc_name ORDER BY captured_at)
           AND lag(plan_hash) OVER (PARTITION BY rpc_name ORDER BY captured_at) IS NOT NULL AS changed
  FROM public.rpc_plan_snapshots
)
UPDATE public.rpc_plan_snapshots s
SET plan_changed = COALESCE(calc.changed, false)
FROM calc
WHERE calc.id = s.id AND s.plan_changed IS DISTINCT FROM COALESCE(calc.changed, false);

CREATE INDEX IF NOT EXISTS idx_rpc_plan_snapshots_changed
  ON public.rpc_plan_snapshots (rpc_name, captured_at DESC)
  WHERE plan_changed;

-- Leitura passa a usar a coluna materializada
CREATE OR REPLACE FUNCTION public.get_rpc_plan_snapshots(_rpc_name text DEFAULT NULL, _limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid, rpc_name text, plan_hash text, total_cost numeric,
  execution_ms numeric, reason text, captured_at timestamptz, plan_changed boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.id, s.rpc_name, s.plan_hash, s.total_cost, s.execution_ms, s.reason,
         s.captured_at, s.plan_changed
  FROM public.rpc_plan_snapshots s
  WHERE (_rpc_name IS NULL OR s.rpc_name = _rpc_name)
  ORDER BY s.captured_at DESC
  LIMIT LEAST(COALESCE(_limit, 20), 200);
$$;

-- Agregado para exporter Prometheus
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

REVOKE ALL ON FUNCTION public.get_rpc_plan_change_counts(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rpc_plan_change_counts(integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_rpc_plan_changed() FROM PUBLIC, anon, authenticated;