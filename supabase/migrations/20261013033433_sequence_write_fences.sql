CREATE OR REPLACE FUNCTION public.guard_sequence_enrollment_write()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
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
$$;
REVOKE ALL ON FUNCTION public.guard_sequence_enrollment_write() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sequence_enrollment_write_guard ON public.sequence_enrollments;
CREATE TRIGGER sequence_enrollment_write_guard BEFORE INSERT OR UPDATE ON public.sequence_enrollments
FOR EACH ROW EXECUTE FUNCTION public.guard_sequence_enrollment_write();

CREATE OR REPLACE FUNCTION public.refresh_sequence_enrollment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
DECLARE target_id uuid;
BEGIN
  target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.sequence_id ELSE NEW.sequence_id END;
  UPDATE public.sequences SET total_enrolled = (
    SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = target_id
  ) WHERE id = target_id;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_sequence_enrollment_count() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sequence_enrollment_counter ON public.sequence_enrollments;
CREATE TRIGGER sequence_enrollment_counter AFTER INSERT OR DELETE ON public.sequence_enrollments
FOR EACH ROW EXECUTE FUNCTION public.refresh_sequence_enrollment_count();

CREATE TABLE IF NOT EXISTS public.sequence_email_reservations (
  contact_id uuid PRIMARY KEY REFERENCES public.contacts(id) ON DELETE RESTRICT,
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.sequence_enrollments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  step_id uuid NOT NULL REFERENCES public.sequence_steps(id) ON DELETE RESTRICT,
  current_step integer NOT NULL CHECK (current_step >= 0),
  step_order integer NOT NULL CHECK (step_order > 0),
  idempotency_key text GENERATED ALWAYS AS (
    'seq-' || enrollment_id::text || '-step-' || step_order::text
  ) STORED,
  token uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sequence_email_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sequence_email_reservations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sequence_email_reservations TO authenticated;
GRANT ALL ON public.sequence_email_reservations TO service_role;
DROP POLICY IF EXISTS sequence_email_reservation_owner ON public.sequence_email_reservations;
CREATE POLICY sequence_email_reservation_owner ON public.sequence_email_reservations FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR (
  (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)) AND (SELECT auth.jwt()->>'aal') = 'aal2'
));

CREATE OR REPLACE FUNCTION public.reserve_sequence_email_send(
  p_enrollment_id uuid, p_user_id uuid, p_step_id uuid, p_current_step integer, p_token uuid,
  p_step_order integer
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
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
$$;
REVOKE ALL ON FUNCTION public.reserve_sequence_email_send(uuid,uuid,uuid,integer,uuid,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_sequence_email_send(uuid,uuid,uuid,integer,uuid,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.release_sequence_email_send(p_enrollment_id uuid, p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Liberação exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.sequence_email_reservations WHERE enrollment_id = p_enrollment_id AND token = p_token;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.release_sequence_email_send(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_sequence_email_send(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.settle_sequence_email_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
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
$$;
REVOKE ALL ON FUNCTION public.settle_sequence_email_reservation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sequence_email_reservation_settle ON public.sequence_enrollments;
CREATE TRIGGER sequence_email_reservation_settle AFTER UPDATE ON public.sequence_enrollments
FOR EACH ROW EXECUTE FUNCTION public.settle_sequence_email_reservation();

CREATE OR REPLACE FUNCTION public.guard_contact_sequence_archive()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id THEN
      RETURN NEW;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.sequence_email_reservations WHERE contact_id = OLD.id) THEN
    RAISE EXCEPTION 'Envio em andamento ou sem confirmação; aguarde a conclusão antes de arquivar'
      USING ERRCODE = '55000';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NEW.deleted_at IS NOT NULL OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    UPDATE public.sequence_enrollments SET status = 'paused', paused_at = now(),
      paused_reason = 'Contato arquivado ou transferido'
    WHERE contact_id = OLD.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_contact_sequence_archive() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS contact_sequence_archive_guard ON public.contacts;
CREATE TRIGGER contact_sequence_archive_guard BEFORE UPDATE OR DELETE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.guard_contact_sequence_archive();

CREATE OR REPLACE FUNCTION public.enroll_lead_score_contact(
  p_automation_id uuid, p_contact_id uuid, p_user_id uuid, p_event jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
DECLARE
  automation public.lead_score_threshold_automations;
  enrollment_id uuid;
  was_created boolean;
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Automação exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO automation FROM public.lead_score_threshold_automations
  WHERE id = p_automation_id AND user_id = p_user_id AND active AND action_type = 'enroll_sequence' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Automação indisponível' USING ERRCODE = '42501'; END IF;
  IF automation.last_fired_at IS NOT NULL AND automation.last_fired_at +
    make_interval(hours => COALESCE(automation.cooldown_hours, 0)) > now() THEN
    RETURN jsonb_build_object('skipped', 'cooldown');
  END IF;
  INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id)
  VALUES ((automation.action_config->>'sequence_id')::uuid, p_contact_id, p_user_id)
  ON CONFLICT (sequence_id, contact_id) DO NOTHING RETURNING id INTO enrollment_id;
  was_created := FOUND;
  IF NOT was_created THEN
    SELECT id INTO enrollment_id FROM public.sequence_enrollments
    WHERE sequence_id = (automation.action_config->>'sequence_id')::uuid
      AND contact_id = p_contact_id AND user_id = p_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição indisponível' USING ERRCODE = '42501'; END IF;
    RETURN jsonb_build_object('id', enrollment_id, 'created', false, 'skipped', 'already_enrolled');
  END IF;
  INSERT INTO public.lead_score_threshold_log(
    user_id, automation_id, contact_id, from_grade, to_grade, from_score, to_score, action_result, success
  ) VALUES (
    p_user_id, automation.id, p_contact_id, p_event->>'from_grade', p_event->>'to_grade',
    (p_event->>'from_score')::numeric, (p_event->>'to_score')::numeric,
    jsonb_build_object('kind', 'enroll_sequence', 'id', enrollment_id, 'created', was_created), true
  );
  UPDATE public.lead_score_threshold_automations
  SET last_fired_at = now(), fired_count = COALESCE(fired_count, 0) + 1 WHERE id = automation.id;
  RETURN jsonb_build_object('id', enrollment_id, 'created', was_created);
END;
$$;
REVOKE ALL ON FUNCTION public.enroll_lead_score_contact(uuid,uuid,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_lead_score_contact(uuid,uuid,uuid,jsonb) TO service_role;

-- Rollback: retire os consumidores das reservas e mantenha envios suspensos antes de remover as proteções.
-- Não remova reservas cujo resultado ainda não foi confirmado pelo provedor.
-- DROP TRIGGER IF EXISTS contact_sequence_archive_guard ON public.contacts;
-- DROP TRIGGER IF EXISTS sequence_enrollment_write_guard ON public.sequence_enrollments;
-- DROP TRIGGER IF EXISTS sequence_enrollment_counter ON public.sequence_enrollments;
-- DROP TRIGGER IF EXISTS sequence_email_reservation_settle ON public.sequence_enrollments;
-- DROP FUNCTION IF EXISTS public.enroll_lead_score_contact(uuid,uuid,uuid,jsonb);
-- DROP FUNCTION IF EXISTS public.guard_contact_sequence_archive();
-- DROP FUNCTION IF EXISTS public.reserve_sequence_email_send(uuid,uuid,uuid,integer,uuid,integer);
-- DROP FUNCTION IF EXISTS public.release_sequence_email_send(uuid,uuid);
-- DROP FUNCTION IF EXISTS public.guard_sequence_enrollment_write();
-- DROP FUNCTION IF EXISTS public.refresh_sequence_enrollment_count();
-- DROP FUNCTION IF EXISTS public.settle_sequence_email_reservation();
-- DROP TABLE IF EXISTS public.sequence_email_reservations;
