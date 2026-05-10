ALTER TABLE public.life_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.audit_life_events()
RETURNS TRIGGER AS $$
DECLARE
    v_reason TEXT;
BEGIN
    -- Extract reason from metadata if exists
    v_reason := COALESCE(NEW.metadata->>'reason', OLD.metadata->>'reason');

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            NEW.id, NEW.contact_id, NEW.user_id, NEW.event_type, NEW.title, NEW.event_date, NEW.recurring, NEW.reminder_days_before, 'INSERT', COALESCE(v_reason, 'Evento criado')
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            NEW.id, NEW.contact_id, NEW.user_id, NEW.event_type, NEW.title, NEW.event_date, NEW.recurring, NEW.reminder_days_before, 'UPDATE', COALESCE(v_reason, 'Evento atualizado')
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            OLD.id, OLD.contact_id, OLD.user_id, OLD.event_type, OLD.title, OLD.event_date, OLD.recurring, OLD.reminder_days_before, 'DELETE', COALESCE(v_reason, 'Evento removido')
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;