CREATE TABLE IF NOT EXISTS public.applied_objection_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objection TEXT NOT NULL,
  category TEXT,
  response_text TEXT,
  interaction_id UUID,
  note TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.applied_objection_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applied responses"
  ON public.applied_objection_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applied responses"
  ON public.applied_objection_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applied responses"
  ON public.applied_objection_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applied responses"
  ON public.applied_objection_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS applied_objection_responses_user_applied_at_idx
  ON public.applied_objection_responses (user_id, applied_at DESC);

-- lower() é IMMUTABLE; a normalização adicional (remover acentos) é feita no client.
CREATE INDEX IF NOT EXISTS applied_objection_responses_user_objection_lower_idx
  ON public.applied_objection_responses (user_id, lower(objection));

CREATE TRIGGER update_applied_objection_responses_updated_at
  BEFORE UPDATE ON public.applied_objection_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();