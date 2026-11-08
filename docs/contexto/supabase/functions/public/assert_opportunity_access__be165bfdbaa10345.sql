CREATE OR REPLACE FUNCTION public.assert_opportunity_access(p_opportunity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_opportunity_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM sales_opportunities so
       JOIN companies c ON so.company_id = c.id
       WHERE so.id = p_opportunity_id AND c.user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: opportunity % does not belong to the current user', p_opportunity_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
