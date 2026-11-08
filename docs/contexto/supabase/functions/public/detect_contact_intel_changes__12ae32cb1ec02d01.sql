CREATE OR REPLACE FUNCTION public.detect_contact_intel_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- title_change
  IF NEW.role_title IS DISTINCT FROM OLD.role_title 
     AND COALESCE(trim(NEW.role_title), '') <> '' THEN
    INSERT INTO public.people_intelligence_events
      (user_id, contact_id, event_type, field_name, old_value, new_value, source, metadata)
    VALUES (
      NEW.user_id, NEW.id,
      CASE WHEN OLD.company_id IS NOT DISTINCT FROM NEW.company_id THEN 'promotion' ELSE 'title_change' END,
      'role_title',
      OLD.role_title, NEW.role_title,
      'contacts_trigger',
      jsonb_build_object('company_id', NEW.company_id)
    );
  END IF;

  -- company_change
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    INSERT INTO public.people_intelligence_events
      (user_id, contact_id, event_type, field_name, old_value, new_value, source, metadata)
    VALUES (
      NEW.user_id, NEW.id, 'company_change', 'company_id',
      OLD.company_id::text, NEW.company_id::text,
      'contacts_trigger',
      jsonb_build_object('role_title', NEW.role_title)
    );
  END IF;

  RETURN NEW;
END;
$function$
