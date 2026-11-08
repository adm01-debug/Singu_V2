CREATE OR REPLACE FUNCTION public.assert_proposal_access(p_proposal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_proposal_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM proposals WHERE id = p_proposal_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Unauthorized: proposal % does not belong to the current user', p_proposal_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
