-- Add versioning/history for neuro-behavioral insights if not exists
CREATE TABLE IF NOT EXISTS public.neuro_behavioral_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    dominance_data JSONB,
    neuromarketing_data JSONB,
    empathy_score NUMERIC,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for neuro_behavioral_history
ALTER TABLE public.neuro_behavioral_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact's neuro history"
ON public.neuro_behavioral_history FOR SELECT
USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

CREATE POLICY "Users can insert their own contact's neuro history"
ON public.neuro_behavioral_history FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

-- Audit log for consent (OSINT/Social)
CREATE TABLE IF NOT EXISTS public.social_consent_audit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    network TEXT NOT NULL,
    source_url TEXT,
    consent_type TEXT DEFAULT 'public_data_osint',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for social_consent_audit
ALTER TABLE public.social_consent_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent logs"
ON public.social_consent_audit FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert consent logs"
ON public.social_consent_audit FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enhance contact_next_actions for deeper integration if table exists
-- (Added check to prevent errors)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_next_actions') THEN
        ALTER TABLE public.contact_next_actions ADD COLUMN IF NOT EXISTS suggested_date TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.contact_next_actions ADD COLUMN IF NOT EXISTS script_context JSONB;
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_neuro_history_contact ON public.neuro_behavioral_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_contact ON public.social_consent_audit(contact_id);
