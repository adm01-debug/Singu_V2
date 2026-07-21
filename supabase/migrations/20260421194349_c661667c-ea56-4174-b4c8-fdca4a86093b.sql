
CREATE TABLE public.sentiment_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('campanha','abordagem','release','reuniao','outro')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_annotations_contact_week
  ON public.sentiment_annotations (contact_id, week_start DESC);

ALTER TABLE public.sentiment_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sentiment annotations"
  ON public.sentiment_annotations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own sentiment annotations"
  ON public.sentiment_annotations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update sentiment annotations"
  ON public.sentiment_annotations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete sentiment annotations"
  ON public.sentiment_annotations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sentiment_annotations_updated_at
  BEFORE UPDATE ON public.sentiment_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
