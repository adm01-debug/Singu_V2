-- Brain Dominance Analysis Table
CREATE TABLE IF NOT EXISTS public.brain_dominance_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    reptilian_score INTEGER DEFAULT 0,
    limbic_score INTEGER DEFAULT 0,
    neocortex_score INTEGER DEFAULT 0,
    dominant_system TEXT, -- 'reptilian', 'limbic', 'neocortex'
    recommendations JSONB DEFAULT '[]',
    negotiation_tips JSONB DEFAULT '[]',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brain_dominance_analysis ENABLE ROW LEVEL SECURITY;

-- Policies for brain_dominance_analysis
CREATE POLICY "Users can view brain dominance analysis" ON public.brain_dominance_analysis FOR SELECT USING (true);
CREATE POLICY "Users can insert brain dominance analysis" ON public.brain_dominance_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update brain dominance analysis" ON public.brain_dominance_analysis FOR UPDATE USING (true);

-- Neuro-PNL Sessions Table
CREATE TABLE IF NOT EXISTS public.neuro_pnl_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    conversation_id TEXT, -- Reference to a conversation/interaction
    session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    technique_used TEXT,
    results_summary TEXT,
    emotional_state_before TEXT,
    emotional_state_after TEXT,
    anchors_installed JSONB DEFAULT '[]',
    next_steps TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neuro_pnl_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for neuro_pnl_sessions
CREATE POLICY "Users can view neuro pnl sessions" ON public.neuro_pnl_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert neuro pnl sessions" ON public.neuro_pnl_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update neuro pnl sessions" ON public.neuro_pnl_sessions FOR UPDATE USING (true);

-- WhatsApp Messages & Transcriptions Index
CREATE TABLE IF NOT EXISTS public.whatsapp_messages_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    message_sid TEXT UNIQUE,
    content TEXT,
    message_type TEXT, -- 'text', 'audio', 'image'
    transcription TEXT,
    sentiment TEXT,
    intent TEXT,
    neuro_tags JSONB DEFAULT '[]', -- Tags based on PNL/Neuromarketing analysis
    received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages_index ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_messages_index
CREATE POLICY "Users can view whatsapp messages index" ON public.whatsapp_messages_index FOR SELECT USING (true);
CREATE POLICY "Users can insert whatsapp messages index" ON public.whatsapp_messages_index FOR INSERT WITH CHECK (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_brain_dominance
BEFORE UPDATE ON public.brain_dominance_analysis
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_neuro_pnl_sessions
BEFORE UPDATE ON public.neuro_pnl_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
