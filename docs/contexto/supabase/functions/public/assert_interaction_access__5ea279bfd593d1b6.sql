CREATE OR REPLACE FUNCTION public.assert_interaction_access(p_interaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_interaction_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM interactions WHERE id = p_interaction_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: interaction % does not belong to the current user', p_interaction_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
