
CREATE TABLE public.behavioral_profile_regen_queue (
  contact_id UUID PRIMARY KEY REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enqueued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  last_processed_at TIMESTAMPTZ,
  trigger_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bpr_queue_next_run ON public.behavioral_profile_regen_queue (next_run_at) WHERE attempts < 5;

GRANT SELECT ON public.behavioral_profile_regen_queue TO authenticated;
GRANT ALL ON public.behavioral_profile_regen_queue TO service_role;

ALTER TABLE public.behavioral_profile_regen_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own queue items"
ON public.behavioral_profile_regen_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enqueue_behavioral_profile_regen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id UUID;
  v_user_id UUID;
  v_source TEXT := TG_TABLE_NAME;
BEGIN
  v_contact_id := NEW.contact_id;
  IF v_contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user_id FROM public.contacts WHERE id = v_contact_id;
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.behavioral_profile_regen_queue (contact_id, user_id, next_run_at, trigger_source, enqueued_at, updated_at)
  VALUES (v_contact_id, v_user_id, now() + INTERVAL '5 minutes', v_source, now(), now())
  ON CONFLICT (contact_id) DO UPDATE
    SET next_run_at = GREATEST(behavioral_profile_regen_queue.next_run_at, now() + INTERVAL '5 minutes'),
        trigger_source = EXCLUDED.trigger_source,
        updated_at = now(),
        attempts = 0,
        last_error = NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_bpr_whatsapp
AFTER INSERT ON public.whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION public.enqueue_behavioral_profile_regen();

CREATE TRIGGER trg_enqueue_bpr_calls
AFTER INSERT ON public.call_logs
FOR EACH ROW EXECUTE FUNCTION public.enqueue_behavioral_profile_regen();

CREATE TRIGGER trg_enqueue_bpr_interactions
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.enqueue_behavioral_profile_regen();

CREATE OR REPLACE FUNCTION public.update_bpr_queue_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_bpr_queue_updated_at
BEFORE UPDATE ON public.behavioral_profile_regen_queue
FOR EACH ROW EXECUTE FUNCTION public.update_bpr_queue_updated_at();
