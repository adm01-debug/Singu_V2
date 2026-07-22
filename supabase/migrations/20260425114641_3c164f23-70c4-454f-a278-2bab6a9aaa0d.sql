CREATE TABLE public.objection_example_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  objection TEXT NOT NULL,
  category TEXT,
  interaction_id UUID NOT NULL,
  is_useful BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT objection_example_feedback_unique UNIQUE (user_id, objection, interaction_id)
);

CREATE INDEX IF NOT EXISTS idx_objection_example_feedback_user_objection
  ON public.objection_example_feedback (user_id, objection);

ALTER TABLE public.objection_example_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own objection feedback"
  ON public.objection_example_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own objection feedback"
  ON public.objection_example_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own objection feedback"
  ON public.objection_example_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own objection feedback"
  ON public.objection_example_feedback FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_objection_example_feedback_updated_at
  BEFORE UPDATE ON public.objection_example_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();