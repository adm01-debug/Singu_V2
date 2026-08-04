-- =========================
-- FORMS
-- =========================
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  routing_rules JSONB NOT NULL DEFAULT '{"type":"round_robin","members":[]}'::jsonb,
  nurturing_workflow_id UUID,
  redirect_url TEXT,
  success_message TEXT DEFAULT 'Obrigado! Recebemos seus dados.',
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  submission_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_owner_all" ON public.forms FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forms_public_read_published" ON public.forms FOR SELECT
  USING (is_published = true);

CREATE INDEX IF NOT EXISTS idx_forms_user ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- FORM SUBMISSIONS
-- =========================
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  routed_to UUID,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fs_owner_all" ON public.form_submissions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fs_public_insert" ON public.form_submissions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.is_published = true AND f.user_id = form_submissions.user_id)
  );

CREATE INDEX IF NOT EXISTS idx_fs_form ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_fs_user ON public.form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_fs_contact ON public.form_submissions(contact_id);

-- =========================
-- LEAD MAGNETS
-- =========================
CREATE TABLE public.lead_magnets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'ebook' CHECK (type IN ('ebook','webinar','whitepaper','template','video','checklist','other')),
  file_path TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  gated BOOLEAN NOT NULL DEFAULT true,
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_magnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lm_owner_all" ON public.lead_magnets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lm_public_read" ON public.lead_magnets FOR SELECT
  USING (is_published = true);

CREATE INDEX IF NOT EXISTS idx_lm_user ON public.lead_magnets(user_id);
CREATE INDEX IF NOT EXISTS idx_lm_slug ON public.lead_magnets(slug);
CREATE TRIGGER trg_lm_updated BEFORE UPDATE ON public.lead_magnets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- LEAD MAGNET DOWNLOADS
-- =========================
CREATE TABLE public.lead_magnet_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  magnet_id UUID NOT NULL REFERENCES public.lead_magnets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_id UUID,
  email TEXT,
  name TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_magnet_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lmd_owner_read" ON public.lead_magnet_downloads FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "lmd_public_insert" ON public.lead_magnet_downloads FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.lead_magnets m WHERE m.id = magnet_id AND m.is_published = true AND m.user_id = lead_magnet_downloads.user_id)
  );

CREATE INDEX IF NOT EXISTS idx_lmd_magnet ON public.lead_magnet_downloads(magnet_id);
CREATE INDEX IF NOT EXISTS idx_lmd_user ON public.lead_magnet_downloads(user_id);

-- =========================
-- MQL CRITERIA
-- =========================
CREATE TABLE public.mql_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_handoff BOOLEAN NOT NULL DEFAULT false,
  handoff_to_role TEXT NOT NULL DEFAULT 'sdr' CHECK (handoff_to_role IN ('sdr','closer','manager')),
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mql_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mqlc_owner_all" ON public.mql_criteria FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mqlc_user ON public.mql_criteria(user_id);
CREATE TRIGGER trg_mqlc_updated BEFORE UPDATE ON public.mql_criteria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- MQL CLASSIFICATIONS
-- =========================
CREATE TABLE public.mql_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  criteria_id UUID REFERENCES public.mql_criteria(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'mql' CHECK (status IN ('mql','sql','disqualified','customer')),
  qualified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handoff_assignment_id UUID,
  handoff_to UUID,
  handoff_at TIMESTAMPTZ,
  score_snapshot INTEGER,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mql_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mqlcls_owner_all" ON public.mql_classifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mqlcls_user ON public.mql_classifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mqlcls_contact ON public.mql_classifications(contact_id);
CREATE INDEX IF NOT EXISTS idx_mqlcls_status ON public.mql_classifications(status);
CREATE TRIGGER trg_mqlcls_updated BEFORE UPDATE ON public.mql_classifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- ATTRIBUTION TOUCHPOINTS
-- =========================
CREATE TABLE public.attribution_touchpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  deal_id TEXT,
  touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN ('form','email','page_view','magnet','sequence','call','meeting','ad','social','referral','other')),
  source TEXT,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  page_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  value_attributed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attribution_touchpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atp_owner_all" ON public.attribution_touchpoints FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_atp_user ON public.attribution_touchpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_atp_contact ON public.attribution_touchpoints(contact_id);
CREATE INDEX IF NOT EXISTS idx_atp_deal ON public.attribution_touchpoints(deal_id);
CREATE INDEX IF NOT EXISTS idx_atp_occurred ON public.attribution_touchpoints(occurred_at DESC);

-- =========================
-- ATTRIBUTION CACHE
-- =========================
CREATE TABLE public.attribution_models_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deal_id TEXT NOT NULL,
  model TEXT NOT NULL CHECK (model IN ('first','last','linear','u_shape','w_shape','time_decay')),
  allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_value NUMERIC NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, deal_id, model)
);
ALTER TABLE public.attribution_models_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amc_owner_all" ON public.attribution_models_cache FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_amc_user_deal ON public.attribution_models_cache(user_id, deal_id);

-- =========================
-- NURTURING EXECUTIONS
-- =========================
CREATE TABLE public.nurturing_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.nurturing_workflows(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled','failed')),
  next_action_at TIMESTAMPTZ,
  last_action_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, contact_id)
);
ALTER TABLE public.nurturing_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ne_owner_all" ON public.nurturing_executions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ne_user ON public.nurturing_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_ne_workflow ON public.nurturing_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ne_next_action ON public.nurturing_executions(next_action_at) WHERE status = 'active';
CREATE TRIGGER trg_ne_updated BEFORE UPDATE ON public.nurturing_executions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- RPC: submit_public_form
-- =========================
CREATE OR REPLACE FUNCTION public.submit_public_form(
  _slug TEXT,
  _data JSONB,
  _utms JSONB DEFAULT '{}'::jsonb,
  _page_url TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _form public.forms;
  _submission_id UUID;
  _routed UUID;
  _members JSONB;
  _members_count INT;
  _idx INT;
BEGIN
  SELECT * INTO _form FROM public.forms WHERE slug = _slug AND is_published = true LIMIT 1;
  IF _form.id IS NULL THEN
    RAISE EXCEPTION 'Form not found or not published';
  END IF;

  -- Round-robin routing
  _members := COALESCE(_form.routing_rules->'members', '[]'::jsonb);
  _members_count := jsonb_array_length(_members);
  IF _members_count > 0 THEN
    _idx := (_form.submission_count % _members_count);
    _routed := (_members->>_idx)::uuid;
  END IF;

  INSERT INTO public.form_submissions (
    form_id, user_id, data, routed_to,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    page_url, user_agent
  )
  VALUES (
    _form.id, _form.user_id, _data, _routed,
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    _utms->>'utm_content', _utms->>'utm_term',
    _page_url, _user_agent
  )
  RETURNING id INTO _submission_id;

  UPDATE public.forms
    SET submission_count = submission_count + 1
    WHERE id = _form.id;

  -- Touchpoint
  INSERT INTO public.attribution_touchpoints (
    user_id, contact_id, touchpoint_type, source, medium, campaign, content, term, page_url, metadata
  ) VALUES (
    _form.user_id, NULL, 'form',
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    _utms->>'utm_content', _utms->>'utm_term',
    _page_url,
    jsonb_build_object('form_id', _form.id, 'submission_id', _submission_id, 'form_name', _form.name)
  );

  RETURN jsonb_build_object(
    'submission_id', _submission_id,
    'redirect_url', _form.redirect_url,
    'success_message', _form.success_message,
    'routed_to', _routed
  );
END;
$$;

-- =========================
-- RPC: increment_form_view
-- =========================
CREATE OR REPLACE FUNCTION public.increment_form_view(_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.forms SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$$;

-- =========================
-- RPC: track_magnet_download
-- =========================
CREATE OR REPLACE FUNCTION public.track_magnet_download(
  _slug TEXT,
  _email TEXT,
  _name TEXT DEFAULT NULL,
  _utms JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _magnet public.lead_magnets;
  _dl_id UUID;
BEGIN
  SELECT * INTO _magnet FROM public.lead_magnets WHERE slug = _slug AND is_published = true LIMIT 1;
  IF _magnet.id IS NULL THEN
    RAISE EXCEPTION 'Magnet not found';
  END IF;

  INSERT INTO public.lead_magnet_downloads (
    magnet_id, user_id, email, name,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    _magnet.id, _magnet.user_id, _email, _name,
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign'
  ) RETURNING id INTO _dl_id;

  UPDATE public.lead_magnets SET download_count = download_count + 1 WHERE id = _magnet.id;

  INSERT INTO public.attribution_touchpoints (
    user_id, touchpoint_type, source, medium, campaign, metadata
  ) VALUES (
    _magnet.user_id, 'magnet',
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    jsonb_build_object('magnet_id', _magnet.id, 'download_id', _dl_id, 'title', _magnet.title, 'email', _email)
  );

  RETURN jsonb_build_object(
    'download_id', _dl_id,
    'file_path', _magnet.file_path,
    'external_url', _magnet.external_url
  );
END;
$$;

-- =========================
-- RPC: increment_magnet_view
-- =========================
CREATE OR REPLACE FUNCTION public.increment_magnet_view(_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lead_magnets SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$$;

-- =========================
-- RPC: compute_attribution
-- =========================
CREATE OR REPLACE FUNCTION public.compute_attribution(
  _deal_id TEXT,
  _model TEXT DEFAULT 'linear',
  _deal_value NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _allocations JSONB := '[]'::jsonb;
  _tps RECORD;
  _count INT := 0;
  _total INT;
  _share NUMERIC;
  _arr JSONB := '[]'::jsonb;
  _i INT := 0;
BEGIN
  SELECT COUNT(*) INTO _total
  FROM public.attribution_touchpoints
  WHERE user_id = auth.uid() AND deal_id = _deal_id;

  IF _total = 0 THEN
    RETURN jsonb_build_object('model', _model, 'allocations', '[]'::jsonb, 'total_value', _deal_value);
  END IF;

  FOR _tps IN
    SELECT id, touchpoint_type, source, medium, campaign, occurred_at
    FROM public.attribution_touchpoints
    WHERE user_id = auth.uid() AND deal_id = _deal_id
    ORDER BY occurred_at ASC
  LOOP
    _share := CASE _model
      WHEN 'first' THEN CASE WHEN _i = 0 THEN 1 ELSE 0 END
      WHEN 'last' THEN CASE WHEN _i = _total - 1 THEN 1 ELSE 0 END
      WHEN 'linear' THEN 1.0 / _total
      WHEN 'u_shape' THEN
        CASE
          WHEN _total = 1 THEN 1
          WHEN _total = 2 THEN 0.5
          WHEN _i = 0 OR _i = _total - 1 THEN 0.4
          ELSE 0.2 / (_total - 2)
        END
      WHEN 'w_shape' THEN
        CASE
          WHEN _total <= 2 THEN 1.0 / _total
          WHEN _total = 3 THEN CASE WHEN _i = 1 THEN 0.3 ELSE 0.35 END
          WHEN _i = 0 OR _i = _total - 1 OR _i = (_total / 2) THEN 0.3
          ELSE 0.1 / (_total - 3)
        END
      WHEN 'time_decay' THEN power(2, _i::numeric / GREATEST(_total - 1, 1)) / (
        SELECT SUM(power(2, g::numeric / GREATEST(_total - 1, 1))) FROM generate_series(0, _total - 1) g
      )
      ELSE 1.0 / _total
    END;

    _arr := _arr || jsonb_build_object(
      'touchpoint_id', _tps.id,
      'type', _tps.touchpoint_type,
      'source', _tps.source,
      'medium', _tps.medium,
      'campaign', _tps.campaign,
      'occurred_at', _tps.occurred_at,
      'share', ROUND(_share::numeric, 4),
      'value', ROUND((_share * _deal_value)::numeric, 2)
    );
    _i := _i + 1;
  END LOOP;

  INSERT INTO public.attribution_models_cache (user_id, deal_id, model, allocations, total_value)
  VALUES (auth.uid(), _deal_id, _model, _arr, _deal_value)
  ON CONFLICT (user_id, deal_id, model) DO UPDATE
    SET allocations = EXCLUDED.allocations,
        total_value = EXCLUDED.total_value,
        computed_at = now();

  RETURN jsonb_build_object('model', _model, 'allocations', _arr, 'total_value', _deal_value, 'touchpoints_count', _total);
END;
$$;

-- =========================
-- RPC: evaluate_mql
-- =========================
CREATE OR REPLACE FUNCTION public.evaluate_mql(_contact_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _criterion RECORD;
  _matched UUID;
  _score INT := 0;
  _classification_id UUID;
  _result JSONB;
BEGIN
  -- Get contact lead score (if exists)
  SELECT COALESCE(lead_score, 0) INTO _score FROM public.contacts WHERE id = _contact_id AND user_id = auth.uid();

  FOR _criterion IN
    SELECT * FROM public.mql_criteria
    WHERE user_id = auth.uid() AND is_active = true
    ORDER BY priority DESC, created_at ASC
  LOOP
    -- Simple evaluation: condition object {min_score:int, required_tags:[]}
    IF (_criterion.conditions->>'min_score')::INT IS NULL OR _score >= (_criterion.conditions->>'min_score')::INT THEN
      _matched := _criterion.id;
      EXIT;
    END IF;
  END LOOP;

  IF _matched IS NULL THEN
    RETURN jsonb_build_object('qualified', false, 'score', _score);
  END IF;

  INSERT INTO public.mql_classifications (user_id, contact_id, criteria_id, status, score_snapshot, reason)
  VALUES (auth.uid(), _contact_id, _matched, 'mql', _score, 'Auto-evaluated')
  ON CONFLICT DO NOTHING
  RETURNING id INTO _classification_id;

  IF _classification_id IS NULL THEN
    SELECT id INTO _classification_id FROM public.mql_classifications
    WHERE user_id = auth.uid() AND contact_id = _contact_id
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'qualified', true,
    'score', _score,
    'criteria_id', _matched,
    'classification_id', _classification_id
  );
END;
$$;

-- =========================
-- RPC: enroll_contact_in_workflow
-- =========================
CREATE OR REPLACE FUNCTION public.enroll_contact_in_workflow(_workflow_id UUID, _contact_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.nurturing_executions (user_id, workflow_id, contact_id, status, next_action_at)
  VALUES (auth.uid(), _workflow_id, _contact_id, 'active', now())
  ON CONFLICT (workflow_id, contact_id) DO UPDATE
    SET status = 'active', next_action_at = COALESCE(public.nurturing_executions.next_action_at, now())
  RETURNING id INTO _id;

  UPDATE public.nurturing_workflows SET enrolled_count = enrolled_count + 1 WHERE id = _workflow_id;

  RETURN _id;
END;
$$;