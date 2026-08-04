
-- ─── Estender lead_scores ───
ALTER TABLE public.lead_scores
  ADD COLUMN IF NOT EXISTS computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS decay_applied_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Drop antigo check de grade (se existir) e recriar aceitando ambos schemes
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.lead_scores'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%grade%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lead_scores DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.lead_scores
  ADD CONSTRAINT lead_scores_grade_check
  CHECK (grade IN ('A','B','C','D','cold','warm','hot','on_fire'));

-- Default novo: 'D'
ALTER TABLE public.lead_scores ALTER COLUMN grade SET DEFAULT 'D';

-- Audit trigger se ainda não existir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_lead_scores_audit') THEN
    CREATE TRIGGER tg_lead_scores_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.lead_scores
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
  END IF;
END $$;

-- Updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_lead_scores_updated') THEN
    CREATE TRIGGER tg_lead_scores_updated
      BEFORE UPDATE ON public.lead_scores
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ─── Estender lead_score_history ───
ALTER TABLE public.lead_score_history
  ADD COLUMN IF NOT EXISTS breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_lead_score_history_user
  ON public.lead_score_history (user_id, recorded_at DESC);

-- ─── lead_score_rules (NOVA) ───
CREATE TABLE IF NOT EXISTS public.lead_score_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('fit','engagement','intent','relationship')),
  signal_key TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1,
  decay_days INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dimension, signal_key)
);
CREATE INDEX IF NOT EXISTS idx_lead_score_rules_user ON public.lead_score_rules (user_id, active);
ALTER TABLE public.lead_score_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "lead_score_rules_select_own" ON public.lead_score_rules FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_rules_insert_own" ON public.lead_score_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_rules_update_own" ON public.lead_score_rules FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_rules_delete_own" ON public.lead_score_rules FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER tg_lead_score_rules_updated BEFORE UPDATE ON public.lead_score_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── lead_score_thresholds (NOVA) ───
CREATE TABLE IF NOT EXISTS public.lead_score_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A','B','C','D')),
  min_score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, grade)
);
ALTER TABLE public.lead_score_thresholds ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "lead_score_thresholds_select_own" ON public.lead_score_thresholds FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_thresholds_insert_own" ON public.lead_score_thresholds FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_thresholds_update_own" ON public.lead_score_thresholds FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_thresholds_delete_own" ON public.lead_score_thresholds FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER tg_lead_score_thresholds_updated BEFORE UPDATE ON public.lead_score_thresholds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── lead_score_recompute_queue (NOVA) ───
CREATE TABLE IF NOT EXISTS public.lead_score_recompute_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT 'manual',
  enqueued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_score_queue_pending
  ON public.lead_score_recompute_queue (enqueued_at)
  WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_score_queue_user_contact
  ON public.lead_score_recompute_queue (user_id, contact_id) WHERE processed_at IS NULL;

ALTER TABLE public.lead_score_recompute_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "lead_score_queue_select_own" ON public.lead_score_recompute_queue FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_score_queue_insert_own" ON public.lead_score_recompute_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Defaults seeder ───
CREATE OR REPLACE FUNCTION public.seed_lead_score_defaults(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    (_user_id, 'intent', 'page_view', 2, 14),
    (_user_id, 'intent', 'pricing_view', 8, 14),
    (_user_id, 'intent', 'demo_request', 15, 30),
    (_user_id, 'intent', 'form_submit', 10, 21),
    (_user_id, 'intent', 'email_click', 4, 14),
    (_user_id, 'intent', 'content_download', 6, 21),
    (_user_id, 'relationship', 'relationship_score', 1, 60)
  ON CONFLICT (user_id, dimension, signal_key) DO NOTHING;
END;
$$;

-- ─── Trigger: enqueue on intent signal ───
CREATE OR REPLACE FUNCTION public.trigger_lead_score_recompute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    INSERT INTO public.lead_score_recompute_queue (user_id, contact_id, reason)
    SELECT NEW.user_id, NEW.contact_id, 'intent_signal'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_score_recompute_queue
      WHERE user_id = NEW.user_id
        AND contact_id = NEW.contact_id
        AND processed_at IS NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_intent_signals_enqueue_score') THEN
    CREATE TRIGGER tg_intent_signals_enqueue_score
      AFTER INSERT ON public.intent_signals
      FOR EACH ROW EXECUTE FUNCTION public.trigger_lead_score_recompute();
  END IF;
END $$;
