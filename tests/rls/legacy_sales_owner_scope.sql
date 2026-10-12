BEGIN;

SELECT set_config('rls.sales.owner', :'user_a', true);
SELECT set_config('rls.sales.other', :'user_b', true);
SELECT set_config('rls.sales.sp_a', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.sp_b', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.sale_a', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.sale_b', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.activity_a', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.activity_b', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.activity_unassigned', gen_random_uuid()::text, true);
SELECT set_config('rls.sales.activity_conflict', gen_random_uuid()::text, true);

INSERT INTO public.salespeople(id, name, auth_user_id) VALUES
  (current_setting('rls.sales.sp_a')::uuid, 'QA Legado A', current_setting('rls.sales.owner')::uuid),
  (current_setting('rls.sales.sp_b')::uuid, 'QA Legado B', current_setting('rls.sales.other')::uuid);
INSERT INTO public.sales(id, client_name, product_name, amount, salesperson_id) VALUES
  (current_setting('rls.sales.sale_a')::uuid, 'QA Contrato', 'Rollback', 1, current_setting('rls.sales.sp_a')::uuid),
  (current_setting('rls.sales.sale_b')::uuid, 'QA Contrato', 'Rollback', 1, current_setting('rls.sales.sp_b')::uuid);
INSERT INTO public.sales_activities(id, salesperson_id, sale_id, contact_name, activity_type, outcome) VALUES
  (current_setting('rls.sales.activity_a')::uuid, current_setting('rls.sales.sp_a')::uuid, current_setting('rls.sales.sale_a')::uuid, 'QA Nome Igual', 'call', 'connected'),
  (current_setting('rls.sales.activity_b')::uuid, current_setting('rls.sales.sp_b')::uuid, current_setting('rls.sales.sale_b')::uuid, 'QA Nome Igual', 'call', 'connected'),
  (current_setting('rls.sales.activity_unassigned')::uuid, NULL, current_setting('rls.sales.sale_a')::uuid, 'QA Nome Igual', 'call', 'connected'),
  (current_setting('rls.sales.activity_conflict')::uuid, current_setting('rls.sales.sp_a')::uuid, current_setting('rls.sales.sale_b')::uuid, 'QA Nome Igual', 'call', 'connected');

\echo 'TEST: ACL do legado comercial bloqueia escrita e acesso anônimo, inclusive por coluna'
DO $$
DECLARE relation_name regclass;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['public.salespeople'::regclass, 'public.sales'::regclass, 'public.sales_activities'::regclass] LOOP
    IF has_any_column_privilege('anon', relation_name, 'SELECT,INSERT,UPDATE,REFERENCES')
      OR has_table_privilege('anon', relation_name, 'DELETE,TRUNCATE,TRIGGER')
      OR has_any_column_privilege('authenticated', relation_name, 'INSERT,UPDATE,REFERENCES')
      OR has_table_privilege('authenticated', relation_name, 'DELETE,TRUNCATE,TRIGGER')
      OR NOT has_table_privilege('authenticated', relation_name, 'SELECT') THEN
      RAISE EXCEPTION 'ACL fora do contrato: %', relation_name;
    END IF;
  END LOOP;
  IF to_regclass('reporting.mv_daily_kpis') IS NOT NULL
    AND has_any_column_privilege('authenticated', 'reporting.mv_daily_kpis', 'SELECT') THEN
    RAISE EXCEPTION 'Agregado global do legado acessível sem o serviço autorizado';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', current_setting('rls.sales.owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.sales.owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
\echo 'TEST: dono acessa somente seu vendedor, sua venda e sua atividade'
DO $$
BEGIN
  IF (SELECT count(*) FROM public.salespeople WHERE id IN (current_setting('rls.sales.sp_a')::uuid, current_setting('rls.sales.sp_b')::uuid)) <> 1
    OR NOT EXISTS(SELECT 1 FROM public.salespeople WHERE id = current_setting('rls.sales.sp_a')::uuid)
    OR (SELECT count(*) FROM public.sales WHERE id IN (current_setting('rls.sales.sale_a')::uuid, current_setting('rls.sales.sale_b')::uuid)) <> 1
    OR NOT EXISTS(SELECT 1 FROM public.sales WHERE id = current_setting('rls.sales.sale_a')::uuid)
    OR (SELECT count(*) FROM public.sales_activities WHERE contact_name = 'QA Nome Igual') <> 1
    OR NOT EXISTS(SELECT 1 FROM public.sales_activities WHERE id = current_setting('rls.sales.activity_a')::uuid) THEN
    RAISE EXCEPTION 'Leitura cruzada, órfã ou conflitante no legado';
  END IF;
  BEGIN
    UPDATE public.salespeople SET auth_user_id = current_setting('rls.sales.other')::uuid
    WHERE id = current_setting('rls.sales.sp_a')::uuid;
    RAISE EXCEPTION 'Usuário conseguiu transferir a propriedade';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('rls.sales.other'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.sales.other'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
\echo 'TEST: outro usuário não acessa IDs forjados nem dados por nomes coincidentes'
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.salespeople WHERE id = current_setting('rls.sales.sp_a')::uuid)
    OR EXISTS(SELECT 1 FROM public.sales WHERE id = current_setting('rls.sales.sale_a')::uuid)
    OR EXISTS(SELECT 1 FROM public.sales_activities WHERE id IN (
      current_setting('rls.sales.activity_a')::uuid,
      current_setting('rls.sales.activity_unassigned')::uuid,
      current_setting('rls.sales.activity_conflict')::uuid))
    OR (SELECT count(*) FROM public.sales_activities WHERE contact_name = 'QA Nome Igual') <> 1
    OR NOT EXISTS(SELECT 1 FROM public.sales_activities WHERE id = current_setting('rls.sales.activity_b')::uuid) THEN
    RAISE EXCEPTION 'Outro usuário acessou dados fora do escopo';
  END IF;
END $$;
RESET ROLE;

SET LOCAL ROLE service_role;
\echo 'TEST: serviço autorizado preserva acesso ao legado e aos dados sem atribuição'
DO $$
BEGIN
  IF (SELECT count(*) FROM public.sales_activities WHERE contact_name = 'QA Nome Igual') <> 4 THEN
    RAISE EXCEPTION 'Serviço perdeu acesso às atividades preservadas';
  END IF;
  INSERT INTO public.salespeople(name) VALUES ('QA Serviço Rollback');
END $$;
RESET ROLE;

ROLLBACK;
