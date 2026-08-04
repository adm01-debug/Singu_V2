
-- Sequences (cadence templates)
CREATE TABLE public.sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  pause_on_reply boolean NOT NULL DEFAULT true,
  pause_on_meeting boolean NOT NULL DEFAULT false,
  max_enrollments integer DEFAULT 100,
  total_enrolled integer NOT NULL DEFAULT 0,
  total_completed integer NOT NULL DEFAULT 0,
  total_replied integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sequences" ON public.sequences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sequence Steps
CREATE TABLE public.sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES public.sequences(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL DEFAULT 1,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'call', 'linkedin', 'sms')),
  delay_days integer NOT NULL DEFAULT 1,
  delay_hours integer NOT NULL DEFAULT 0,
  subject text,
  message_template text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_order)
);

ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sequence steps" ON public.sequence_steps
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid()));

-- Sequence Enrollments
CREATE TABLE public.sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES public.sequences(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'replied', 'bounced', 'unsubscribed')),
  current_step integer NOT NULL DEFAULT 1,
  next_action_at timestamptz,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  replied_at timestamptz,
  last_step_executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, contact_id)
);

ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own enrollments" ON public.sequence_enrollments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
