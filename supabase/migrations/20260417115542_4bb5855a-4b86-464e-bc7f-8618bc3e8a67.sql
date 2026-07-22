-- ============ EMAIL VERIFICATIONS ============
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('valid','invalid','risky','unknown','catchall')),
  score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  mx_found BOOLEAN NOT NULL DEFAULT false,
  smtp_check BOOLEAN NOT NULL DEFAULT false,
  disposable BOOLEAN NOT NULL DEFAULT false,
  role_account BOOLEAN NOT NULL DEFAULT false,
  free_provider BOOLEAN NOT NULL DEFAULT false,
  reasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  provider TEXT NOT NULL DEFAULT 'internal',
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_verif_user ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_contact ON public.email_verifications(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_email ON public.email_verifications(lower(email));
CREATE INDEX IF NOT EXISTS idx_email_verif_verified_at ON public.email_verifications(verified_at DESC);
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev_select_own" ON public.email_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ev_insert_own" ON public.email_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ev_update_own" ON public.email_verifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ev_delete_own" ON public.email_verifications FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_ev_updated_at BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PHONE VALIDATIONS ============
CREATE TABLE public.phone_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  phone_input TEXT NOT NULL,
  phone_e164 TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('valid','invalid','unreachable','unknown')),
  line_type TEXT CHECK (line_type IN ('mobile','landline','voip','toll_free','premium','unknown')),
  country TEXT,
  country_code TEXT,
  carrier TEXT,
  is_active BOOLEAN,
  reasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  provider TEXT NOT NULL DEFAULT 'libphonenumber',
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_phone_val_user ON public.phone_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_val_contact ON public.phone_validations(contact_id);
CREATE INDEX IF NOT EXISTS idx_phone_val_e164 ON public.phone_validations(phone_e164);
CREATE INDEX IF NOT EXISTS idx_phone_val_validated_at ON public.phone_validations(validated_at DESC);
ALTER TABLE public.phone_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_select_own" ON public.phone_validations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pv_insert_own" ON public.phone_validations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pv_update_own" ON public.phone_validations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pv_delete_own" ON public.phone_validations FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_pv_updated_at BEFORE UPDATE ON public.phone_validations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EMAIL FINDER RESULTS ============
CREATE TABLE public.email_finder_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  domain TEXT NOT NULL,
  candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_email TEXT,
  best_confidence INT NOT NULL DEFAULT 0 CHECK (best_confidence BETWEEN 0 AND 100),
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  found_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_efr_user ON public.email_finder_results(user_id);
CREATE INDEX IF NOT EXISTS idx_efr_contact ON public.email_finder_results(contact_id);
CREATE INDEX IF NOT EXISTS idx_efr_domain ON public.email_finder_results(domain);
ALTER TABLE public.email_finder_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "efr_select_own" ON public.email_finder_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "efr_insert_own" ON public.email_finder_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "efr_update_own" ON public.email_finder_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "efr_delete_own" ON public.email_finder_results FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_efr_updated_at BEFORE UPDATE ON public.email_finder_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PEOPLE INTELLIGENCE EVENTS ============
CREATE TABLE public.people_intelligence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('job_change','promotion','company_change','title_change','linkedin_update','social_event','other')),
  old_value TEXT,
  new_value TEXT,
  field_name TEXT,
  source TEXT NOT NULL DEFAULT 'system_trigger',
  confidence INT NOT NULL DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pie_user ON public.people_intelligence_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pie_contact ON public.people_intelligence_events(contact_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pie_type ON public.people_intelligence_events(event_type);
ALTER TABLE public.people_intelligence_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pie_select_own" ON public.people_intelligence_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pie_insert_own" ON public.people_intelligence_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pie_delete_own" ON public.people_intelligence_events FOR DELETE USING (auth.uid() = user_id);

-- ============ TRIGGER: detecta mudanças em contacts ============
CREATE OR REPLACE FUNCTION public.detect_contact_intel_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- title_change
  IF NEW.role_title IS DISTINCT FROM OLD.role_title 
     AND COALESCE(trim(NEW.role_title), '') <> '' THEN
    INSERT INTO public.people_intelligence_events
      (user_id, contact_id, event_type, field_name, old_value, new_value, source, metadata)
    VALUES (
      NEW.user_id, NEW.id,
      CASE WHEN OLD.company_id IS NOT DISTINCT FROM NEW.company_id THEN 'promotion' ELSE 'title_change' END,
      'role_title',
      OLD.role_title, NEW.role_title,
      'contacts_trigger',
      jsonb_build_object('company_id', NEW.company_id)
    );
  END IF;

  -- company_change
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    INSERT INTO public.people_intelligence_events
      (user_id, contact_id, event_type, field_name, old_value, new_value, source, metadata)
    VALUES (
      NEW.user_id, NEW.id, 'company_change', 'company_id',
      OLD.company_id::text, NEW.company_id::text,
      'contacts_trigger',
      jsonb_build_object('role_title', NEW.role_title)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_detect_contact_intel ON public.contacts;
CREATE TRIGGER trg_detect_contact_intel
AFTER UPDATE ON public.contacts
FOR EACH ROW
WHEN (OLD.role_title IS DISTINCT FROM NEW.role_title OR OLD.company_id IS DISTINCT FROM NEW.company_id)
EXECUTE FUNCTION public.detect_contact_intel_changes();