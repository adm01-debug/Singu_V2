CREATE OR REPLACE FUNCTION public.release_sequence_email_send(p_enrollment_id uuid, p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Liberação exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.sequence_email_reservations WHERE enrollment_id = p_enrollment_id AND token = p_token;
  RETURN FOUND;
END;
$function$
