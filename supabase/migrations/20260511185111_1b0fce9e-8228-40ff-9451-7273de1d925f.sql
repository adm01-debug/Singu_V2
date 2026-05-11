-- Function to recalculate next contact due date
CREATE OR REPLACE FUNCTION public.calculate_next_contact_due()
RETURNS TRIGGER AS $$
BEGIN
    -- If we have a last contact date and cadence days, calculate next due
    IF (NEW.last_contact_at IS NOT NULL AND NEW.cadence_days IS NOT NULL) THEN
        NEW.next_contact_due := NEW.last_contact_at + (NEW.cadence_days || ' days')::interval;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on contact_cadence to auto-calculate on change
CREATE OR REPLACE TRIGGER on_cadence_params_change
BEFORE INSERT OR UPDATE OF cadence_days, last_contact_at ON public.contact_cadence
FOR EACH ROW EXECUTE FUNCTION public.calculate_next_contact_due();

-- Function to update last_contact_at from interactions
CREATE OR REPLACE FUNCTION public.sync_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert into contact_cadence
    -- We assume the user who created the interaction is the one to follow up
    -- If multiple users follow up, this might need more complex logic, but for now we use the interaction's user_id
    INSERT INTO public.contact_cadence (contact_id, user_id, last_contact_at)
    VALUES (NEW.contact_id, NEW.user_id, NEW.created_at)
    ON CONFLICT (contact_id, user_id) 
    DO UPDATE SET last_contact_at = EXCLUDED.last_contact_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on interactions
CREATE OR REPLACE TRIGGER on_interaction_created
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.sync_contact_last_interaction();