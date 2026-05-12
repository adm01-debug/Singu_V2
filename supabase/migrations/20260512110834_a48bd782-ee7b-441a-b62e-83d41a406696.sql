-- Add new columns for enhanced Next Best Action tracking in the correct table
ALTER TABLE public.contact_next_actions 
ADD COLUMN IF NOT EXISTS edited_script TEXT,
ADD COLUMN IF NOT EXISTS contextual_tone TEXT,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS was_successful BOOLEAN DEFAULT true;

-- Ensure neuro_behavioral_history has all needed fields for mastery
ALTER TABLE public.neuro_behavioral_history
ADD COLUMN IF NOT EXISTS empathy_trend JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS language_complexity_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS response_synchronicity FLOAT DEFAULT 0.0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cna_contact_id ON public.contact_next_actions(contact_id);
CREATE INDEX IF NOT EXISTS idx_neuro_history_contact_id ON public.neuro_behavioral_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions(contact_id);

-- Add a column to track which user resolved an escalation
ALTER TABLE public.contact_automation_settings
ADD COLUMN IF NOT EXISTS last_escalation_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
