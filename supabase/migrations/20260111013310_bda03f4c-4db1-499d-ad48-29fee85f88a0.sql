-- Add VAK (Visual/Auditory/Kinesthetic) profile fields to contacts table
-- This extends the behavior JSON to include NLP representational system data

-- Note: The VAK data will be stored in the existing behavior JSONB column
-- No schema changes needed as we're using the flexible JSONB structure

-- Create a table for VAK predicates analysis from interactions
CREATE TABLE IF NOT EXISTS public.vak_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  visual_score NUMERIC(5,2) DEFAULT 0,
  auditory_score NUMERIC(5,2) DEFAULT 0,
  kinesthetic_score NUMERIC(5,2) DEFAULT 0,
  digital_score NUMERIC(5,2) DEFAULT 0,
  visual_words TEXT[] DEFAULT '{}',
  auditory_words TEXT[] DEFAULT '{}',
  kinesthetic_words TEXT[] DEFAULT '{}',
  digital_words TEXT[] DEFAULT '{}',
  analyzed_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vak_analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own VAK analysis"
ON public.vak_analysis_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own VAK analysis"
ON public.vak_analysis_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own VAK analysis"
ON public.vak_analysis_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vak_analysis_contact ON public.vak_analysis_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_vak_analysis_user ON public.vak_analysis_history(user_id);