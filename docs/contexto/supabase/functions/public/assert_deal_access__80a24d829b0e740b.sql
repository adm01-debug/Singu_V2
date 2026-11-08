CREATE OR REPLACE FUNCTION public.assert_deal_access(p_deal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_deal_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM deals WHERE id = p_deal_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: deal % does not belong to the current user', p_deal_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
