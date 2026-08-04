-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('interaction-audios', 'interaction-audios', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('interaction-attachments', 'interaction-attachments', false);

-- Create policies for audio uploads
CREATE POLICY "Users can upload interaction audios" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'interaction-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their interaction audios" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'interaction-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for attachment uploads
CREATE POLICY "Users can upload interaction attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'interaction-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their interaction attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'interaction-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create audit table for interactions
CREATE TABLE IF NOT EXISTS public.interactions_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    user_id UUID NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.interactions_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own interactions audit" ON public.interactions_audit
    FOR SELECT USING (auth.uid() = user_id);

-- Audit function for interactions
CREATE OR REPLACE FUNCTION public.process_interactions_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.interactions_audit (interaction_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.interactions_audit (interaction_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.interactions_audit (interaction_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for interactions
CREATE OR REPLACE TRIGGER on_interaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.process_interactions_audit();