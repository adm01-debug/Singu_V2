-- Create audit table for contact_relatives
CREATE TABLE IF NOT EXISTS public.contact_relatives_audit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    relative_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    user_id UUID NOT NULL,
    change_type TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reason TEXT
);

-- Enable RLS
ALTER TABLE public.contact_relatives_audit ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own relatives audit"
ON public.contact_relatives_audit FOR SELECT
USING (auth.uid() = user_id);

-- Trigger function
CREATE OR REPLACE FUNCTION public.process_contact_relatives_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.contact_relatives_audit (relative_id, contact_id, user_id, change_type, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.contact_relatives_audit (relative_id, contact_id, user_id, change_type, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.contact_relatives_audit (relative_id, contact_id, user_id, change_type, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS tr_contact_relatives_audit ON public.contact_relatives;
CREATE TRIGGER tr_contact_relatives_audit
AFTER INSERT OR UPDATE OR DELETE ON public.contact_relatives
FOR EACH ROW EXECUTE FUNCTION public.process_contact_relatives_audit();

-- Create view for easier consumption
CREATE OR REPLACE VIEW public.v_contact_relatives_audit AS
SELECT 
    a.id,
    a.relative_id,
    a.contact_id,
    a.user_id,
    a.change_type,
    a.changed_at,
    COALESCE(a.new_data->>'name', a.old_data->>'name') as relative_name,
    COALESCE(a.new_data->>'relationship_type', a.old_data->>'relationship_type') as relationship_type,
    COALESCE(p.first_name || ' ' || p.last_name, 'Sistema') as user_name
FROM public.contact_relatives_audit a
LEFT JOIN public.profiles p ON a.user_id = p.id
ORDER BY a.changed_at DESC;
