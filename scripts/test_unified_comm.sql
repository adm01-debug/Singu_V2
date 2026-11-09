-- test_unified_comm.sql — consulta de fumaça: mostra as primeiras linhas do histórico de UMA empresa.
--
-- Propósito: ver com os próprios olhos o que a RPC public.get_unified_communication_history devolve
--   para uma empresa. (O teste automático do contrato, com veredito, é o test_unified_comm2.sql.)
-- Uso:
--   psql "$SUPABASE_DB_URL" -X -v company_id=<uuid-da-empresa> -f scripts/test_unified_comm.sql
--   psql "$SUPABASE_DB_URL" -X -v company_id=<uuid> -v limite=20 -f scripts/test_unified_comm.sql
-- Parâmetros: company_id (obrigatório; nunca deixe o id de um cliente real gravado no arquivo) e
--   limite (opcional, 1 a 500; padrão 5).
-- Risco: nenhum — somente leitura (transação READ ONLY). A saída traz dados de cliente: não cole em
--   issue/PR. Código 3 se faltar parâmetro, se ele for inválido ou se a função não existir.
\set ON_ERROR_STOP on
\pset pager off
\if :{?company_id}
\else
  \set company_id ''
\endif
\if :{?limite}
\else
  \set limite 5
\endif
SELECT set_config('singu.company_id', :'company_id', false), set_config('singu.limite', :'limite', false) \gset _cfg_

DO $guarda$
BEGIN
  IF current_setting('singu.company_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'FATAL: informe a empresa: psql -v company_id=<uuid> -f scripts/test_unified_comm.sql';
  END IF;
  IF current_setting('singu.limite') !~ '^[0-9]{1,3}$' OR current_setting('singu.limite')::int NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'FATAL: -v limite deve ser um inteiro de 1 a 500.';
  END IF;
  IF to_regprocedure('public.get_unified_communication_history(uuid, integer)') IS NULL THEN
    RAISE EXCEPTION 'FATAL: public.get_unified_communication_history(uuid, integer) nao existe (rode recreate_unified_comm.sql).';
  END IF;
END
$guarda$;

BEGIN TRANSACTION READ ONLY;
SELECT * FROM public.get_unified_communication_history(
  :'company_id'::uuid,
  :limite
);
ROLLBACK;
