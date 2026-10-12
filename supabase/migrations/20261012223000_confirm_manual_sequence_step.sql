ALTER TABLE public.sequence_enrollments ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.sequence_events DROP CONSTRAINT IF EXISTS sequence_events_event_type_check;
ALTER TABLE public.sequence_events ADD CONSTRAINT sequence_events_event_type_check
  CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied',
    'bounced', 'unsubscribed', 'visited_page', 'meeting_booked', 'failed', 'manual_completed'));

CREATE OR REPLACE FUNCTION public.confirm_sequence_manual_step(
  p_enrollment_id uuid,
  p_step_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_enrollment public.sequence_enrollments;
  v_step public.sequence_steps;
  v_upcoming public.sequence_steps;
  v_next_action timestamptz;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF p_enrollment_id IS NULL OR p_step_id IS NULL OR length(coalesce(p_note, '')) > 2000 THEN
    RAISE EXCEPTION 'Confirmação incompleta' USING ERRCODE = '22023';
  END IF;

  SELECT e.* INTO v_enrollment
  FROM public.sequence_enrollments AS e
  WHERE e.id = p_enrollment_id AND e.user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscrição não pertence ao usuário' USING ERRCODE = '42501';
  END IF;

  SELECT s.* INTO v_step
  FROM public.sequence_steps AS s
  JOIN public.sequences AS sequence ON sequence.id = s.sequence_id
  WHERE s.id = p_step_id AND s.sequence_id = v_enrollment.sequence_id
    AND s.user_id = v_uid AND sequence.user_id = v_uid AND s.channel <> 'email'
  FOR SHARE OF s, sequence;
  IF NOT FOUND OR v_step.step_order IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.contacts AS c
    WHERE c.id = v_enrollment.contact_id AND c.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Proprietário ou etapa divergente' USING ERRCODE = '42501';
  END IF;

  IF v_enrollment.current_step >= v_step.step_order AND EXISTS (
    SELECT 1 FROM public.sequence_events AS event
    WHERE event.enrollment_id = p_enrollment_id AND event.step_order = v_step.step_order
      AND event.event_type = 'manual_completed' AND event.metadata->>'step_id' = p_step_id::text
  ) THEN
    RETURN jsonb_build_object('enrollment_id', p_enrollment_id, 'step_order', v_step.step_order,
      'status', v_enrollment.status, 'already_confirmed', true);
  END IF;

  IF v_enrollment.status <> 'paused'
    OR v_enrollment.metadata->'pending_manual_step'->>'step_id' IS DISTINCT FROM p_step_id::text
    OR v_enrollment.metadata->'pending_manual_step'->>'step_order' IS DISTINCT FROM v_step.step_order::text
    OR v_enrollment.metadata->'pending_manual_step'->>'channel' IS DISTINCT FROM v_step.channel
    OR v_step.step_order <= v_enrollment.current_step
    OR NOT EXISTS (
      SELECT 1 FROM public.sequences AS sequence
      WHERE sequence.id = v_enrollment.sequence_id AND sequence.status = 'active'
    ) THEN
    RAISE EXCEPTION 'Etapa manual não aguarda confirmação' USING ERRCODE = '55000';
  END IF;

  SELECT s.* INTO v_upcoming
  FROM public.sequence_steps AS s
  WHERE s.sequence_id = v_enrollment.sequence_id AND s.step_order = v_step.step_order + 1;
  IF FOUND THEN
    v_next_action := now() + make_interval(
      days => coalesce(v_upcoming.delay_days, 0), hours => coalesce(v_upcoming.delay_hours, 0));
  ELSIF coalesce(v_step.condition_type, 'always') <> 'always' THEN
    v_next_action := now() + make_interval(hours => coalesce(v_step.condition_wait_hours, 24));
  END IF;
  v_status := CASE WHEN v_next_action IS NULL THEN 'completed' ELSE 'active' END;

  INSERT INTO public.sequence_events (
    enrollment_id, sequence_id, contact_id, user_id, step_order, event_type, metadata, created_at
  ) VALUES (
    p_enrollment_id, v_enrollment.sequence_id, v_enrollment.contact_id, v_uid, v_step.step_order,
    'manual_completed', jsonb_strip_nulls(jsonb_build_object(
      'channel', v_step.channel, 'step_id', p_step_id, 'confirmed_by', v_uid,
      'note', NULLIF(btrim(p_note), '')
    )), now()
  );

  UPDATE public.sequence_enrollments SET
    current_step = v_step.step_order,
    next_action_at = v_next_action,
    last_step_executed_at = now(),
    status = v_status,
    completed_at = CASE WHEN v_next_action IS NULL THEN now() ELSE NULL END,
    paused_at = NULL, paused_reason = NULL,
    metadata = coalesce(metadata, '{}'::jsonb) - 'pending_manual_step'
  WHERE id = p_enrollment_id;

  RETURN jsonb_build_object('enrollment_id', p_enrollment_id, 'step_order', v_step.step_order,
    'status', v_status, 'already_confirmed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_sequence_manual_step(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_sequence_manual_step(uuid, uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_sequence_manual_step(uuid, uuid, text) FROM service_role;

-- Rollback: retire a confirmação da interface antes de remover a função.
-- DROP FUNCTION public.confirm_sequence_manual_step(uuid, uuid, text);
-- Preserve os eventos manual_completed. Para restaurar o CHECK anterior,
-- arquive-os primeiro sem convertê-los em envios: confirmação manual não é entrega.
