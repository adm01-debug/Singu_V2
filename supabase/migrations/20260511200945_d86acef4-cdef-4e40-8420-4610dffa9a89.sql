-- Update contacts table to store NLP profiles
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS vak_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS metaprogram_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS objection_patterns JSONB DEFAULT '[]'::jsonb;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_contacts_vak ON public.contacts USING GIN (vak_profile);
CREATE INDEX IF NOT EXISTS idx_contacts_metaprograms ON public.contacts USING GIN (metaprogram_profile);

-- Update interactions table to store point-in-time analysis
ALTER TABLE public.interactions
ADD COLUMN IF NOT EXISTS nlp_analysis JSONB DEFAULT '{}'::jsonb;

-- Create feedback system table if it doesn't exist (already mentioned in context but let's ensure it's robust)
CREATE TABLE IF NOT EXISTS public.nlp_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    contact_id UUID REFERENCES public.contacts(id),
    interaction_id UUID REFERENCES public.interactions(id),
    analysis_type TEXT NOT NULL, -- 'vak', 'metaprogram', 'reframing'
    original_detection JSONB,
    adjusted_value JSONB,
    is_correct BOOLEAN,
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on feedback table
ALTER TABLE public.nlp_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nlp_feedback
CREATE POLICY "Users can view their own feedback" 
ON public.nlp_feedback FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" 
ON public.nlp_feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add column for refined suggested responses based on feedback
ALTER TABLE public.reframing_analysis
ADD COLUMN IF NOT EXISTS validation_feedback JSONB DEFAULT '{}'::jsonb;
