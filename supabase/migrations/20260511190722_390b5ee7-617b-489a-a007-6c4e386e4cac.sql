-- Add validation columns to VAK analysis
ALTER TABLE public.vak_analysis_history 
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

-- Add validation columns to Metaprogram analysis
ALTER TABLE public.metaprogram_analysis 
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

-- Enhance Reframing Analysis
ALTER TABLE public.reframing_analysis
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Create indexes for searching by VAK and Metaprograms if they don't exist
-- Note: These scores are numeric, so we can index them for range queries.
CREATE INDEX IF NOT EXISTS idx_vak_visual_score ON public.vak_analysis_history(visual_score);
CREATE INDEX IF NOT EXISTS idx_vak_auditory_score ON public.vak_analysis_history(auditory_score);
CREATE INDEX IF NOT EXISTS idx_vak_kinesthetic_score ON public.vak_analysis_history(kinesthetic_score);
CREATE INDEX IF NOT EXISTS idx_metaprogram_toward_score ON public.metaprogram_analysis(toward_score);
CREATE INDEX IF NOT EXISTS idx_metaprogram_away_from_score ON public.metaprogram_analysis(away_from_score);
