ALTER TABLE public.sequence_events DROP CONSTRAINT IF EXISTS sequence_events_event_type_check;
ALTER TABLE public.sequence_events ADD CONSTRAINT sequence_events_event_type_check
  CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied',
    'bounced', 'unsubscribed', 'visited_page', 'meeting_booked', 'failed',
    'manual_completed', 'email_resumed'));

CREATE OR REPLACE FUNCTION public.resume_sequence_email(
  p_enrollment_id uuid,
  p_current_step integer,
  p_paused_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_enrollment public.sequence_enrollments;
  v_receipt uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF p_enrollment_id IS NULL OR p_current_step IS NULL OR p_current_step < 0 OR p_paused_at IS NULL THEN
    RAISE EXCEPTION 'Retomada incompleta' USING ERRCODE = '22023';
  END IF;

  SELECT e.* INTO v_enrollment FROM public.sequence_enrollments AS e
  WHERE e.id = p_enrollment_id AND e.user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscrição não pertence ao usuário' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.sequences AS sequence
  JOIN public.contacts AS contact ON contact.id = v_enrollment.contact_id
  WHERE sequence.id = v_enrollment.sequence_id
    AND sequence.user_id = v_uid AND contact.user_id = v_uid AND contact.deleted_at IS NULL
  FOR SHARE OF sequence, contact;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proprietário divergente ou contato excluído' USING ERRCODE = '42501';
  END IF;

  SELECT event.id INTO v_receipt FROM public.sequence_events AS event
  WHERE event.enrollment_id = p_enrollment_id AND event.user_id = v_uid
    AND event.event_type = 'email_resumed' AND event.step_order = p_current_step + 1
    AND (event.metadata->>'paused_at')::timestamptz = p_paused_at;
  IF FOUND THEN
    RETURN jsonb_build_object('enrollment_id', p_enrollment_id, 'receipt_id', v_receipt,
      'status', v_enrollment.status, 'already_resumed', true);
  END IF;

  IF v_enrollment.status <> 'paused'
    OR v_enrollment.current_step IS DISTINCT FROM p_current_step
    OR v_enrollment.paused_at IS DISTINCT FROM p_paused_at
    OR coalesce(v_enrollment.paused_reason, '') NOT IN (
      'Envio não confirmado; revise a integração antes de retomar',
      'Provedor confirmou o envio; persistência ou avanço exigem revisão')
  OR coalesce(v_enrollment.metadata, '{}'::jsonb) ? 'pending_manual_step'
  OR NOT EXISTS (SELECT 1 FROM public.contacts AS contact
    WHERE contact.id = v_enrollment.contact_id AND NULLIF(btrim(contact.email), '') IS NOT NULL)
    OR NOT EXISTS (SELECT 1 FROM public.sequences AS sequence
      WHERE sequence.id = v_enrollment.sequence_id AND sequence.status = 'active') THEN
    RAISE EXCEPTION 'Pausa alterada ou indisponível para retomada de email' USING ERRCODE = '55000';
  END IF;

  PERFORM 1 FROM public.sequence_steps AS step
  WHERE step.sequence_id = v_enrollment.sequence_id AND step.user_id = v_uid
    AND step.step_order = p_current_step + 1 AND step.channel = 'email'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Etapa de email divergente' USING ERRCODE = '55000';
  END IF;

  INSERT INTO public.sequence_events (
    enrollment_id, sequence_id, contact_id, user_id, step_order, event_type, metadata
  ) VALUES (
    p_enrollment_id, v_enrollment.sequence_id, v_enrollment.contact_id, v_uid,
    p_current_step + 1, 'email_resumed',
    jsonb_build_object('paused_at', p_paused_at, 'paused_reason', v_enrollment.paused_reason,
      'resumed_by', v_uid)
  ) RETURNING id INTO v_receipt;

  UPDATE public.sequence_enrollments
  SET status = 'active', paused_at = NULL, paused_reason = NULL, next_action_at = now(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'retry_unconfirmed_email', jsonb_build_object('receipt_id', v_receipt, 'step_order', p_current_step + 1)
      )
  WHERE id = p_enrollment_id AND user_id = v_uid;

  RETURN jsonb_build_object('enrollment_id', p_enrollment_id, 'receipt_id', v_receipt,
    'status', 'active', 'already_resumed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.resume_sequence_email(uuid, integer, timestamptz) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.resume_sequence_email(uuid, integer, timestamptz) TO authenticated;

-- Rollback: retire a ação de retomada da interface antes de remover a função.
-- DROP FUNCTION public.resume_sequence_email(uuid, integer, timestamptz);
-- Preserve os eventos email_resumed como comprovantes de ação do usuário.
-- Não restaure o CHECK anterior enquanto existirem esses eventos e não os converta em envios.
