-- Create table for predictive roadmap
CREATE TABLE IF NOT EXISTS public.contact_predictive_roadmap (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    forecast_month DATE NOT NULL,
    predicted_need TEXT NOT NULL,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    suggested_offering TEXT,
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_predictive_roadmap ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view roadmap for their contacts" 
ON public.contact_predictive_roadmap 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert roadmap for their contacts" 
ON public.contact_predictive_roadmap 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update roadmap for their contacts" 
ON public.contact_predictive_roadmap 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Unique constraint to avoid duplicates for the same month/contact
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_roadmap_month ON public.contact_predictive_roadmap (contact_id, forecast_month);
