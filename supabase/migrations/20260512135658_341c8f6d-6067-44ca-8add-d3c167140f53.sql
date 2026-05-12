-- Create crm_objection_intelligence table
CREATE TABLE IF NOT EXISTS public.crm_objection_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    objection_type TEXT NOT NULL,
    behavioral_profile TEXT,
    suggested_strategy TEXT,
    script_content TEXT,
    success_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_objection_intelligence ENABLE ROW LEVEL SECURITY;

-- Create policies (admin only or authenticated users for now)
CREATE POLICY "Enable all for authenticated users" ON public.crm_objection_intelligence
    FOR ALL USING (auth.role() = 'authenticated');
