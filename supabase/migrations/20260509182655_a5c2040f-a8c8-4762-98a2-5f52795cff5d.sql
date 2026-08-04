-- Create contact_behavior table
CREATE TABLE public.contact_behavior (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    -- DISC
    disc_primary TEXT CHECK (disc_primary IN ('D', 'I', 'S', 'C')),
    disc_confidence INTEGER CHECK (disc_confidence >= 0 AND disc_confidence <= 100),
    disc_notes TEXT,
    -- VAK
    vak_primary TEXT CHECK (vak_primary IN ('visual', 'auditivo', 'cinestesico')),
    -- Motivations
    motivation_primary TEXT,
    main_fear TEXT,
    career_stage TEXT,
    current_pressure TEXT,
    professional_goals TEXT,
    -- Communication
    preferred_channel TEXT,
    message_style TEXT,
    response_time_avg INTERVAL,
    best_contact_window TEXT,
    formality_level INTEGER CHECK (formality_level >= 1 AND formality_level <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Create contact_decision_making table
CREATE TABLE public.contact_decision_making (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    decision_speed TEXT,
    decision_criteria TEXT[],
    needs_approval BOOLEAN DEFAULT false,
    approver_id UUID REFERENCES public.contacts(id),
    budget_authority TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Create contact_influence table
CREATE TABLE public.contact_influence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    decision_role TEXT,
    decision_power INTEGER CHECK (decision_power >= 1 AND decision_power <= 10),
    support_level INTEGER CHECK (support_level >= 1 AND support_level <= 10),
    influencer_ids UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Create contact_business_context table
CREATE TABLE public.contact_business_context (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    financial_health TEXT,
    current_challenges TEXT[],
    competitors_used TEXT[],
    best_moment_to_approach TEXT,
    seasonal_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_decision_making ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_influence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_business_context ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for development, assuming auth user can access their data)
CREATE POLICY "Allow all for authenticated users on behavior" ON public.contact_behavior FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users on decision" ON public.contact_decision_making FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users on influence" ON public.contact_influence FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users on business_context" ON public.contact_business_context FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Timestamps triggers
CREATE TRIGGER update_contact_behavior_updated_at BEFORE UPDATE ON public.contact_behavior FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_decision_making_updated_at BEFORE UPDATE ON public.contact_decision_making FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_influence_updated_at BEFORE UPDATE ON public.contact_influence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_business_context_updated_at BEFORE UPDATE ON public.contact_business_context FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
