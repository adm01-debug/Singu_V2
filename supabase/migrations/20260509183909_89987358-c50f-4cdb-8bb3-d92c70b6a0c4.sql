-- Create metaprograms table
CREATE TABLE public.contact_metaprograms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    
    -- Motivation Direction
    toward_score INTEGER CHECK (toward_score >= 0 AND toward_score <= 100),
    away_from_score INTEGER CHECK (away_from_score >= 0 AND away_from_score <= 100),
    
    -- Source of Authority
    internal_score INTEGER CHECK (internal_score >= 0 AND internal_score <= 100),
    external_score INTEGER CHECK (external_score >= 0 AND external_score <= 100),
    
    -- Reason/Decision Style
    options_score INTEGER CHECK (options_score >= 0 AND options_score <= 100),
    procedures_score INTEGER CHECK (procedures_score >= 0 AND procedures_score <= 100),
    
    -- Action Style
    proactive_score INTEGER CHECK (proactive_score >= 0 AND proactive_score <= 100),
    reactive_score INTEGER CHECK (reactive_score >= 0 AND reactive_score <= 100),
    
    -- Chunk Size
    global_score INTEGER CHECK (global_score >= 0 AND global_score <= 100),
    detail_score INTEGER CHECK (detail_score >= 0 AND detail_score <= 100),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_metaprograms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users on metaprograms" ON public.contact_metaprograms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Register for audit
CREATE TRIGGER log_contact_metaprograms_change AFTER UPDATE ON public.contact_metaprograms FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();

-- Update updated_at trigger
CREATE TRIGGER update_contact_metaprograms_updated_at BEFORE UPDATE ON public.contact_metaprograms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
