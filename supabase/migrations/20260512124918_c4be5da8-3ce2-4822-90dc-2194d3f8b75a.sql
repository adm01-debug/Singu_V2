-- Create the predictive roadmap table
CREATE TABLE IF NOT EXISTS public.contact_predictive_roadmap (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    forecast_month DATE NOT NULL,
    predicted_need TEXT NOT NULL,
    suggested_offering TEXT,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_predictive_roadmap ENABLE ROW LEVEL SECURITY;

-- Policies for predictive roadmap
CREATE POLICY "Users can view predictive roadmap for their contacts"
    ON public.contact_predictive_roadmap
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contacts c
            WHERE c.id = public.contact_predictive_roadmap.contact_id
            AND (c.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
        )
    );

CREATE POLICY "System can manage predictive roadmap"
    ON public.contact_predictive_roadmap
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create or update the objection intelligence table (already exists but ensuring schema)
CREATE TABLE IF NOT EXISTS public.crm_objection_intelligence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    objection_type TEXT NOT NULL,
    behavioral_profile TEXT,
    suggested_strategy TEXT NOT NULL,
    script_content TEXT,
    success_rate INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for objection intelligence
ALTER TABLE public.crm_objection_intelligence ENABLE ROW LEVEL SECURITY;

-- Policies for objection intelligence
CREATE POLICY "Users can view objection intelligence for their contacts"
    ON public.crm_objection_intelligence
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contacts c
            WHERE c.id = public.crm_objection_intelligence.contact_id
            AND (c.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
        )
    );

CREATE POLICY "System can manage objection intelligence"
    ON public.crm_objection_intelligence
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.contact_predictive_roadmap;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.contact_predictive_roadmap
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
