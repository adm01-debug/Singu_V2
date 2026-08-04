-- Create score_history table for persistent scores
CREATE TABLE public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('closing', 'health', 'churn', 'relationship', 'satisfaction')),
  score_value NUMERIC(5,2) NOT NULL,
  previous_value NUMERIC(5,2),
  factors JSONB,
  metadata JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_score_history_contact_id ON public.score_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_score_history_user_id ON public.score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_score_type ON public.score_history(score_type);
CREATE INDEX IF NOT EXISTS idx_score_history_calculated_at ON public.score_history(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_composite ON public.score_history(contact_id, score_type, calculated_at DESC);

-- Enable RLS
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own score history"
ON public.score_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own score history"
ON public.score_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own score history"
ON public.score_history
FOR DELETE
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.score_history IS 'Historical record of all calculated scores for contacts';