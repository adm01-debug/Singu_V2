-- RevOps Dashboard Schema

-- Snapshots diários de cada estágio do funil
CREATE TABLE public.revops_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period DATE NOT NULL,
  funnel_stage TEXT NOT NULL CHECK (funnel_stage IN ('visitor','lead','mql','sql','opportunity','customer')),
  count INT NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  avg_velocity_days NUMERIC(8,2),
  total_value NUMERIC(14,2) DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, funnel_stage)
);
CREATE INDEX IF NOT EXISTS idx_revops_snapshots_user_period ON public.revops_snapshots(user_id, period DESC);
ALTER TABLE public.revops_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own snapshots" ON public.revops_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own snapshots" ON public.revops_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own snapshots" ON public.revops_snapshots FOR DELETE USING (auth.uid() = user_id);

-- Benchmarks/metas por métrica
CREATE TABLE public.revops_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_key TEXT NOT NULL,
  target_value NUMERIC(14,2) NOT NULL,
  warning_threshold NUMERIC(5,2) NOT NULL DEFAULT 90,
  critical_threshold NUMERIC(5,2) NOT NULL DEFAULT 75,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key)
);
CREATE INDEX IF NOT EXISTS idx_revops_benchmarks_user_metric ON public.revops_benchmarks(user_id, metric_key);
ALTER TABLE public.revops_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own benchmarks" ON public.revops_benchmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own benchmarks" ON public.revops_benchmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own benchmarks" ON public.revops_benchmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own benchmarks" ON public.revops_benchmarks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_revops_benchmarks_updated_at
  BEFORE UPDATE ON public.revops_benchmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alertas automáticos
CREATE TABLE public.revops_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_key TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  message TEXT NOT NULL,
  current_value NUMERIC(14,2),
  expected_value NUMERIC(14,2),
  period DATE,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revops_alerts_user_active ON public.revops_alerts(user_id, dismissed, created_at DESC);
ALTER TABLE public.revops_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own alerts" ON public.revops_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alerts" ON public.revops_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alerts" ON public.revops_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alerts" ON public.revops_alerts FOR DELETE USING (auth.uid() = user_id);

-- RPC: compute KPIs ponta-a-ponta
CREATE OR REPLACE FUNCTION public.compute_revops_kpis(
  _user_id UUID,
  _period_start DATE,
  _period_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mql_count INT := 0;
  _sql_count INT := 0;
  _opp_count INT := 0;
  _won_count INT := 0;
  _lost_count INT := 0;
  _won_value NUMERIC := 0;
  _open_pipeline NUMERIC := 0;
  _quota NUMERIC := 0;
  _avg_cycle NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COUNT(*) INTO _mql_count
  FROM public.mql_classifications
  WHERE user_id = _user_id
    AND status = 'mql'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _sql_count
  FROM public.mql_classifications
  WHERE user_id = _user_id
    AND status = 'sql'
    AND created_at::date BETWEEN _period_start AND _period_end;

  -- Opportunities (deal_forecasts as proxy)
  SELECT COUNT(*) INTO _opp_count
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND created_at::date BETWEEN _period_start AND _period_end;

  -- Won deals via forecast_periods (actual_won_amount) when present
  SELECT COALESCE(SUM(actual_won_amount), 0), COALESCE(SUM(quota_amount), 0)
  INTO _won_value, _quota
  FROM public.forecast_periods
  WHERE user_id = _user_id
    AND period_start >= _period_start
    AND period_end <= _period_end;

  SELECT COALESCE(SUM(amount), 0)
  INTO _open_pipeline
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND category IN ('commit','best_case','pipeline');

  -- Won/lost counts via audit if available
  SELECT COUNT(*) INTO _won_count
  FROM public.audit_log
  WHERE user_id = _user_id
    AND entity_type = 'deal_forecasts'
    AND (new_data->>'category') = 'won'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _lost_count
  FROM public.audit_log
  WHERE user_id = _user_id
    AND entity_type = 'deal_forecasts'
    AND (new_data->>'category') = 'lost'
    AND created_at::date BETWEEN _period_start AND _period_end;

  RETURN jsonb_build_object(
    'mql_count', _mql_count,
    'sql_count', _sql_count,
    'opp_count', _opp_count,
    'won_count', _won_count,
    'lost_count', _lost_count,
    'won_value', _won_value,
    'open_pipeline', _open_pipeline,
    'quota', _quota,
    'mql_to_sql_rate', CASE WHEN _mql_count > 0 THEN ROUND((_sql_count::numeric / _mql_count) * 100, 2) ELSE 0 END,
    'sql_to_opp_rate', CASE WHEN _sql_count > 0 THEN ROUND((_opp_count::numeric / _sql_count) * 100, 2) ELSE 0 END,
    'sql_to_won_rate', CASE WHEN _sql_count > 0 THEN ROUND((_won_count::numeric / _sql_count) * 100, 2) ELSE 0 END,
    'win_rate', CASE WHEN (_won_count + _lost_count) > 0 THEN ROUND((_won_count::numeric / (_won_count + _lost_count)) * 100, 2) ELSE 0 END,
    'pipeline_coverage', CASE WHEN _quota > 0 THEN ROUND((_open_pipeline / _quota), 2) ELSE 0 END,
    'quota_attainment', CASE WHEN _quota > 0 THEN ROUND((_won_value / _quota) * 100, 2) ELSE 0 END,
    'avg_cycle_days', _avg_cycle,
    'period_start', _period_start,
    'period_end', _period_end
  );
END;
$$;

-- RPC: dismiss alert
CREATE OR REPLACE FUNCTION public.dismiss_revops_alert(_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.revops_alerts
  SET dismissed = true
  WHERE id = _alert_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;