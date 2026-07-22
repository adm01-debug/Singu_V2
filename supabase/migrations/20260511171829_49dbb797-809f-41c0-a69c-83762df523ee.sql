-- Create suggested_life_events table
CREATE TABLE public.suggested_life_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'promotion', 'travel', 'family', 'achievement', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    source_type TEXT NOT NULL CHECK (source_type IN ('social', 'conversation', 'email', 'manual_suggestion')),
    confidence FLOAT DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggested_life_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own suggested life events"
ON public.suggested_life_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggested life events"
ON public.suggested_life_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggested life events"
ON public.suggested_life_events FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage suggested life events"
ON public.suggested_life_events FOR ALL
USING (true)
WITH CHECK (true);

-- Add index
CREATE INDEX IF NOT EXISTS idx_suggested_life_events_contact_id ON public.suggested_life_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_suggested_life_events_status ON public.suggested_life_events(status);

-- Add trigger for updated_at
CREATE TRIGGER update_suggested_life_events_updated_at
BEFORE UPDATE ON public.suggested_life_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
