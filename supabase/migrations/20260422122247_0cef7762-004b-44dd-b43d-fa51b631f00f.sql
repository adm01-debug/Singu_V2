CREATE TABLE public.ficha360_conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  filters_hash text NOT NULL,
  interaction_ids uuid[] NOT NULL,
  filters_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL,
  model text NOT NULL,
  interactions_analyzed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_f360_summ_user_contact ON public.ficha360_conversation_summaries (user_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_f360_summ_hash ON public.ficha360_conversation_summaries (user_id, contact_id, filters_hash, created_at DESC);

ALTER TABLE public.ficha360_conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own f360 summaries"
  ON public.ficha360_conversation_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own f360 summaries"
  ON public.ficha360_conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own f360 summaries"
  ON public.ficha360_conversation_summaries FOR DELETE
  USING (auth.uid() = user_id);