-- Inscrição e contador confirmados na mesma transação, com retry sem duplicação.
CREATE OR REPLACE FUNCTION public.enroll_sequence_contact(_sequence_id uuid, _contact_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor uuid := auth.uid();
  enrollment_id uuid;
  was_created boolean;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.sequences WHERE id = _sequence_id AND user_id = actor FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = _contact_id AND user_id = actor) THEN
    RAISE EXCEPTION 'Sequência ou contato indisponível' USING ERRCODE = '42501';
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

DROP POLICY IF EXISTS singu_sequence_enrollment_scope ON public.sequence_enrollments;
CREATE POLICY singu_sequence_enrollment_scope ON public.sequence_enrollments
AS RESTRICTIVE FOR ALL TO authenticated
USING (user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()))
WITH CHECK (user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

-- DOWN MIGRATION (Rollback): reimplantar primeiro o consumidor anterior.
-- DROP FUNCTION IF EXISTS public.enroll_sequence_contact(uuid,uuid);
-- DROP POLICY IF EXISTS singu_sequence_enrollment_scope ON public.sequence_enrollments;
-- Inscrições e contadores permanecem intactos.