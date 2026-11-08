CREATE OR REPLACE FUNCTION public.guard_sequence_status_while_send()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'active'
    AND EXISTS (
      SELECT 1 FROM public.sequence_email_reservations reservation
      JOIN public.sequence_enrollments enrollment ON enrollment.id = reservation.enrollment_id
      WHERE enrollment.sequence_id = OLD.id
    ) THEN
    RAISE EXCEPTION 'Envio pendente de confirmação; aguarde antes de pausar a sequência'
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$function$
