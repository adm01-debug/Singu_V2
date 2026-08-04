
CREATE TABLE IF NOT EXISTS public.contact_next_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  channel TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low','medium','high')),
  suggested_script TEXT,
  expected_outcome TEXT,
  signals_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_next_actions_user_contact
  ON public.contact_next_actions (user_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_next_actions_generated_at
  ON public.contact_next_actions (user_id, generated_at DESC);

ALTER TABLE public.contact_next_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own next actions"
  ON public.contact_next_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own next actions"
  ON public.contact_next_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own next actions"
  ON public.contact_next_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own next actions"
  ON public.contact_next_actions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_contact_next_actions_updated_at
  BEFORE UPDATE ON public.contact_next_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
