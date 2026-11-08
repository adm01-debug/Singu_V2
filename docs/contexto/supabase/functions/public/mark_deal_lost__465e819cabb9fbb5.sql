CREATE OR REPLACE FUNCTION public.mark_deal_lost(p_deal_id uuid, p_loss_reason_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE deals
  SET status           = 'perdido',
      loss_reason_id   = p_loss_reason_id,
      motivo_perda     = p_notes,
      closed_at        = NOW(),
      updated_at       = NOW()
  WHERE id = p_deal_id
    AND user_id = auth.uid()
    AND status NOT IN ('ganho', 'perdido');

  RETURN FOUND;
END;
$function$
