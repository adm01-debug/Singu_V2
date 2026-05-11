-- Add validation and feedback columns to NLP analysis tables
ALTER TABLE public.vak_analysis_history 
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

ALTER TABLE public.metaprogram_analysis 
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

-- Update the audit view to include feedback columns (dropping and recreating to update schema)
DROP VIEW IF EXISTS public.v_contact_behavior_audit;
CREATE OR REPLACE VIEW public.v_contact_behavior_audit AS
SELECT 
    id,
    contact_id,
    user_id,
    'vak' as analysis_type,
    created_at as timestamp,
    analyzed_text,
    is_validated,
    user_feedback
FROM public.vak_analysis_history
UNION ALL
SELECT 
    id,
    contact_id,
    user_id,
    'metaprogram' as analysis_type,
    created_at as timestamp,
    analyzed_text,
    is_validated,
    user_feedback
FROM public.metaprogram_analysis;

-- Ensure RLS is enabled and policies exist for the new columns
-- (Assuming base policies already exist, we just need to ensure the columns are accessible)
