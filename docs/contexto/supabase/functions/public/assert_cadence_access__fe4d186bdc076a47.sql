CREATE OR REPLACE FUNCTION public.assert_cadence_access(p_cc_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_cc_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM company_cadences WHERE id = p_cc_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: cadence % does not belong to the current user', p_cc_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
