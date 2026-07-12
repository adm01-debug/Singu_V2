
CREATE TABLE public.behavioral_insight_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  insight_kind TEXT NOT NULL CHECK (insight_kind IN ('preference','hobby','tone')),
  insight_label TEXT NOT NULL CHECK (char_length(insight_label) BETWEEN 1 AND 200),
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT behavioral_insight_feedback_unique UNIQUE (user_id, contact_id, insight_kind, insight_label)
);

CREATE INDEX idx_bif_contact_kind ON public.behavioral_insight_feedback (contact_id, insight_kind);
CREATE INDEX idx_bif_user ON public.behavioral_insight_feedback (user_id);
CREATE INDEX idx_bif_label_vote ON public.behavioral_insight_feedback (insight_kind, insight_label, vote);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_insight_feedback TO authenticated;
GRANT ALL ON public.behavioral_insight_feedback TO service_role;

ALTER TABLE public.behavioral_insight_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own insight feedback"
  ON public.behavioral_insight_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own insight feedback"
  ON public.behavioral_insight_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own insight feedback"
  ON public.behavioral_insight_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own insight feedback"
  ON public.behavioral_insight_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_bif_updated_at
  BEFORE UPDATE ON public.behavioral_insight_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
