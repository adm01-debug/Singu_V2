-- Create audit table
CREATE TABLE IF NOT EXISTS public.contact_time_analysis_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    user_id UUID NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.contact_time_analysis_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analysis audit" ON public.contact_time_analysis_audit
    FOR SELECT USING (auth.uid() = user_id);

-- Audit function
CREATE OR REPLACE FUNCTION public.process_contact_time_analysis_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.contact_time_analysis_audit (analysis_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.contact_time_analysis_audit (analysis_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.contact_time_analysis_audit (analysis_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE OR REPLACE TRIGGER on_contact_time_analysis_change
AFTER INSERT OR UPDATE OR DELETE ON public.contact_time_analysis
FOR EACH ROW EXECUTE FUNCTION public.process_contact_time_analysis_audit();