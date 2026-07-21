-- forecast_periods
CREATE TABLE public.forecast_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('month','quarter')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  quota_amount NUMERIC NOT NULL DEFAULT 0,
  actual_won_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_user ON public.forecast_periods(user_id, status, period_start DESC);
ALTER TABLE public.forecast_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own forecast_periods select" ON public.forecast_periods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own forecast_periods insert" ON public.forecast_periods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own forecast_periods update" ON public.forecast_periods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own forecast_periods delete" ON public.forecast_periods FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_forecast_periods_updated BEFORE UPDATE ON public.forecast_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- deal_forecasts
CREATE TABLE public.deal_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deal_id TEXT NOT NULL,
  deal_name TEXT,
  contact_id UUID,
  company_id UUID,
  period_id UUID NOT NULL REFERENCES public.forecast_periods(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'pipeline' CHECK (category IN ('commit','best_case','pipeline','omitted')),
  confidence_score INT NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  forecasted_amount NUMERIC NOT NULL DEFAULT 0,
  forecasted_close_date DATE,
  stage TEXT,
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  health_score INT NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  last_activity_at TIMESTAMPTZ,
  slip_count INT NOT NULL DEFAULT 0,
  ai_rationale TEXT,
  notes TEXT,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, period_id)
);
CREATE INDEX IF NOT EXISTS idx_deal_forecasts_period ON public.deal_forecasts(period_id, category);
CREATE INDEX IF NOT EXISTS idx_deal_forecasts_user ON public.deal_forecasts(user_id, period_id);
ALTER TABLE public.deal_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deal_forecasts select" ON public.deal_forecasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own deal_forecasts insert" ON public.deal_forecasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own deal_forecasts update" ON public.deal_forecasts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own deal_forecasts delete" ON public.deal_forecasts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_deal_forecasts_updated BEFORE UPDATE ON public.deal_forecasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_deal_forecasts_audit AFTER INSERT OR UPDATE OR DELETE ON public.deal_forecasts FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- forecast_snapshots
CREATE TABLE public.forecast_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_id UUID NOT NULL REFERENCES public.forecast_periods(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  commit_total NUMERIC NOT NULL DEFAULT 0,
  best_case_total NUMERIC NOT NULL DEFAULT 0,
  pipeline_total NUMERIC NOT NULL DEFAULT 0,
  weighted_total NUMERIC NOT NULL DEFAULT 0,
  deal_count INT NOT NULL DEFAULT 0,
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(period_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_period ON public.forecast_snapshots(period_id, snapshot_date DESC);
ALTER TABLE public.forecast_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own forecast_snapshots select" ON public.forecast_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own forecast_snapshots insert" ON public.forecast_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own forecast_snapshots delete" ON public.forecast_snapshots FOR DELETE USING (auth.uid() = user_id);

-- forecast_categories_history
CREATE TABLE public.forecast_categories_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deal_forecast_id UUID NOT NULL REFERENCES public.deal_forecasts(id) ON DELETE CASCADE,
  from_category TEXT,
  to_category TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'user' CHECK (changed_by IN ('user','ai','system')),
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forecast_cat_history_df ON public.forecast_categories_history(deal_forecast_id, changed_at DESC);
ALTER TABLE public.forecast_categories_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own forecast_cat_history select" ON public.forecast_categories_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own forecast_cat_history insert" ON public.forecast_categories_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- forecast_quota_settings
CREATE TABLE public.forecast_quota_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  default_monthly_quota NUMERIC NOT NULL DEFAULT 0,
  default_quarterly_quota NUMERIC NOT NULL DEFAULT 0,
  health_weight_activity INT NOT NULL DEFAULT 30,
  health_weight_stage_age INT NOT NULL DEFAULT 25,
  health_weight_engagement INT NOT NULL DEFAULT 25,
  health_weight_relationship INT NOT NULL DEFAULT 20,
  inactivity_threshold_days INT NOT NULL DEFAULT 14,
  slip_threshold_days INT NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forecast_quota_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quota_settings select" ON public.forecast_quota_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own quota_settings insert" ON public.forecast_quota_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quota_settings update" ON public.forecast_quota_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_quota_settings_updated BEFORE UPDATE ON public.forecast_quota_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: seed_forecast_period — cria período atual baseado no tipo
CREATE OR REPLACE FUNCTION public.seed_forecast_period(_user_id UUID, _type TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _start DATE;
  _end DATE;
  _id UUID;
  _quota NUMERIC := 0;
BEGIN
  IF _type = 'month' THEN
    _start := date_trunc('month', CURRENT_DATE)::DATE;
    _end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    SELECT default_monthly_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  ELSIF _type = 'quarter' THEN
    _start := date_trunc('quarter', CURRENT_DATE)::DATE;
    _end := (date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::DATE;
    SELECT default_quarterly_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  ELSE
    RAISE EXCEPTION 'Invalid period_type: %', _type;
  END IF;

  INSERT INTO public.forecast_periods (user_id, period_type, period_start, period_end, quota_amount)
  VALUES (_user_id, _type, _start, _end, COALESCE(_quota, 0))
  ON CONFLICT (user_id, period_type, period_start) DO UPDATE SET updated_at = now()
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

-- Trigger para registrar mudança de categoria
CREATE OR REPLACE FUNCTION public.log_deal_forecast_category_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO public.forecast_categories_history (user_id, deal_forecast_id, from_category, to_category, changed_by, reason)
    VALUES (NEW.user_id, NEW.id, OLD.category, NEW.category, 'user', NEW.notes);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_deal_forecasts_cat_history AFTER UPDATE ON public.deal_forecasts FOR EACH ROW EXECUTE FUNCTION public.log_deal_forecast_category_change();