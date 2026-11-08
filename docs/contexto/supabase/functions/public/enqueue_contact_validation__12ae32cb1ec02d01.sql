CREATE OR REPLACE FUNCTION public.enqueue_contact_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Email
  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 3 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.email IS DISTINCT FROM OLD.email) THEN
      INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
      VALUES (NEW.user_id, NEW.id, 'email', NEW.email);
    END IF;
  END IF;

  -- Phone
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) >= 5 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.phone IS DISTINCT FROM OLD.phone) THEN
      INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
      VALUES (NEW.user_id, NEW.id, 'phone', NEW.phone);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
