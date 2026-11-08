CREATE OR REPLACE FUNCTION public.process_contact_relatives_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
