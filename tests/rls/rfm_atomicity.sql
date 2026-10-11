BEGIN;
SELECT set_config('rls.rfm_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.rfm_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.rfm_owner'), 'role', 'authenticated')::text, true);
INSERT INTO public.contacts (user_id, first_name, last_name)
VALUES (current_setting('rls.rfm_owner')::uuid, 'RFM', 'Atomicidade')
RETURNING set_config('rls.rfm_contact', id::text, true);

CREATE FUNCTION pg_temp.fail_rfm_history_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('rls.rfm_fail_history', true) = 'true'
    AND NEW.contact_id = current_setting('rls.rfm_contact')::uuid THEN
    RAISE EXCEPTION 'falha de histórico simulada' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rls_fixture_rfm_history_failure BEFORE INSERT ON public.rfm_history
FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_rfm_history_fixture();

SET LOCAL ROLE authenticated;
DO $$
DECLARE
  uid uuid := current_setting('rls.rfm_owner')::uuid;
  cid uuid := current_setting('rls.rfm_contact')::uuid;
  rows jsonb := jsonb_build_array(jsonb_build_object(
    'user_id', uid, 'contact_id', cid, 'recency_score', 5, 'frequency_score', 5,
    'monetary_score', 5, 'segment', 'champions', 'segment_code', 'champions',
    'total_purchases', 1, 'total_interactions', 2, 'total_monetary_value', 100,
    'average_order_value', 100, 'recommended_actions', '[]'::jsonb, 'recommended_offers', '[]'::jsonb
  ));
BEGIN
  PERFORM set_config('rls.rfm_fail_history', 'true', true);
  BEGIN
    PERFORM public.persist_rfm_analysis(rows);
    RAISE EXCEPTION 'falha do histórico não propagada';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.rfm_analysis WHERE contact_id = cid)
    OR EXISTS (SELECT 1 FROM public.rfm_history WHERE contact_id = cid) THEN
    RAISE EXCEPTION 'inserção RFM parcial após falha do histórico';
  END IF;

  PERFORM set_config('rls.rfm_fail_history', 'false', true);
  IF public.persist_rfm_analysis(rows) <> 1 THEN RAISE EXCEPTION 'RFM não persistido'; END IF;
  IF (SELECT segment_code FROM public.rfm_analysis WHERE contact_id = cid) <> 'champions'
    OR (SELECT count(*) FROM public.rfm_history WHERE contact_id = cid) <> 1 THEN
    RAISE EXCEPTION 'análise e histórico RFM inconsistentes';
  END IF;

  PERFORM set_config('rls.rfm_fail_history', 'true', true);
  BEGIN
    PERFORM public.persist_rfm_analysis(jsonb_set(rows, '{0,recency_score}', '1'));
    RAISE EXCEPTION 'falha do histórico não propagada ao atualizar';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT recency_score FROM public.rfm_analysis WHERE contact_id = cid) <> 5
    OR (SELECT count(*) FROM public.rfm_history WHERE contact_id = cid) <> 1 THEN
    RAISE EXCEPTION 'atualização RFM parcial após falha do histórico';
  END IF;

  BEGIN
    PERFORM public.persist_rfm_analysis(rows, gen_random_uuid());
    RAISE EXCEPTION 'RFM aceita outro tenant';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.persist_rfm_analysis(jsonb_set(rows, '{0,contact_id}', to_jsonb(gen_random_uuid())));
    RAISE EXCEPTION 'RFM aceita contato fora do tenant';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.persist_rfm_analysis('{}'::jsonb);
    RAISE EXCEPTION 'RFM aceita payload sem lista';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END;
$$;
RESET ROLE;

SELECT set_config('rls.rfm_fail_history', 'false', true);
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SET LOCAL ROLE service_role;
DO $$
DECLARE
  uid uuid := current_setting('rls.rfm_owner')::uuid;
  cid uuid := current_setting('rls.rfm_contact')::uuid;
BEGIN
  IF public.persist_rfm_analysis(jsonb_build_array(jsonb_build_object(
    'user_id', uid, 'contact_id', cid, 'recency_score', 4, 'frequency_score', 4,
    'monetary_score', 4, 'segment', 'loyal_customers', 'segment_code', 'loyal_customers'
  )), uid) <> 1 THEN RAISE EXCEPTION 'job service-role não persiste RFM'; END IF;
END;
$$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.persist_rfm_analysis('[]'::jsonb);
    RAISE EXCEPTION 'anon executa persistência RFM';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
SELECT 'RFM_ATOMICITY_OK';
ROLLBACK;
