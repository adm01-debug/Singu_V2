CREATE OR REPLACE FUNCTION public.assert_self_user_id(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Three pass-through cases:
  --   auth.uid() IS NULL  → service_role / cron caller, trusted
  --   p_user_id IS NULL   → no specific user claim, not impersonation
  --   p_user_id = auth.uid() → caller operating on their own data
  IF auth.uid() IS NOT NULL
     AND p_user_id IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Unauthorized: cannot perform operations on behalf of another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
