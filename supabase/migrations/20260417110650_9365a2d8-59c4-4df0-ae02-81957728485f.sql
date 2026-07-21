-- ============ CS Accounts ============
CREATE TABLE public.cs_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  csm_owner_id UUID,
  account_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'mid' CHECK (tier IN ('strategic','enterprise','mid','smb')),
  arr NUMERIC NOT NULL DEFAULT 0,
  contract_start DATE,
  renewal_date DATE,
  lifecycle_stage TEXT NOT NULL DEFAULT 'onboarding' CHECK (lifecycle_stage IN ('onboarding','adopting','mature','at_risk','churned')),
  health_score INT NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  health_trend TEXT DEFAULT 'stable' CHECK (health_trend IN ('up','stable','down')),
  notes TEXT,
  last_health_recalc_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_accounts_user ON public.cs_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cs_accounts_renewal ON public.cs_accounts(user_id, renewal_date);
CREATE INDEX IF NOT EXISTS idx_cs_accounts_health ON public.cs_accounts(user_id, health_score);
CREATE INDEX IF NOT EXISTS idx_cs_accounts_lifecycle ON public.cs_accounts(user_id, lifecycle_stage);

ALTER TABLE public.cs_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_accounts_select" ON public.cs_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cs_accounts_insert" ON public.cs_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_accounts_update" ON public.cs_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cs_accounts_delete" ON public.cs_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_cs_accounts_updated BEFORE UPDATE ON public.cs_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Health Signals ============
CREATE TABLE public.cs_health_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('usage','support','engagement','sentiment','payment','nps')),
  score NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 1,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_signals_account ON public.cs_health_signals(account_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_cs_signals_captured ON public.cs_health_signals(user_id, captured_at DESC);

ALTER TABLE public.cs_health_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_signals_select" ON public.cs_health_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cs_signals_insert" ON public.cs_health_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_signals_update" ON public.cs_health_signals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cs_signals_delete" ON public.cs_health_signals FOR DELETE USING (auth.uid() = user_id);

-- ============ NPS Responses ============
CREATE TABLE public.cs_nps_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 10),
  category TEXT NOT NULL CHECK (category IN ('promoter','passive','detractor')),
  comment TEXT,
  surveyed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_nps_account ON public.cs_nps_responses(account_id, surveyed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_nps_user ON public.cs_nps_responses(user_id, surveyed_at DESC);

ALTER TABLE public.cs_nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_nps_select" ON public.cs_nps_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cs_nps_insert" ON public.cs_nps_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_nps_update" ON public.cs_nps_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cs_nps_delete" ON public.cs_nps_responses FOR DELETE USING (auth.uid() = user_id);

-- ============ QBRs ============
CREATE TABLE public.cs_qbrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  agenda JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_qbrs_account ON public.cs_qbrs(account_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_qbrs_user_status ON public.cs_qbrs(user_id, status, scheduled_at);

ALTER TABLE public.cs_qbrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_qbrs_select" ON public.cs_qbrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cs_qbrs_insert" ON public.cs_qbrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_qbrs_update" ON public.cs_qbrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cs_qbrs_delete" ON public.cs_qbrs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_cs_qbrs_updated BEFORE UPDATE ON public.cs_qbrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Renewals ============
CREATE TABLE public.cs_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  renewal_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','in_negotiation','renewed','churned','downgraded','expanded')),
  forecasted_arr NUMERIC NOT NULL DEFAULT 0,
  actual_arr NUMERIC,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_renewals_user_date ON public.cs_renewals(user_id, renewal_date);
CREATE INDEX IF NOT EXISTS idx_cs_renewals_account ON public.cs_renewals(account_id, renewal_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_renewals_status ON public.cs_renewals(user_id, status);

ALTER TABLE public.cs_renewals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_renewals_select" ON public.cs_renewals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cs_renewals_insert" ON public.cs_renewals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_renewals_update" ON public.cs_renewals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cs_renewals_delete" ON public.cs_renewals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_cs_renewals_updated BEFORE UPDATE ON public.cs_renewals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RPC: compute_account_health ============
CREATE OR REPLACE FUNCTION public.compute_account_health(_account_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _account public.cs_accounts;
  _weighted_sum NUMERIC := 0;
  _weight_total NUMERIC := 0;
  _final_score INT := 50;
  _signal RECORD;
  _decay NUMERIC;
  _days_ago NUMERIC;
  _previous_score INT;
  _trend TEXT := 'stable';
  _breakdown JSONB := '{}'::jsonb;
  _category_sums JSONB := '{}'::jsonb;
BEGIN
  SELECT * INTO _account FROM public.cs_accounts WHERE id = _account_id;
  IF _account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _account.user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  _previous_score := _account.health_score;

  FOR _signal IN
    SELECT signal_type, score, weight, captured_at
    FROM public.cs_health_signals
    WHERE account_id = _account_id
      AND captured_at >= now() - INTERVAL '90 days'
  LOOP
    _days_ago := EXTRACT(EPOCH FROM (now() - _signal.captured_at)) / 86400.0;
    _decay := exp(-_days_ago / 45.0); -- meia-vida ~31 dias
    _weighted_sum := _weighted_sum + (_signal.score * _signal.weight * _decay);
    _weight_total := _weight_total + (_signal.weight * _decay);
  END LOOP;

  IF _weight_total > 0 THEN
    _final_score := GREATEST(0, LEAST(100, ROUND(_weighted_sum / _weight_total)::INT));
  END IF;

  IF _final_score - _previous_score >= 5 THEN
    _trend := 'up';
  ELSIF _previous_score - _final_score >= 5 THEN
    _trend := 'down';
  END IF;

  UPDATE public.cs_accounts
  SET health_score = _final_score,
      health_trend = _trend,
      last_health_recalc_at = now(),
      lifecycle_stage = CASE
        WHEN _final_score < 40 THEN 'at_risk'
        WHEN lifecycle_stage = 'at_risk' AND _final_score >= 60 THEN 'mature'
        ELSE lifecycle_stage
      END
  WHERE id = _account_id;

  RETURN jsonb_build_object(
    'account_id', _account_id,
    'previous_score', _previous_score,
    'new_score', _final_score,
    'trend', _trend,
    'signals_considered', (SELECT COUNT(*) FROM public.cs_health_signals WHERE account_id = _account_id AND captured_at >= now() - INTERVAL '90 days')
  );
END;
$$;

-- ============ RPC: cs_renewal_pipeline ============
CREATE OR REPLACE FUNCTION public.cs_renewal_pipeline(_user_id UUID, _days_ahead INT DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'total_count', COUNT(*),
    'total_arr', COALESCE(SUM(r.forecasted_arr), 0),
    'at_risk_count', COUNT(*) FILTER (WHERE r.risk_level IN ('high','critical')),
    'at_risk_arr', COALESCE(SUM(r.forecasted_arr) FILTER (WHERE r.risk_level IN ('high','critical')), 0),
    'renewals', COALESCE(jsonb_agg(jsonb_build_object(
      'id', r.id,
      'account_id', r.account_id,
      'account_name', a.account_name,
      'tier', a.tier,
      'health_score', a.health_score,
      'renewal_date', r.renewal_date,
      'days_until', (r.renewal_date - CURRENT_DATE),
      'status', r.status,
      'forecasted_arr', r.forecasted_arr,
      'risk_level', r.risk_level
    ) ORDER BY r.renewal_date ASC), '[]'::jsonb)
  ) INTO _result
  FROM public.cs_renewals r
  JOIN public.cs_accounts a ON a.id = r.account_id
  WHERE r.user_id = _user_id
    AND r.status IN ('upcoming','in_negotiation')
    AND r.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (_days_ahead || ' days')::INTERVAL;

  RETURN _result;
END;
$$;