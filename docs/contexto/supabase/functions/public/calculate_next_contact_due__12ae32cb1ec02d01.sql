CREATE OR REPLACE FUNCTION public.calculate_next_contact_due()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- If we have a last contact date and cadence days, calculate next due
    IF (NEW.last_contact_at IS NOT NULL AND NEW.cadence_days IS NOT NULL) THEN
        NEW.next_contact_due := NEW.last_contact_at + (NEW.cadence_days || ' days')::interval;
    END IF;
    RETURN NEW;
END;
$function$
