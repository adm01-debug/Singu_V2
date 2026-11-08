CREATE OR REPLACE FUNCTION public.assert_customer_access(p_customer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_customer_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM customers cu
       JOIN companies c ON cu.company_id = c.id
       WHERE cu.id = p_customer_id AND c.user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: customer % does not belong to the current user', p_customer_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
