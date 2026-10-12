BEGIN;
DO $owners$
BEGIN
  IF (SELECT count(*) FROM auth.users) < 2 THEN
    RAISE EXCEPTION 'O contrato de isolamento exige dois proprietários reais';
  END IF;
END;
$owners$;
SELECT set_config('rls.rpc.owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('rls.rpc.other', (SELECT id::text FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1), true);
DELETE FROM public.user_roles
WHERE user_id IN (current_setting('rls.rpc.owner')::uuid, current_setting('rls.rpc.other')::uuid);
SELECT set_config('rls.rpc.company_sp', gen_random_uuid()::text, true);
SELECT set_config('rls.rpc.company_rj', gen_random_uuid()::text, true);
SELECT set_config('rls.rpc.company_foreign', gen_random_uuid()::text, true);
SELECT set_config('rls.rpc.customer_sp', gen_random_uuid()::text, true);
SELECT set_config('rls.rpc.customer_rj', gen_random_uuid()::text, true);
SELECT set_config('rls.rpc.marker', gen_random_uuid()::text, true);
SELECT set_config('rls.rpc.wave', (SELECT (coalesce(max(onda), 0) + 1)::text FROM public.rodizio_distribuicao_staging), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.rpc.owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.rpc.owner'), 'role', 'authenticated')::text, true);

INSERT INTO public.companies(id, nome_crm, user_id) VALUES
  (current_setting('rls.rpc.company_sp')::uuid, 'QA RPC SP', current_setting('rls.rpc.owner')::uuid),
  (current_setting('rls.rpc.company_rj')::uuid, 'QA RPC RJ', current_setting('rls.rpc.owner')::uuid),
  (current_setting('rls.rpc.company_foreign')::uuid, 'QA RPC Outro', current_setting('rls.rpc.other')::uuid);
INSERT INTO public.company_emails(company_id, email) VALUES
  (current_setting('rls.rpc.company_sp')::uuid, '  ' || upper(current_setting('rls.rpc.marker')) || '@EXAMPLE.TEST '),
  (current_setting('rls.rpc.company_rj')::uuid, current_setting('rls.rpc.marker') || '@example.test'),
  (current_setting('rls.rpc.company_foreign')::uuid, current_setting('rls.rpc.marker') || '@example.test'),
  (current_setting('rls.rpc.company_sp')::uuid, current_setting('rls.rpc.marker') || '-isolado@example.test');
INSERT INTO public.company_emails(company_id, email)
VALUES (current_setting('rls.rpc.company_sp')::uuid, current_setting('rls.rpc.marker') || '@example.test')
ON CONFLICT DO NOTHING;
INSERT INTO public.company_addresses(company_id, estado, is_primary, created_at) VALUES
  (current_setting('rls.rpc.company_sp')::uuid, 'SP', true, '2026-01-01T00:00:00Z'),
  (current_setting('rls.rpc.company_sp')::uuid, 'SP', false, '2026-03-01T00:00:00Z'),
  (current_setting('rls.rpc.company_sp')::uuid, 'RJ', false, '2026-02-01T00:00:00Z'),
  (current_setting('rls.rpc.company_rj')::uuid, 'SP', false, '2026-01-01T00:00:00Z'),
  (current_setting('rls.rpc.company_rj')::uuid, 'RJ', false, '2026-02-01T00:00:00Z');
INSERT INTO public.customers(id, company_id, ramo_atividade) VALUES
  (current_setting('rls.rpc.customer_sp')::uuid, current_setting('rls.rpc.company_sp')::uuid, current_setting('rls.rpc.marker')),
  (current_setting('rls.rpc.customer_rj')::uuid, current_setting('rls.rpc.company_rj')::uuid, current_setting('rls.rpc.marker'));

SET LOCAL ROLE authenticated;
DO $duplicates$
DECLARE saved record;
BEGIN
  SELECT * INTO saved FROM public.find_duplicate_emails(NULL::integer)
  WHERE email = current_setting('rls.rpc.marker') || '@example.test';
  IF NOT FOUND OR saved.quantidade <> 2 OR jsonb_array_length(saved.empresas) <> 2
    OR saved.empresas @> jsonb_build_array(jsonb_build_object('id', current_setting('rls.rpc.company_foreign'))) THEN
    RAISE EXCEPTION 'Duplicidade não normalizada, contagem por linha ou exposição de empresa alheia';
  END IF;
  IF EXISTS (SELECT 1 FROM public.find_duplicate_emails(NULL::integer)
    WHERE email = current_setting('rls.rpc.marker') || '-isolado@example.test')
    OR EXISTS (SELECT 1 FROM public.find_duplicate_emails(0)) THEN
    RAISE EXCEPTION 'Emails da mesma empresa contados como duplicidade ou limite ignorado';
  END IF;
END;
$duplicates$;
RESET ROLE;

INSERT INTO public.user_roles(user_id, role) VALUES (current_setting('rls.rpc.owner')::uuid, 'admin')
ON CONFLICT DO NOTHING;
SET LOCAL ROLE authenticated;
DO $rotation$
DECLARE saved jsonb; wave integer := current_setting('rls.rpc.wave')::integer;
BEGIN
  saved := public.rodizio_sugerir_distribuicao(wave, jsonb_build_object('uf', 'SP', 'ramo_atividade', current_setting('rls.rpc.marker')));
  IF (saved->>'clientes_sugeridos')::integer <> 1
    OR (SELECT count(*) FROM public.rodizio_distribuicao_staging WHERE onda = wave
      AND customer_id IN (current_setting('rls.rpc.customer_sp')::uuid, current_setting('rls.rpc.customer_rj')::uuid)) <> 1
    OR NOT EXISTS (SELECT 1 FROM public.rodizio_distribuicao_staging
      WHERE onda = wave AND customer_id = current_setting('rls.rpc.customer_sp')::uuid) THEN
    RAISE EXCEPTION 'Filtro de UF inválido ou endereços repetidos duplicaram sugestões';
  END IF;
  saved := public.rodizio_sugerir_distribuicao(wave, jsonb_build_object('uf', 'SP', 'ramo_atividade', current_setting('rls.rpc.marker')));
  IF (saved->>'clientes_sugeridos')::integer <> 0 THEN
    RAISE EXCEPTION 'Nova execução duplicou sugestão existente';
  END IF;
  saved := public.rodizio_sugerir_distribuicao(wave, jsonb_build_object('uf', 'RJ', 'ramo_atividade', current_setting('rls.rpc.marker')));
  IF (saved->>'clientes_sugeridos')::integer <> 1 OR NOT EXISTS (
    SELECT 1 FROM public.rodizio_distribuicao_staging
    WHERE onda = wave AND customer_id = current_setting('rls.rpc.customer_rj')::uuid) THEN
    RAISE EXCEPTION 'Segundo estado não foi sugerido';
  END IF;
  saved := public.rodizio_sugerir_distribuicao(wave + 1, jsonb_build_object('uf', 'RJ', 'ramo_atividade', current_setting('rls.rpc.marker')));
  IF (saved->>'clientes_sugeridos')::integer <> 1 OR NOT EXISTS (
    SELECT 1 FROM public.rodizio_distribuicao_staging
    WHERE onda = wave + 1 AND customer_id = current_setting('rls.rpc.customer_rj')::uuid)
    OR EXISTS (SELECT 1 FROM public.rodizio_distribuicao_staging
      WHERE onda = wave + 1 AND customer_id = current_setting('rls.rpc.customer_sp')::uuid) THEN
    RAISE EXCEPTION 'UF secundária prevaleceu sobre endereço principal ou mais recente';
  END IF;
END;
$rotation$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('rls.rpc.other'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.rpc.other'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $scope$
BEGIN
  IF EXISTS (SELECT 1 FROM public.find_duplicate_emails(NULL::integer)
    WHERE email = current_setting('rls.rpc.marker') || '@example.test') THEN
    RAISE EXCEPTION 'Outro usuário acessou as duplicidades';
  END IF;
  IF (public.rodizio_sugerir_distribuicao(current_setting('rls.rpc.wave')::integer,
    jsonb_build_object('ramo_atividade', current_setting('rls.rpc.marker')))->>'clientes_sugeridos')::integer <> 0
    OR EXISTS (SELECT 1 FROM public.rodizio_distribuicao_staging WHERE onda = current_setting('rls.rpc.wave')::integer) THEN
    RAISE EXCEPTION 'Usuário sem autorização acessou o Rodízio';
  END IF;
END;
$scope$;
RESET ROLE;
DO $acl$
BEGIN
  IF has_function_privilege('anon', 'public.find_duplicate_emails(integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.rodizio_sugerir_distribuicao(integer,jsonb,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anônimo executa RPC interna';
  END IF;
END;
$acl$;
SELECT 'live_rpc_relations_contract: OK' AS result;
ROLLBACK;
