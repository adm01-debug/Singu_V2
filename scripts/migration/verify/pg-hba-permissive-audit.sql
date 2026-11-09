-- pg-hba-permissive-audit.sql — Rodada 22/10
-- Proposito: regras de pg_hba abertas ao mundo com metodo fraco expoem o banco.
-- Classe   : AUDIT (RAISE WARNING no achado; nunca falha)
-- Limiar   : regra host* sem erro com endereco "all", 0.0.0.0/0 ou ::/0 e metodo trust/password.
--            (pg_hba_file_rules guarda endereco e mascara em colunas separadas: 0.0.0.0/0
--            aparece como address=0.0.0.0, netmask=0.0.0.0.)
-- Variaveis: nenhuma
-- Saida    : 0 (inclusive SKIP).
-- Requer   : leitura de pg_hba_file_rules (superuser por padrao). Sem privilegio: SKIP com NOTICE.
\set ON_ERROR_STOP on
\pset pager off
\echo '== pg-hba-permissive-audit =='
SELECT has_table_privilege('pg_catalog.pg_hba_file_rules', 'SELECT')
   AND has_function_privilege('pg_catalog.pg_hba_file_rules()', 'EXECUTE') AS le_hba \gset
\if :le_hba
SELECT line_number, type, database, user_name, address, netmask, auth_method
  FROM pg_hba_file_rules
 WHERE error IS NULL
 ORDER BY line_number;
SELECT COUNT(*) AS permissive_rules
  FROM pg_hba_file_rules
 WHERE error IS NULL
   AND (address = 'all'
        OR (address IN ('0.0.0.0', '::') AND netmask IN ('0.0.0.0', '::')))
   AND auth_method IN ('trust','password') \gset
\echo 'permissive_rules = ' :permissive_rules
SELECT :permissive_rules > 0 AS tem_permissiva \gset
\if :tem_permissiva
DO $$ BEGIN RAISE WARNING 'pg_hba com regra(s) aberta(s) ao mundo usando trust/password.'; END $$;
\endif
\else
\echo 'NOTICE: SKIP sem privilegio para ler pg_hba_file_rules.'
\endif
\echo 'REC: evitar 0.0.0.0/0 + trust/password. Preferir scram-sha-256 + CIDR restrito.'
