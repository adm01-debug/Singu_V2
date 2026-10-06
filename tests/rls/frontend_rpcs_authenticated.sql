-- RPCs SECURITY DEFINER chamadas pelo frontend com sessão de usuário
-- (20261006130000_frontend_rpcs_authenticated.sql):
--   1) o dono executa todas sem permission denied nem objeto/coluna inexistente;
--   2) outro usuário autenticado não lê nem altera dados do dono;
--   3) anon não executa nenhuma.
-- Fixtures pertencem a um profile real (deals.user_id tem FK para profiles) e
-- são revertidas no ROLLBACK do runner.
BEGIN;

SELECT set_config('rls.user_b', :'user_b', true);
SELECT set_config('rls.owner', (SELECT id::text FROM public.profiles ORDER BY id LIMIT 1), true);

INSERT INTO public.contacts (first_name, last_name, user_id)
VALUES ('rls', 'rpc-fixture', current_setting('rls.owner')::uuid)
RETURNING set_config('rls.contact', id::text, true);
INSERT INTO public.deals (user_id, titulo, pipeline_stage, contact_id)
VALUES (current_setting('rls.owner')::uuid, 'rls rpc fixture', 'lead', current_setting('rls.contact')::uuid)
RETURNING set_config('rls.deal', id::text, true);
INSERT INTO public.nurturing_workflows (user_id, name, trigger_type)
VALUES (current_setting('rls.owner')::uuid, 'rls rpc fixture', 'manual')
RETURNING set_config('rls.workflow', id::text, true);
INSERT INTO public.cs_accounts (user_id, account_name)
VALUES (current_setting('rls.owner')::uuid, 'rls rpc fixture')
RETURNING set_config('rls.account', id::text, true);

CREATE FUNCTION pg_temp.act_as(_uid text) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', _uid, true),
         set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

\echo 'TEST: dono executa as 15 RPCs do frontend'
SELECT pg_temp.act_as(current_setting('rls.owner'));
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  o text := quote_literal(current_setting('rls.owner'));
  c text := quote_literal(current_setting('rls.contact'));
  d text := quote_literal(current_setting('rls.deal'));
  w text := quote_literal(current_setting('rls.workflow'));
  a text := quote_literal(current_setting('rls.account'));
  calls text[] := ARRAY[
    'SELECT public.cleanup_behavioral_regen_queue(30, 5, 7)',
    format('SELECT public.compute_account_health(%s::uuid)', a),
    format('SELECT public.compute_attribution(%s, ''linear'', 0)', d),
    format('SELECT public.compute_revops_kpis(%s::uuid, current_date - 30, current_date)', o),
    format('SELECT public.cs_renewal_pipeline(%s::uuid, 90)', o),
    'SELECT public.dismiss_revops_alert(gen_random_uuid())',
    format('SELECT public.enroll_contact_in_workflow(%s::uuid, %s::uuid)', w, c),
    format('SELECT public.evaluate_mql(%s::uuid)', c),
    'SELECT public.get_connection_metrics(gen_random_uuid())',
    format('SELECT public.get_marketing_funnel_stats(%s::uuid, current_date - 30, current_date)', o),
    format('SELECT public.get_score_explicability(%s::uuid)', c),
    format('SELECT public.move_deal_atomic(%s::uuid, ''proposta'', 50)', d),
    'SELECT public.publish_mtta_sla_breach_alert(10, 5)',
    format('SELECT public.seed_conversation_topics(%s::uuid)', o),
    format('SELECT public.seed_forecast_period(%s::uuid, ''month'')', o)
  ];
  q text;
  bad text[] := '{}';
BEGIN
  FOREACH q IN ARRAY calls LOOP
    BEGIN
      EXECUTE q;
    EXCEPTION
      WHEN raise_exception THEN
        -- Só as RPCs administrativas podem recusar o dono comum.
        IF SQLERRM NOT IN ('acesso negado: requer admin', 'forbidden') THEN
          bad := bad || format('%s → %s', q, SQLERRM);
        END IF;
      WHEN others THEN
        bad := bad || format('%s → %s %s', q, SQLSTATE, SQLERRM);
    END;
  END LOOP;
  IF array_length(bad, 1) > 0 THEN
    RAISE EXCEPTION '❌ RPCs falham para o dono: %', array_to_string(bad, ' | ');
  END IF;
  IF (SELECT pipeline_stage FROM public.deals WHERE id = current_setting('rls.deal')::uuid) <> 'proposta' THEN
    RAISE EXCEPTION '❌ move_deal_atomic não moveu o deal do dono';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.nurturing_executions
                  WHERE workflow_id = current_setting('rls.workflow')::uuid
                    AND contact_id = current_setting('rls.contact')::uuid) THEN
    RAISE EXCEPTION '❌ enroll_contact_in_workflow não inscreveu o contato do dono';
  END IF;
  RAISE NOTICE '✅ dono executa as 15 RPCs do frontend';
END $$;
RESET ROLE;

\echo 'TEST: outro usuário autenticado não acessa dados do dono pelas RPCs'
SELECT pg_temp.act_as(current_setting('rls.user_b'));
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  o text := quote_literal(current_setting('rls.owner'));
  c text := quote_literal(current_setting('rls.contact'));
  d text := quote_literal(current_setting('rls.deal'));
  w text := quote_literal(current_setting('rls.workflow'));
  a text := quote_literal(current_setting('rls.account'));
  calls text[] := ARRAY[
    format('SELECT public.compute_account_health(%s::uuid)', a),
    format('SELECT public.compute_revops_kpis(%s::uuid, current_date - 30, current_date)', o),
    format('SELECT public.cs_renewal_pipeline(%s::uuid, 90)', o),
    format('SELECT public.enroll_contact_in_workflow(%s::uuid, %s::uuid)', w, c),
    format('SELECT public.get_marketing_funnel_stats(%s::uuid, current_date - 30, current_date)', o),
    format('SELECT public.get_score_explicability(%s::uuid)', c),
    format('SELECT public.move_deal_atomic(%s::uuid, ''ganho'', 100)', d),
    format('SELECT public.seed_conversation_topics(%s::uuid)', o),
    format('SELECT public.seed_forecast_period(%s::uuid, ''quarter'')', o),
    'SELECT public.cleanup_behavioral_regen_queue(30, 5, 7)',
    'SELECT public.get_connection_metrics(gen_random_uuid())'
  ];
  q text;
  leaked text[] := '{}';
BEGIN
  FOREACH q IN ARRAY calls LOOP
    BEGIN
      EXECUTE q;
      leaked := leaked || q;
    EXCEPTION WHEN raise_exception THEN NULL;
    END;
  END LOOP;
  IF array_length(leaked, 1) > 0 THEN
    RAISE EXCEPTION '❌ RPCs aceitam outro usuário: %', array_to_string(leaked, ' | ');
  END IF;
  RAISE NOTICE '✅ outro usuário é recusado pelas RPCs com escopo';
END $$;
RESET ROLE;

DO $$
BEGIN
  IF (SELECT pipeline_stage FROM public.deals WHERE id = current_setting('rls.deal')::uuid) <> 'proposta'
     OR EXISTS (SELECT 1 FROM public.forecast_periods
                 WHERE user_id = current_setting('rls.owner')::uuid AND period_type = 'quarter'
                   AND period_start = date_trunc('quarter', current_date)::date
                   AND created_at >= now()) THEN
    RAISE EXCEPTION '❌ outro usuário alterou dados do dono';
  END IF;
  RAISE NOTICE '✅ dados do dono intactos após tentativas de outro usuário';
END $$;

\echo 'TEST: anon não executa as RPCs do frontend autenticado'
SET LOCAL ROLE anon;
DO $$
DECLARE
  fn text;
  allowed text[] := '{}';
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.cleanup_behavioral_regen_queue(integer,integer,integer)',
    'public.compute_account_health(uuid)',
    'public.compute_attribution(text,text,numeric)',
    'public.compute_revops_kpis(uuid,date,date)',
    'public.cs_renewal_pipeline(uuid,integer)',
    'public.dismiss_revops_alert(uuid)',
    'public.enroll_contact_in_workflow(uuid,uuid)',
    'public.evaluate_mql(uuid)',
    'public.get_connection_metrics(uuid)',
    'public.get_marketing_funnel_stats(uuid,date,date)',
    'public.get_score_explicability(uuid)',
    'public.move_deal_atomic(uuid,text,integer)',
    'public.publish_mtta_sla_breach_alert(integer,integer)',
    'public.seed_conversation_topics(uuid)',
    'public.seed_forecast_period(uuid,text)'
  ] LOOP
    IF has_function_privilege('anon', fn::regprocedure, 'EXECUTE') THEN
      allowed := allowed || fn;
    END IF;
  END LOOP;
  IF array_length(allowed, 1) > 0 THEN
    RAISE EXCEPTION '❌ anon executa: %', array_to_string(allowed, ', ');
  END IF;
  RAISE NOTICE '✅ anon sem EXECUTE nas 15 RPCs';
END $$;
RESET ROLE;

ROLLBACK;
