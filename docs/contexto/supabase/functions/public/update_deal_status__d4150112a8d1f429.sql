CREATE OR REPLACE FUNCTION public.update_deal_status(p_deal_id uuid, p_status text, p_motivo text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE deals
  SET status       = p_status,
      motivo_perda = CASE WHEN p_status = 'perdido' THEN p_motivo ELSE motivo_perda END,
      closed_at    = CASE WHEN p_status IN ('ganho', 'perdido') THEN NOW() ELSE closed_at END,
      updated_at   = NOW()
  WHERE id = p_deal_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$function$
