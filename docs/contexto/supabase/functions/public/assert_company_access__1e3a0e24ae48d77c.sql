CREATE OR REPLACE FUNCTION public.assert_company_access(p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_company_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM companies WHERE id = p_company_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: company % does not belong to the current user', p_company_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
