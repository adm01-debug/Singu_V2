-- Ensure contacts table has version column (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'version') THEN
        ALTER TABLE public.contacts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Create follow_up_approvals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follow_up_approvals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'whatsapp', 'email', etc.
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'sent'
    reasoning TEXT, -- AI reasoning for this follow-up
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_ingestion_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.whatsapp_ingestion_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    message_id TEXT, -- remote ID from WhatsApp
    event_type TEXT NOT NULL, -- 'message', 'transcription', 'error'
    status TEXT NOT NULL, -- 'success', 'failed'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.follow_up_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ingestion_logs ENABLE ROW LEVEL SECURITY;

-- Policies for follow_up_approvals
CREATE POLICY "Users can view their own follow-up approvals" 
ON public.follow_up_approvals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own follow-up approvals" 
ON public.follow_up_approvals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-up approvals" 
ON public.follow_up_approvals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow-up approvals" 
ON public.follow_up_approvals FOR DELETE USING (auth.uid() = user_id);

-- Policies for whatsapp_ingestion_logs
CREATE POLICY "Users can view their own ingestion logs" 
ON public.whatsapp_ingestion_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingestion logs" 
ON public.whatsapp_ingestion_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on follow_up_approvals
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_follow_up_approvals_updated_at ON public.follow_up_approvals;
CREATE TRIGGER update_follow_up_approvals_updated_at
BEFORE UPDATE ON public.follow_up_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
