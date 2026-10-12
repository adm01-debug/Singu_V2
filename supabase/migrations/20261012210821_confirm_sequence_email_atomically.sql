ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS step_number integer;
UPDATE public.sequence_steps AS step
SET user_id = sequence.user_id
FROM public.sequences AS sequence
WHERE step.sequence_id = sequence.id AND step.user_id IS NULL;
UPDATE public.sequence_steps SET step_number = step_order WHERE step_number IS NULL;
ALTER TABLE public.sequence_steps
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN step_number SET NOT NULL;

ALTER TABLE public.sequence_enrollments
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_reason text;
UPDATE public.sequence_enrollments SET current_step = 0 WHERE current_step IS NULL;
ALTER TABLE public.sequence_enrollments
  ALTER COLUMN current_step SET DEFAULT 0,
  ALTER COLUMN current_step SET NOT NULL;

CREATE OR REPLACE FUNCTION public.complete_sequence_email_delivery(
  p_enrollment_id uuid,
  p_user_id uuid,
  p_step_id uuid,
  p_current_step integer,
  p_message_id text,
  p_tracking_token text,
  p_next_action_at timestamptz,
  p_subject text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_enrollment public.sequence_enrollments;
  v_step public.sequence_steps;
  v_log public.sequence_send_log;
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Confirmação exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  IF p_enrollment_id IS NULL OR p_user_id IS NULL OR p_step_id IS NULL
    OR p_current_step IS NULL OR p_current_step < 0
    OR NULLIF(btrim(p_message_id), '') IS NULL
    OR NULLIF(btrim(p_tracking_token), '') IS NULL THEN
    RAISE EXCEPTION 'Confirmação incompleta' USING ERRCODE = '22023';
  END IF;

  SELECT e.* INTO v_enrollment
  FROM public.sequence_enrollments AS e
  WHERE e.id = p_enrollment_id AND e.user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscrição não pertence ao usuário' USING ERRCODE = '42501';
  END IF;
  IF v_enrollment.status <> 'active' OR v_enrollment.current_step <> p_current_step THEN
    RETURN NULL;
  END IF;

  SELECT s.* INTO v_step
  FROM public.sequence_steps AS s
  JOIN public.sequences AS sequence ON sequence.id = s.sequence_id
  WHERE s.id = p_step_id AND s.sequence_id = v_enrollment.sequence_id
    AND s.user_id = p_user_id AND sequence.user_id = p_user_id
    AND sequence.status = 'active' AND s.channel = 'email';
  IF NOT FOUND OR v_step.step_order IS NULL OR v_step.step_order <= p_current_step OR NOT EXISTS (
    SELECT 1 FROM public.contacts AS c
    WHERE c.id = v_enrollment.contact_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Proprietário ou passo divergente' USING ERRCODE = '42501';
  END IF;

  SELECT l.* INTO v_log
  FROM public.sequence_send_log AS l
  WHERE l.enrollment_id = p_enrollment_id AND l.step_order = v_step.step_order
    AND l.status = 'sent'
  ORDER BY l.sent_at DESC
  LIMIT 1;
  IF FOUND THEN
    IF v_log.message_id IS DISTINCT FROM p_message_id OR v_log.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Confirmação anterior divergente' USING ERRCODE = '22023';
    END IF;
  ELSE
    INSERT INTO public.sequence_send_log (
      enrollment_id, step_id, sequence_id, contact_id, user_id, step_order,
      channel, status, message_id, tracking_token
    ) VALUES (
      p_enrollment_id, p_step_id, v_enrollment.sequence_id,
      v_enrollment.contact_id, p_user_id, v_step.step_order,
      'email', 'sent', p_message_id, p_tracking_token
    ) RETURNING * INTO v_log;
  END IF;

  INSERT INTO public.sequence_events (
    enrollment_id, sequence_id, contact_id, user_id, step_order,
    event_type, metadata, created_at
  )
  SELECT p_enrollment_id, v_enrollment.sequence_id, v_enrollment.contact_id,
    p_user_id, v_step.step_order, 'sent',
    jsonb_strip_nulls(jsonb_build_object(
      'channel', 'email', 'subject', p_subject,
      'tracking_token', v_log.tracking_token, 'message_id', v_log.message_id
    )), v_log.sent_at
  WHERE NOT EXISTS (
    SELECT 1 FROM public.sequence_events AS event
    WHERE event.enrollment_id = p_enrollment_id
      AND event.step_order = v_step.step_order AND event.event_type = 'sent'
  );

  UPDATE public.sequence_enrollments SET
    current_step = v_step.step_order,
    next_action_at = p_next_action_at,
    last_step_executed_at = v_log.sent_at,
    status = CASE WHEN p_next_action_at IS NULL THEN 'completed' ELSE 'active' END,
    completed_at = CASE WHEN p_next_action_at IS NULL THEN now() ELSE NULL END,
    paused_at = NULL, paused_reason = NULL
  WHERE id = p_enrollment_id;
  RETURN p_enrollment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_sequence_email_delivery(
  uuid, uuid, uuid, integer, text, text, timestamptz, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_sequence_email_delivery(
  uuid, uuid, uuid, integer, text, text, timestamptz, text
) TO service_role;

-- Rollback: restaure o processador anterior antes de remover a função.
-- DROP FUNCTION public.complete_sequence_email_delivery(uuid, uuid, uuid, integer, text, text, timestamptz, text);
-- ALTER TABLE public.sequence_enrollments ALTER COLUMN current_step DROP NOT NULL;
-- Preserve o progresso normalizado; restaurar NULL reabre a repetição de envios.
-- Os campos de pausa, proprietário e posição já existem no canônico: preserve-os e seus dados.
-- Em reconstruções nas quais foram criados apenas por esta migration, após
-- backup e retirada dos consumidores:
-- ALTER TABLE public.sequence_enrollments DROP COLUMN paused_at, DROP COLUMN paused_reason;
-- ALTER TABLE public.sequence_steps DROP COLUMN user_id, DROP COLUMN step_number;
