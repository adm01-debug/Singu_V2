CREATE OR REPLACE FUNCTION public.guard_sequence_enrollment_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  enrollment_limit integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.sequence_id, NEW.user_id) IS DISTINCT FROM (OLD.sequence_id, OLD.user_id) THEN
      RAISE EXCEPTION 'O destino da inscrição não pode ser alterado' USING ERRCODE = '42501';
    END IF;
    IF NEW.contact_id IS NOT DISTINCT FROM OLD.contact_id
      AND (NEW.status <> 'active' OR OLD.status = 'active') THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM public.sequence_email_reservations WHERE enrollment_id = OLD.id) THEN
      RAISE EXCEPTION 'Envio pendente de confirmação; revise antes de retomar ou mesclar'
        USING ERRCODE = '55000';
    END IF;
  END IF;
  PERFORM 1 FROM public.contacts
  WHERE id = NEW.contact_id AND user_id = NEW.user_id AND deleted_at IS NULL FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contato indisponível para inscrição' USING ERRCODE = '42501';
  END IF;
  SELECT max_enrollments INTO enrollment_limit FROM public.sequences
  WHERE id = NEW.sequence_id AND user_id = NEW.user_id
    AND (status = 'active' OR (TG_OP = 'UPDATE' AND OLD.status = NEW.status)) FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequência indisponível para inscrição' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.sequence_enrollments
      WHERE sequence_id = NEW.sequence_id AND contact_id = NEW.contact_id AND user_id = NEW.user_id)
      AND (SELECT count(*) FROM public.sequence_enrollments
        WHERE sequence_id = NEW.sequence_id AND user_id = NEW.user_id) >= COALESCE(enrollment_limit, 100) THEN
      RAISE EXCEPTION 'Limite de inscrições atingido' USING ERRCODE = '23514';
    END IF;
    NEW.next_action_at := GREATEST(NEW.next_action_at, COALESCE((
      SELECT now() + make_interval(days => COALESCE(delay_days, 0), hours => COALESCE(delay_hours, 0))
      FROM public.sequence_steps WHERE sequence_id = NEW.sequence_id AND step_order = 1
    ), now()));
  END IF;
  RETURN NEW;
END;
$function$
