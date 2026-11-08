CREATE OR REPLACE FUNCTION public.sync_contact_last_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.contact_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.contact_cadence (contact_id, user_id, last_contact_at)
  VALUES (NEW.contact_id, NEW.user_id, NEW.created_at)
  ON CONFLICT (user_id, contact_id)
  DO UPDATE SET last_contact_at = EXCLUDED.last_contact_at;

  RETURN NEW;
END;
$function$
