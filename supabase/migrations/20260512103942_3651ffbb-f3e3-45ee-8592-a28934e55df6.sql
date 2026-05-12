-- Create table for contact report manual overrides
CREATE TABLE IF NOT EXISTS public.contact_report_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    insights_data JSONB DEFAULT '{}'::jsonb,
    custom_scripts JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_report_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view report overrides" 
    ON public.contact_report_overrides FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert report overrides" 
    ON public.contact_report_overrides FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update report overrides" 
    ON public.contact_report_overrides FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_report_overrides_updated_at
    BEFORE UPDATE ON public.contact_report_overrides
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
