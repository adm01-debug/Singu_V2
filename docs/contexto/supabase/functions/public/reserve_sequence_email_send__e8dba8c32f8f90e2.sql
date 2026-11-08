CREATE OR REPLACE FUNCTION public.reserve_sequence_email_send(p_enrollment_id uuid, p_user_id uuid, p_step_id uuid, p_current_step integer, p_token uuid, p_step_order integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  enrollment public.sequence_enrollments;
  contact public.contacts;
  inserted uuid;
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Reserva exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  IF p_token IS NULL THEN RAISE EXCEPTION 'Reserva obrigatória' USING ERRCODE = '22023'; END IF;
  SELECT c.* INTO contact FROM public.contacts c
  JOIN public.sequence_enrollments e ON e.contact_id = c.id
  WHERE e.id = p_enrollment_id AND e.user_id = p_user_id
    AND c.user_id = p_user_id AND c.deleted_at IS NULL FOR SHARE OF c;
  IF NOT FOUND OR NULLIF(btrim(contact.email), '') IS NULL THEN
    RAISE EXCEPTION 'Contato indisponível para envio' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO enrollment FROM public.sequence_enrollments
  WHERE id = p_enrollment_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR enrollment.status <> 'active' OR enrollment.current_step <> p_current_step
    OR enrollment.contact_id IS DISTINCT FROM contact.id
    OR enrollment.next_action_at IS NULL OR enrollment.next_action_at > now() THEN
    RETURN NULL;
  END IF;
  PERFORM 1 FROM public.sequence_steps step JOIN public.sequences sequence ON sequence.id = step.sequence_id
  WHERE step.id = p_step_id AND step.sequence_id = enrollment.sequence_id
    AND step.user_id = p_user_id AND step.channel = 'email'
    AND step.step_order = p_step_order AND step.step_order > p_current_step
    AND sequence.user_id = p_user_id AND sequence.status = 'active' FOR SHARE OF sequence;
  IF NOT FOUND THEN RAISE EXCEPTION 'Etapa indisponível para envio' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.sequence_email_reservations(contact_id, enrollment_id, user_id, token, step_id, current_step, step_order)
  VALUES (contact.id, enrollment.id, p_user_id, p_token, p_step_id, p_current_step, p_step_order)
  ON CONFLICT DO NOTHING RETURNING token INTO inserted;
  IF inserted IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('id', contact.id, 'user_id', contact.user_id, 'first_name', contact.first_name,
    'last_name', contact.last_name, 'email', contact.email, 'token', inserted);
END;
$function$
