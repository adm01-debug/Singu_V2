CREATE OR REPLACE FUNCTION public.calculate_interaction_response_time()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    last_interaction RECORD;
BEGIN
    -- Only calculate if it's initiated by 'us'
    IF (NEW.initiated_by = 'us') THEN
        -- Find the most recent interaction from this contact ('them')
        SELECT created_at INTO last_interaction
        FROM public.interactions
        WHERE contact_id = NEW.contact_id
          AND initiated_by = 'them'
          AND created_at < NEW.created_at
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            -- Calculate difference in minutes
            NEW.response_time := EXTRACT(EPOCH FROM (NEW.created_at - last_interaction.created_at)) / 60;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
