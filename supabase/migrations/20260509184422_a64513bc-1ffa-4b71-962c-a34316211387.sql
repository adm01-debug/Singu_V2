-- Create rapport strategy table
CREATE TABLE public.contact_rapport_strategy (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    
    -- Sensory Channels (Extended VAK)
    visual_preference_score INTEGER CHECK (visual_preference_score >= 0 AND visual_preference_score <= 100),
    auditory_preference_score INTEGER CHECK (auditory_preference_score >= 0 AND auditory_preference_score <= 100),
    kinesthetic_preference_score INTEGER CHECK (kinesthetic_preference_score >= 0 AND kinesthetic_preference_score <= 100),
    digital_preference_score INTEGER CHECK (digital_preference_score >= 0 AND digital_preference_score <= 100), -- NLP Digital (Logic/Facts)
    
    -- Emotional Anchors
    emotional_anchors TEXT[], -- Key words or topics that create positive state
    resistance_triggers TEXT[], -- Topics to avoid
    
    -- Communication Style
    pacing_speed TEXT CHECK (pacing_speed IN ('slow', 'medium', 'fast')),
    voice_tone_preferred TEXT,
    mirroring_technique TEXT,
    
    -- Mental Triggers
    preferred_triggers TEXT[], -- e.g., ['scarcity', 'authority', 'social_proof']
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_rapport_strategy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users on rapport" ON public.contact_rapport_strategy FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Register for audit
CREATE TRIGGER log_contact_rapport_change AFTER UPDATE ON public.contact_rapport_strategy FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();

-- Update updated_at trigger
CREATE TRIGGER update_contact_rapport_updated_at BEFORE UPDATE ON public.contact_rapport_strategy FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
