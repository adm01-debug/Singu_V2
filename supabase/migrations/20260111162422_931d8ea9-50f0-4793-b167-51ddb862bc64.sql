-- Create table for Emotional Intelligence (EQ) analysis history
CREATE TABLE public.eq_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  
  -- Overall scores
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_level TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Pillar scores (stored as JSONB for flexibility)
  pillar_scores JSONB NOT NULL,
  
  -- Analysis details
  indicators JSONB,
  strengths TEXT[],
  areas_for_growth TEXT[],
  
  -- Sales implications
  sales_implications JSONB,
  communication_style JSONB,
  profile_summary TEXT,
  
  -- Timestamps
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Cognitive Biases analysis history
CREATE TABLE public.cognitive_bias_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  
  -- Detected biases (stored as JSONB array)
  detected_biases JSONB NOT NULL,
  
  -- Category distribution
  category_distribution JSONB,
  
  -- Dominant biases
  dominant_biases TEXT[],
  
  -- Sales strategies
  vulnerabilities TEXT[],
  resistances TEXT[],
  sales_strategies JSONB,
  
  -- Profile summary
  profile_summary TEXT,
  
  -- Timestamps
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.eq_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_bias_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for eq_analysis_history
CREATE POLICY "Users can view their own EQ analysis history" 
ON public.eq_analysis_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own EQ analysis history" 
ON public.eq_analysis_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own EQ analysis history" 
ON public.eq_analysis_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for cognitive_bias_history
CREATE POLICY "Users can view their own cognitive bias history" 
ON public.cognitive_bias_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cognitive bias history" 
ON public.cognitive_bias_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cognitive bias history" 
ON public.cognitive_bias_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_contact_id ON public.eq_analysis_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_user_id ON public.eq_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_analyzed_at ON public.eq_analysis_history(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_contact_id ON public.cognitive_bias_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_user_id ON public.cognitive_bias_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_analyzed_at ON public.cognitive_bias_history(analyzed_at DESC);