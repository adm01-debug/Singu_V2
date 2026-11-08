CREATE OR REPLACE FUNCTION public.settle_sequence_email_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF current_user = 'service_role' AND NEW.current_step > OLD.current_step THEN
    DELETE FROM public.sequence_email_reservations reservation
    USING public.sequence_send_log receipt
    WHERE reservation.enrollment_id = NEW.id AND reservation.user_id = NEW.user_id
      AND reservation.current_step = OLD.current_step AND reservation.step_order = NEW.current_step
      AND receipt.enrollment_id = reservation.enrollment_id AND receipt.user_id = reservation.user_id
      AND receipt.step_order = reservation.step_order
      AND receipt.status IN ('sent','opened','clicked')
      AND NULLIF(btrim(receipt.message_id),'') IS NOT NULL;
  END IF;
  RETURN NULL;
END;
$function$
