CREATE OR REPLACE FUNCTION public.pay_commission(p_commission_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE commissions SET status = 'paid', paid_at = NOW() WHERE id = p_commission_id AND status = 'approved';
  RETURN FOUND;
END;
$function$
