CREATE OR REPLACE FUNCTION public.validate_entity_relationship()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE ok BOOLEAN;
BEGIN
  -- valida FROM
  IF NEW.from_type = 'company' THEN
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = NEW.from_id) INTO ok;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.contacts  WHERE id = NEW.from_id) INTO ok;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'from entity % % não existe', NEW.from_type, NEW.from_id; END IF;

  -- valida TO
  IF NEW.to_type = 'company' THEN
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = NEW.to_id) INTO ok;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.contacts  WHERE id = NEW.to_id) INTO ok;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'to entity % % não existe', NEW.to_type, NEW.to_id; END IF;

  -- garante único primary por (from, role)
  IF NEW.is_primary THEN
    UPDATE public.entity_relationships
       SET is_primary = false
     WHERE from_type = NEW.from_type
       AND from_id   = NEW.from_id
       AND role      = NEW.role
       AND id <> NEW.id
       AND is_primary = true;
  END IF;

  RETURN NEW;
END $function$
