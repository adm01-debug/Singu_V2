CREATE OR REPLACE FUNCTION public.assert_contact_access(p_contact_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_contact_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM contacts WHERE id = p_contact_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: contact % does not belong to the current user', p_contact_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
