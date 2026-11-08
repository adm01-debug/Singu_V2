CREATE OR REPLACE FUNCTION public.record_family_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.family_info IS DISTINCT FROM NEW.family_info) THEN
            INSERT INTO public.contact_family_history (contact_id, user_id, family_info, changed_at)
            VALUES (NEW.id, NEW.user_id, NEW.family_info, now());
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        IF (NEW.family_info IS NOT NULL) THEN
            INSERT INTO public.contact_family_history (contact_id, user_id, family_info, changed_at)
            VALUES (NEW.id, NEW.user_id, NEW.family_info, now());
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
