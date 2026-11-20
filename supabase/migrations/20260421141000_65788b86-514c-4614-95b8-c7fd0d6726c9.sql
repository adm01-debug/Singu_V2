-- [singu-idem] type 'public.passo_outcome'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'passo_outcome' AND n.nspname = 'public') THEN
        EXECUTE $sql$ CREATE TYPE public.passo_outcome AS ENUM (
  'respondeu_positivo',
  'respondeu_neutro',
  'nao_respondeu',
  'nao_atendeu',
  'pulou'
) $sql$;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.proximo_passo_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL,
  passo_id TEXT NOT NULL,
  outcome public.passo_outcome NOT NULL,
  channel_used TEXT,
  notes TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proximo_passo_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own passo feedbacks" ON public.proximo_passo_feedback;  -- [singu-idem]
CREATE POLICY "Users can view their own passo feedbacks"
  ON public.proximo_passo_feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own passo feedbacks" ON public.proximo_passo_feedback;  -- [singu-idem]
CREATE POLICY "Users can insert their own passo feedbacks"
  ON public.proximo_passo_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own passo feedbacks" ON public.proximo_passo_feedback;  -- [singu-idem]
CREATE POLICY "Users can delete their own passo feedbacks"
  ON public.proximo_passo_feedback FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ppf_user_contact_recent
  ON public.proximo_passo_feedback (user_id, contact_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ppf_user_contact_passo
  ON public.proximo_passo_feedback (user_id, contact_id, passo_id, executed_at DESC);