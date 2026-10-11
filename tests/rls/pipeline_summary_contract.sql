BEGIN;
SELECT set_config('rls.pipeline_owner', '00000000-0000-0000-0000-00000000940a', true);
SELECT set_config('rls.pipeline_other', '00000000-0000-0000-0000-00000000940b', true);

INSERT INTO public.companies (nome_crm, user_id, status) VALUES
  ('pipeline-summary active', current_setting('rls.pipeline_owner')::uuid, 'ativo')
RETURNING set_config('rls.pipeline_company', id::text, true);
INSERT INTO public.company_addresses (company_id, estado, is_primary, created_at) VALUES
  (current_setting('rls.pipeline_company')::uuid, 'RJ', false, now() - interval '1 day'),
  (current_setting('rls.pipeline_company')::uuid, 'SP', true, now());
INSERT INTO public.companies (nome_crm, user_id, status) VALUES
  ('pipeline-summary no address', current_setting('rls.pipeline_owner')::uuid, 'ativo'),
  ('pipeline-summary inactive', current_setting('rls.pipeline_owner')::uuid, 'inativo'),
  ('pipeline-summary unknown status', current_setting('rls.pipeline_owner')::uuid, NULL),
  ('pipeline-summary other tenant', current_setting('rls.pipeline_other')::uuid, 'ativo');

SELECT set_config('request.jwt.claim.sub', current_setting('rls.pipeline_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.pipeline_owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  summary jsonb := public.get_pipeline_summary(current_setting('rls.pipeline_owner')::uuid);
BEGIN
  IF summary IS DISTINCT FROM public.get_pipeline_summary() THEN
    RAISE EXCEPTION 'Resumo sem parâmetro diverge do escopo do dono';
  END IF;
  IF summary->'by_state' IS DISTINCT FROM '{"SP":1,"N/A":1}'::jsonb THEN
    RAISE EXCEPTION 'UF não prioriza endereço principal, duplica empresas ou vaza outro tenant';
  END IF;
  IF summary->'by_status'->'ativo'->>'count' IS DISTINCT FROM '2'
    OR summary->'by_status'->'inativo'->>'count' IS DISTINCT FROM '1'
    OR summary->'by_status'->'Não definido'->>'count' IS DISTINCT FROM '1'
    OR summary->'totals' IS DISTINCT FROM '{"active":2,"inactive":1,"with_recent_interaction":0}'::jsonb
    OR summary->'by_segment' IS DISTINCT FROM '{"Não definido":2}'::jsonb THEN
    RAISE EXCEPTION 'Envelope legado do resumo não mantém contagens do dono';
  END IF;
  BEGIN
    PERFORM public.get_pipeline_summary(current_setting('rls.pipeline_other')::uuid);
    RAISE EXCEPTION 'Outro tenant pode ser impersonado no resumo';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000940c', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000940c","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  summary jsonb := public.get_pipeline_summary();
BEGIN
  IF summary->'by_state' IS DISTINCT FROM '{}'::jsonb
    OR summary->'by_status' IS DISTINCT FROM '{}'::jsonb
    OR summary->'by_segment' IS DISTINCT FROM '{}'::jsonb
    OR summary->'totals' IS DISTINCT FROM '{"active":0,"inactive":0,"with_recent_interaction":0}'::jsonb THEN
    RAISE EXCEPTION 'Usuário sem empresas recebe resumo de outro tenant';
  END IF;
END $$;
RESET ROLE;
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.get_pipeline_summary(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Resumo permite execução anônima';
  END IF;
END $$;
ROLLBACK;
