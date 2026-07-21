-- 1) Tabela de automações por threshold
CREATE TABLE public.lead_score_threshold_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('grade_reached','grade_dropped','score_above','score_below')),
  grade_target TEXT CHECK (grade_target IN ('A','B','C','D')),
  score_target INTEGER CHECK (score_target >= 0 AND score_target <= 100),
  action_type TEXT NOT NULL CHECK (action_type IN ('notify','create_task','enroll_sequence','webhook','tag')),
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  cooldown_hours INTEGER NOT NULL DEFAULT 24 CHECK (cooldown_hours >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  fired_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lsta_user_active ON public.lead_score_threshold_automations(user_id, active);

ALTER TABLE public.lead_score_threshold_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto select own" ON public.lead_score_threshold_automations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "auto insert own" ON public.lead_score_threshold_automations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auto update own" ON public.lead_score_threshold_automations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "auto delete own" ON public.lead_score_threshold_automations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_lsta_updated BEFORE UPDATE ON public.lead_score_threshold_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lsta_audit AFTER INSERT OR UPDATE OR DELETE ON public.lead_score_threshold_automations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 2) Log de disparos
CREATE TABLE public.lead_score_threshold_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  automation_id UUID NOT NULL REFERENCES public.lead_score_threshold_automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  from_grade TEXT,
  to_grade TEXT,
  from_score NUMERIC,
  to_score NUMERIC,
  action_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL DEFAULT true,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lstl_user_fired ON public.lead_score_threshold_log(user_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_lstl_automation ON public.lead_score_threshold_log(automation_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_lstl_contact ON public.lead_score_threshold_log(contact_id, fired_at DESC);

ALTER TABLE public.lead_score_threshold_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log select own" ON public.lead_score_threshold_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "log insert own" ON public.lead_score_threshold_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3) Atualizar seed para incluir regras de eventos de sequência
CREATE OR REPLACE FUNCTION public.seed_lead_score_defaults(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.lead_score_thresholds (user_id, grade, min_score) VALUES
    (_user_id, 'A', 80),
    (_user_id, 'B', 60),
    (_user_id, 'C', 40),
    (_user_id, 'D', 0)
  ON CONFLICT (user_id, grade) DO NOTHING;

  INSERT INTO public.lead_score_rules (user_id, dimension, signal_key, weight, decay_days) VALUES
    (_user_id, 'fit', 'company_present', 10, 365),
    (_user_id, 'fit', 'role_present', 8, 365),
    (_user_id, 'fit', 'email_present', 5, 365),
    (_user_id, 'fit', 'phone_present', 5, 365),
    (_user_id, 'engagement', 'interaction', 3, 30),
    (_user_id, 'engagement', 'recent_interaction_7d', 10, 14),
    (_user_id, 'engagement', 'email_open', 2, 14),
    (_user_id, 'engagement', 'email_click', 5, 14),
    (_user_id, 'engagement', 'email_reply', 12, 30),
    (_user_id, 'engagement', 'sequence_completed', 8, 30),
    (_user_id, 'intent', 'page_view', 2, 14),
    (_user_id, 'intent', 'pricing_view', 8, 14),
    (_user_id, 'intent', 'demo_request', 15, 30),
    (_user_id, 'intent', 'form_submit', 10, 21),
    (_user_id, 'intent', 'email_click', 4, 14),
    (_user_id, 'intent', 'content_download', 6, 21),
    (_user_id, 'relationship', 'relationship_score', 1, 60)
  ON CONFLICT (user_id, dimension, signal_key) DO NOTHING;
END;
$function$;

-- 4) Trigger ponte sequence_events -> intent_signals
CREATE OR REPLACE FUNCTION public.sequence_event_to_intent_signal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _signal_type TEXT;
  _weight NUMERIC := 1;
  _contact_id UUID;
  _user_id UUID;
BEGIN
  -- Map event_type to signal_type
  _signal_type := CASE NEW.event_type
    WHEN 'open' THEN 'email_open'
    WHEN 'opened' THEN 'email_open'
    WHEN 'click' THEN 'email_click'
    WHEN 'clicked' THEN 'email_click'
    WHEN 'reply' THEN 'email_reply'
    WHEN 'replied' THEN 'email_reply'
    WHEN 'completed' THEN 'sequence_completed'
    ELSE NULL
  END;

  IF _signal_type IS NULL THEN
    RETURN NEW;
  END IF;

  _weight := CASE _signal_type
    WHEN 'email_reply' THEN 3
    WHEN 'email_click' THEN 2
    WHEN 'sequence_completed' THEN 2
    ELSE 1
  END;

  -- Resolve contact + user via enrollment
  SELECT e.contact_id, e.user_id INTO _contact_id, _user_id
  FROM public.sequence_enrollments e
  WHERE e.id = NEW.enrollment_id
  LIMIT 1;

  IF _contact_id IS NULL OR _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.intent_signals (user_id, contact_id, signal_type, source, weight, occurred_at, metadata)
  VALUES (_user_id, _contact_id, _signal_type, 'sequence', _weight, COALESCE(NEW.created_at, now()),
          jsonb_build_object('enrollment_id', NEW.enrollment_id, 'event_type', NEW.event_type, 'sequence_event_id', NEW.id));

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail-safe: nunca quebrar a inserção do evento original
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tg_sequence_events_to_intent ON public.sequence_events;
CREATE TRIGGER tg_sequence_events_to_intent
AFTER INSERT ON public.sequence_events
FOR EACH ROW EXECUTE FUNCTION public.sequence_event_to_intent_signal();