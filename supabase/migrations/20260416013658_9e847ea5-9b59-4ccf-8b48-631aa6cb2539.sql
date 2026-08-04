
CREATE TABLE public.meeting_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  summary TEXT NOT NULL,
  key_decisions TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]',
  participants TEXT[] DEFAULT '{}',
  sentiment_overview TEXT,
  topics TEXT[] DEFAULT '{}',
  next_steps TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  generated_by_model TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meeting summaries"
  ON public.meeting_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meeting summaries"
  ON public.meeting_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meeting summaries"
  ON public.meeting_summaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting summaries"
  ON public.meeting_summaries FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_meeting_summaries_interaction ON public.meeting_summaries(interaction_id);

CREATE TRIGGER update_meeting_summaries_updated_at
  BEFORE UPDATE ON public.meeting_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
