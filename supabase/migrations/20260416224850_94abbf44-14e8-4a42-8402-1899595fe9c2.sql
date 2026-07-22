-- Eventos comportamentais de enrollments
CREATE TABLE public.sequence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.sequence_enrollments(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  user_id UUID NOT NULL,
  step_order INTEGER,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent','delivered','opened','clicked','replied','bounced','unsubscribed','visited_page','meeting_booked','failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seq_events_enrollment ON public.sequence_events(enrollment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seq_events_contact ON public.sequence_events(contact_id, event_type);
CREATE INDEX IF NOT EXISTS idx_seq_events_user ON public.sequence_events(user_id, created_at DESC);

ALTER TABLE public.sequence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sequence events" ON public.sequence_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sequence events" ON public.sequence_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access seq events" ON public.sequence_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Log de envios individuais por step
CREATE TABLE public.sequence_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.sequence_steps(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  user_id UUID NOT NULL,
  step_order INTEGER NOT NULL,
  channel TEXT NOT NULL,
  message_id TEXT,
  tracking_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped','bounced')),
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seq_send_log_enrollment ON public.sequence_send_log(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_seq_send_log_token ON public.sequence_send_log(tracking_token);
CREATE INDEX IF NOT EXISTS idx_seq_send_log_user ON public.sequence_send_log(user_id, sent_at DESC);

ALTER TABLE public.sequence_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sequence send log" ON public.sequence_send_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access seq send log" ON public.sequence_send_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Branching condicional nos steps
ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS condition_type TEXT NOT NULL DEFAULT 'always'
    CHECK (condition_type IN ('always','if_opened','if_clicked','if_not_opened','if_not_replied','if_replied')),
  ADD COLUMN IF NOT EXISTS condition_wait_hours INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branch_on_yes_step INTEGER,
  ADD COLUMN IF NOT EXISTS branch_on_no_step INTEGER;

-- Tracking de timing de envio
ALTER TABLE public.sequence_enrollments
  ADD COLUMN IF NOT EXISTS last_step_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ;