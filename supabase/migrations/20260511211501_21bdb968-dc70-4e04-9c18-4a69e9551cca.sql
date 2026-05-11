-- Create contact automation settings table
CREATE TABLE IF NOT EXISTS public.contact_automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    reminder_enabled BOOLEAN DEFAULT true,
    escalation_enabled BOOLEAN DEFAULT false,
    delay_hours INTEGER DEFAULT 24,
    escalation_role TEXT DEFAULT 'supervisor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_automation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own contact automation settings" 
ON public.contact_automation_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- Update contact_next_actions
ALTER TABLE public.contact_next_actions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Trigger to update updated_at
CREATE TRIGGER update_contact_automation_settings_updated_at
BEFORE UPDATE ON public.contact_automation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
