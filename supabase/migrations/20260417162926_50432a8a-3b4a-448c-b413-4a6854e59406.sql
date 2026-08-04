CREATE TABLE public.email_thread_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  thread_key TEXT NOT NULL,
  interaction_ids UUID[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL,
  key_points TEXT[] NOT NULL DEFAULT '{}',
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sentiment TEXT,
  next_steps TEXT[] NOT NULL DEFAULT '{}',
  generated_by_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, thread_key)
);

ALTER TABLE public.email_thread_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email thread summaries"
  ON public.email_thread_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own email thread summaries"
  ON public.email_thread_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own email thread summaries"
  ON public.email_thread_summaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own email thread summaries"
  ON public.email_thread_summaries FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ets_user_thread ON public.email_thread_summaries (user_id, thread_key);
CREATE INDEX IF NOT EXISTS idx_ets_user_created ON public.email_thread_summaries (user_id, created_at DESC);

CREATE TRIGGER update_email_thread_summaries_updated_at
  BEFORE UPDATE ON public.email_thread_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();