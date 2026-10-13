-- Inscrições exigem contato ativo durante a transação de confirmação.
CREATE OR REPLACE FUNCTION public.enroll_sequence_contact(_sequence_id uuid, _contact_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor uuid := auth.uid();
  enrollment_id uuid;
  was_created boolean;
  enrollment_limit integer;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  SELECT max_enrollments INTO enrollment_limit FROM public.sequences
  WHERE id = _sequence_id AND user_id = actor FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequência ou contato indisponível' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.contacts
  WHERE id = _contact_id AND user_id = actor AND deleted_at IS NULL FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequência ou contato indisponível' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sequence_enrollments
    WHERE sequence_id = _sequence_id AND contact_id = _contact_id AND user_id = actor)
    AND (SELECT count(*) FROM public.sequence_enrollments
      WHERE sequence_id = _sequence_id AND user_id = actor) >= COALESCE(enrollment_limit, 100) THEN
    RAISE EXCEPTION 'Limite de inscrições atingido' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id, next_action_at)
  VALUES (_sequence_id, _contact_id, actor, now())
  ON CONFLICT (sequence_id, contact_id) DO NOTHING RETURNING id INTO enrollment_id;
  was_created := FOUND;
  IF NOT was_created THEN
    SELECT id INTO enrollment_id FROM public.sequence_enrollments
    WHERE sequence_id = _sequence_id AND contact_id = _contact_id AND user_id = actor;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Inscrição indisponível' USING ERRCODE = '42501';
    END IF;
  END IF;
  UPDATE public.sequences SET total_enrolled = (
    SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = _sequence_id AND user_id = actor
  ) WHERE id = _sequence_id AND user_id = actor;
  RETURN jsonb_build_object('id', enrollment_id, 'created', was_created);
END;
$function$;
REVOKE ALL ON FUNCTION public.enroll_sequence_contact(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enroll_sequence_contact(uuid,uuid) TO authenticated;

-- DOWN MIGRATION (Rollback): restaura a definição anterior, preservando inscrições e contadores.
-- CREATE OR REPLACE FUNCTION public.enroll_sequence_contact(_sequence_id uuid, _contact_id uuid)
-- RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
-- SET search_path = pg_catalog, public
-- AS $function$
-- DECLARE
--   actor uuid := auth.uid();
--   enrollment_id uuid;
--   was_created boolean;
-- BEGIN
--   IF actor IS NULL THEN
--     RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
--   END IF;
--   PERFORM 1 FROM public.sequences WHERE id = _sequence_id AND user_id = actor FOR UPDATE;
--   IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = _contact_id AND user_id = actor) THEN
--     RAISE EXCEPTION 'Sequência ou contato indisponível' USING ERRCODE = '42501';
--   END IF;
--   INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id, next_action_at)
--   VALUES (_sequence_id, _contact_id, actor, now())
--   ON CONFLICT (sequence_id, contact_id) DO NOTHING RETURNING id INTO enrollment_id;
--   was_created := FOUND;
--   IF NOT was_created THEN
--     SELECT id INTO enrollment_id FROM public.sequence_enrollments
--     WHERE sequence_id = _sequence_id AND contact_id = _contact_id AND user_id = actor;
--     IF NOT FOUND THEN
--       RAISE EXCEPTION 'Inscrição indisponível' USING ERRCODE = '42501';
--     END IF;
--   END IF;
--   UPDATE public.sequences SET total_enrolled = (
--     SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = _sequence_id AND user_id = actor
--   ) WHERE id = _sequence_id AND user_id = actor;
--   RETURN jsonb_build_object('id', enrollment_id, 'created', was_created);
-- END;
-- $function$;
-- REVOKE ALL ON FUNCTION public.enroll_sequence_contact(uuid,uuid) FROM PUBLIC, anon;
-- GRANT EXECUTE ON FUNCTION public.enroll_sequence_contact(uuid,uuid) TO authenticated;