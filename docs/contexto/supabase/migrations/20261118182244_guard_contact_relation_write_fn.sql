CREATE OR REPLACE FUNCTION public.guard_contact_relation_write()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $guard$
DECLARE
  parent_ids uuid[] := ARRAY[]::uuid[];
  parent_id uuid;
  owner_id uuid;
  archived_at timestamptz;
  actor_id uuid := auth.uid();
  trusted_service boolean := current_setting('role', true) = 'service_role'
    OR (current_setting('role', true) = 'none'
      AND session_user IN ('postgres', 'supabase_admin'));
  admin_aal2 boolean;
BEGIN
  IF TG_OP <> 'INSERT' THEN parent_ids := array_append(parent_ids, OLD.contact_id); END IF;
  IF TG_OP <> 'DELETE' THEN parent_ids := array_append(parent_ids, NEW.contact_id); END IF;
  IF NOT trusted_service AND actor_id IS NULL THEN
    RAISE EXCEPTION 'Contact relation write forbidden' USING ERRCODE = '42501';
  END IF;
  admin_aal2 := coalesce(auth.jwt() ->> 'aal' = 'aal2'
    AND public.has_role(actor_id, 'admin'::public.app_role), false);
  FOR parent_id IN SELECT DISTINCT id FROM unnest(parent_ids) AS ids(id) ORDER BY id LOOP
    SELECT c.user_id, c.deleted_at INTO owner_id, archived_at
      FROM public.contacts c WHERE c.id = parent_id FOR UPDATE;
    IF NOT FOUND AND TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN CONTINUE; END IF;
    IF NOT trusted_service AND (NOT FOUND OR parent_id IS NULL
      OR NOT (admin_aal2 OR (owner_id IS NOT DISTINCT FROM actor_id AND archived_at IS NULL))) THEN
      RAISE EXCEPTION 'Contact relation write forbidden' USING ERRCODE = '42501';
    END IF;
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$guard$;
