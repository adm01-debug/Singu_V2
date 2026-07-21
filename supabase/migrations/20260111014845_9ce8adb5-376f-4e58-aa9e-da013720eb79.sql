-- Create metaprogram_analysis table
CREATE TABLE public.metaprogram_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  contact_id UUID NOT NULL,
  interaction_id UUID,
  
  -- Motivation Direction (Toward/Away From)
  toward_score INTEGER DEFAULT 0,
  away_from_score INTEGER DEFAULT 0,
  toward_words TEXT[] DEFAULT '{}',
  away_from_words TEXT[] DEFAULT '{}',
  
  -- Reference Frame (Internal/External)
  internal_score INTEGER DEFAULT 0,
  external_score INTEGER DEFAULT 0,
  internal_words TEXT[] DEFAULT '{}',
  external_words TEXT[] DEFAULT '{}',
  
  -- Working Style (Options/Procedures)
  options_score INTEGER DEFAULT 0,
  procedures_score INTEGER DEFAULT 0,
  options_words TEXT[] DEFAULT '{}',
  procedures_words TEXT[] DEFAULT '{}',
  
  analyzed_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.metaprogram_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own metaprogram analysis"
ON public.metaprogram_analysis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metaprogram analysis"
ON public.metaprogram_analysis FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metaprogram analysis"
ON public.metaprogram_analysis FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_contact ON public.metaprogram_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_user ON public.metaprogram_analysis(user_id);