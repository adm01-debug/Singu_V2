-- Add constraints to life_events
ALTER TABLE public.life_events 
ADD CONSTRAINT check_event_type 
CHECK (event_type IN ('birthday', 'anniversary', 'promotion', 'travel', 'family', 'achievement', 'other'));

ALTER TABLE public.life_events 
ADD CONSTRAINT check_reminder_days 
CHECK (reminder_days_before >= 0);

-- Create history table
CREATE TABLE public.life_events_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    life_event_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    user_id UUID,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    recurring BOOLEAN,
    reminder_days_before INTEGER,
    change_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.life_events_history ENABLE ROW LEVEL SECURITY;

-- Policies for history
CREATE POLICY "Users can view their own life events history" 
ON public.life_events_history FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger function for auditing life events
CREATE OR REPLACE FUNCTION public.audit_life_events()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            NEW.id, NEW.contact_id, NEW.user_id, NEW.event_type, NEW.title, NEW.event_date, NEW.recurring, NEW.reminder_days_before, 'INSERT', 'Evento criado'
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            NEW.id, NEW.contact_id, NEW.user_id, NEW.event_type, NEW.title, NEW.event_date, NEW.recurring, NEW.reminder_days_before, 'UPDATE', 'Evento atualizado'
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            OLD.id, OLD.contact_id, OLD.user_id, OLD.event_type, OLD.title, OLD.event_date, OLD.recurring, OLD.reminder_days_before, 'DELETE', 'Evento removido'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER tr_audit_life_events
AFTER INSERT OR UPDATE OR DELETE ON public.life_events
FOR EACH ROW EXECUTE FUNCTION public.audit_life_events();

-- Create view for audit
CREATE OR REPLACE VIEW public.v_life_events_audit AS
SELECT 
    h.id,
    h.life_event_id,
    h.contact_id,
    h.event_type,
    h.title,
    h.event_date,
    h.recurring,
    h.reminder_days_before,
    h.change_type,
    h.reason,
    h.changed_at,
    COALESCE(p.first_name || ' ' || p.last_name, 'Sistema') as user_name
FROM public.life_events_history h
LEFT JOIN public.profiles p ON h.user_id = p.id
ORDER BY h.changed_at DESC;