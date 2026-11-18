-- Migration: views_security_invoker_16
-- Fecha o advisor "security_definer_view" (nivel ERROR) nas 16 views de public.*
-- que ainda rodavam com os privilegios do dono (postgres) em vez dos privilegios
-- de quem consulta.
--
-- Por que era grave: as 16 views tem GRANT SELECT para `authenticated`. Sem
-- security_invoker, qualquer usuario logado lia a base inteira via PostgREST
-- (GET /rest/v1/<view>?select=*) ignorando o RLS das tabelas base - inclusive
-- nome, CNPJ e faturamento de empresas de outros vendedores
-- (v_company_summary.total_revenue, vw_customers, vw_cliente_completo).
--
-- Verificado em prod (pgxfvjmuubtbowutlide) antes de escrever, 2026-11-18:
--  * as 19 tabelas base das 16 views ja tem GRANT SELECT para `authenticated` e
--    RLS ligado com pelo menos uma policy de SELECT -> security_invoker nao gera
--    "permission denied", apenas passa a aplicar o filtro de linha;
--  * 12 das 16 views nao tem consumidor algum fora do types.ts gerado: nada em
--    src/, nada no allowlist da edge external-data, nenhuma outra view dependente
--    (pg_depend) e nenhuma funcao SQL que as cite (pg_get_functiondef);
--  * vw_carrier_homologation_queue e vw_supplier_homologation_queue sao citadas
--    por fn_carrier_cron_endpoint / fn_supplier_cron_endpoint, ambas SECURITY
--    INVOKER, sem job em cron.job e sem nenhuma chamada no repo. Quando chamadas
--    por cron/service_role (rolbypassrls = true) nada muda;
--  * vw_contacts_sem_apelido JA ESTAVA declarada WITH (security_invoker = true)
--    em 20261013033428_scoped_dashboard_views_error_log.sql, que consta no
--    ledger como aplicada - as 4 views irmas da mesma migration continuam com a
--    opcao, so esta perdeu. Aqui o ALTER restaura o que o repo declara, e o
--    isolamento dela ja e coberto por tests/rls/dashboard_scope.sql;
--  * v_entities tambem ja estava declarada com security_invoker=on em
--    scripts/migration/ddl/10_views.sql e na migration 20260712215737, que nunca
--    foi aplicada (ausente do ledger);
--  * v_company_summary e a unica com consumidor vivo de verdade
--    (src/hooks/useCompanyViews.ts e useCompanyIntelligence.ts via edge
--    external-data). O conjunto de empresas nao muda, porque a edge ja envia
--    .eq('user_id', userId) e o RLS de companies e exatamente user_id =
--    auth.uid(). Muda so o escopo dos agregados: total_interactions,
--    last_interaction, deals_won e total_revenue passam a contar apenas as
--    interacoes e deals do proprio usuario naquela empresa, em vez de todos.
--
-- Idempotente: ALTER VIEW ... SET e no-op quando a opcao ja esta ligada, e o
-- loop ignora nome que nao exista ou que nao seja view.
--
-- ROLLBACK (reabre a brecha - usar somente em incidente):
--   DO $rb$
--   DECLARE v text;
--   BEGIN
--     FOREACH v IN ARRAY ARRAY[
--       'v_company_summary','v_entities','vw_alertas_pendentes_vendedor',
--       'vw_carrier_homologation_queue','vw_carriers','vw_carriers_completo',
--       'vw_cliente_completo','vw_clientes_prioridade','vw_companies_completo',
--       'vw_company_addresses','vw_contacts_sem_apelido','vw_customers',
--       'vw_supplier_homologation_queue','vw_suppliers','vw_suppliers_completo',
--       'vw_top_clientes_vendedor'
--     ] LOOP
--       IF EXISTS (SELECT 1 FROM pg_class WHERE oid = to_regclass('public.'||v) AND relkind = 'v')
--       THEN EXECUTE format('ALTER VIEW public.%I RESET (security_invoker)', v); END IF;
--     END LOOP;
--   END
--   $rb$;

DO $migration$
DECLARE
  v_name text;
  v_total int := 0;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'v_company_summary',
    'v_entities',
    'vw_alertas_pendentes_vendedor',
    'vw_carrier_homologation_queue',
    'vw_carriers',
    'vw_carriers_completo',
    'vw_cliente_completo',
    'vw_clientes_prioridade',
    'vw_companies_completo',
    'vw_company_addresses',
    'vw_contacts_sem_apelido',
    'vw_customers',
    'vw_supplier_homologation_queue',
    'vw_suppliers',
    'vw_suppliers_completo',
    'vw_top_clientes_vendedor'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class
       WHERE oid = to_regclass('public.' || v_name)
         AND relkind = 'v'
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v_name);
      v_total := v_total + 1;
    ELSE
      RAISE NOTICE 'View public.% ausente - ignorada', v_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'security_invoker ligado em % view(s)', v_total;
END
$migration$;
