-- Create notification logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'whatsapp' | 'email'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(reminder_id, channel)
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notification logs" 
    ON public.notification_logs FOR SELECT 
    USING (auth.uid() = user_id);
