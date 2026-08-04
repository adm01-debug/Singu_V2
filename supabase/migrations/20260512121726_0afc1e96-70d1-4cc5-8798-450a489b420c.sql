-- Table for objection handling scripts
CREATE TABLE IF NOT EXISTS public.contact_objection_scripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    objection_type TEXT NOT NULL,
    script_content TEXT NOT NULL,
    neurological_bias TEXT,
    effectiveness_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_objection_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view objection scripts for their contacts" 
ON public.contact_objection_scripts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert objection scripts for their contacts" 
ON public.contact_objection_scripts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
