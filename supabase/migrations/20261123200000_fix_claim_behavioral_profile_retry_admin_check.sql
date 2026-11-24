-- A edge `retry-behavioral-profile` (botão "reanálise" em
-- src/pages/admin/BehavioralRegenAudit.tsx e InsightFeedbackAnalytics.tsx) chama
-- `claim_behavioral_profile_retry` com o cliente service_role. `has_role()`
-- devolve false quando `auth.uid()` é NULL (primeiro ramo do CASE), que é o caso
-- de qualquer chamada server-side sem JWT de usuário. Resultado: o guard
-- `current_user = 'service_role' AND has_role(actor,'admin')` era impossível de
-- satisfazer e a reanálise manual respondia 42501 sempre.
--
-- Aqui o guard consulta user_roles diretamente: mantém "só o serviço, só para
-- ator admin" sem depender de auth.uid().
CREATE OR REPLACE FUNCTION public.claim_behavioral_profile_retry(
  p_contact_id uuid,
  p_actor_id uuid
)
RETURNS public.behavioral_profile_regen_queue
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_queue public.behavioral_profile_regen_queue;
BEGIN
  IF current_user <> 'service_role' OR p_actor_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.user_roles AS ur
      WHERE ur.user_id = p_actor_id AND ur.role = 'admin'::public.app_role
    ) THEN
    RAISE EXCEPTION 'Reanálise exclusiva de administrador autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT c.user_id INTO v_owner FROM public.contacts AS c WHERE c.id = p_contact_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Contato não encontrado' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.behavioral_profile_regen_queue (
    contact_id, user_id, enqueued_at, next_run_at, trigger_source
  ) VALUES (p_contact_id, v_owner, clock_timestamp(), clock_timestamp(), 'manual_retry')
  ON CONFLICT (contact_id) DO NOTHING;

  SELECT q.* INTO v_queue FROM public.behavioral_profile_regen_queue AS q
  WHERE q.contact_id = p_contact_id FOR UPDATE;
  IF v_queue.user_id <> v_owner THEN
    RAISE EXCEPTION 'Proprietário da reserva divergente' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.contact_analytical_profile_versions AS version
    WHERE version.contact_id = p_contact_id AND version.trigger_source = 'manual'
      AND version.generated_at > clock_timestamp() - interval '5 minutes'
  ) THEN
    RAISE EXCEPTION 'Reanálise recente; aguarde cinco minutos' USING ERRCODE = 'P0001';
  END IF;
  IF (v_queue.claim_token IS NOT NULL AND v_queue.next_run_at > clock_timestamp())
    OR (v_queue.trigger_source LIKE 'manual_retry%'
      AND v_queue.last_processed_at > clock_timestamp() - interval '5 minutes') THEN
    RAISE EXCEPTION 'Contato reservado ou em pausa temporária; aguarde para tentar novamente'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.behavioral_profile_regen_queue
  SET attempts = attempts + 1,
      claim_token = gen_random_uuid(),
      next_run_at = clock_timestamp() + interval '20 minutes',
      last_processed_at = clock_timestamp(),
      trigger_source = 'manual_retry',
      last_error = NULL,
      updated_at = clock_timestamp()
  WHERE contact_id = p_contact_id
  RETURNING * INTO v_queue;
  RETURN v_queue;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_behavioral_profile_retry(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_behavioral_profile_retry(uuid, uuid) TO service_role;