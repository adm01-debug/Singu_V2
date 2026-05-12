-- Create consent audit log table
CREATE TABLE IF NOT EXISTS public.crm_consent_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    ip_address TEXT,
    platform TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_consent_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own consent logs') THEN
        CREATE POLICY "Users can view their own consent logs" 
        ON public.crm_consent_audit_logs 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own consent logs') THEN
        CREATE POLICY "Users can insert their own consent logs" 
        ON public.crm_consent_audit_logs 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add index for performance with unique names
CREATE INDEX IF NOT EXISTS idx_crm_consent_audit_contact_id ON public.crm_consent_audit_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_consent_audit_user_id ON public.crm_consent_audit_logs(user_id);