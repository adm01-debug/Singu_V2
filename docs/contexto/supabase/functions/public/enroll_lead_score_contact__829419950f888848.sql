CREATE OR REPLACE FUNCTION public.enroll_lead_score_contact(p_automation_id uuid, p_contact_id uuid, p_user_id uuid, p_event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
$function$
