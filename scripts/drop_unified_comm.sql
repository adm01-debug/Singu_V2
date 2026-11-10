-- drop_unified_comm.sql — remove a RPC public.get_unified_communication_history (todas as assinaturas conhecidas).
--
-- Propósito: limpar a função (e a sobrecarga legada de 4 argumentos) quando ela precisa ser
--   refeita do zero. Para recriar em seguida: scripts/recreate_unified_comm.sql.
-- Uso:
--   psql "$SUPABASE_DB_URL" -X -f scripts/drop_unified_comm.sql               # ENSAIO: mostra e desfaz
--   psql "$SUPABASE_DB_URL" -X -v aplicar=1 -f scripts/drop_unified_comm.sql  # remove de verdade
-- Risco: ALTO com aplicar=1 — a tela de histórico unificado da empresa (src/hooks/useInteractionsRpc.ts)
--   para de funcionar até a função ser recriada. Mudança de schema em produção: só com aval do dono.
-- Guardas: tudo em uma transação com lock_timeout; sem CASCADE (se algo depende da função, o DROP
--   falha e nada muda); se sobrar alguma sobrecarga desconhecida, aborta sem remover nenhuma;
--   idempotente (função ausente = nada a fazer). Sem `-v aplicar=1` termina em ROLLBACK.
\set ON_ERROR_STOP on
\pset pager off
\if :{?aplicar}
\else
  \set aplicar 0
\endif
SELECT lower(:'aplicar') IN ('1', 'true', 'on', 'yes', 'sim') AS aplicar_ok \gset

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

\echo 'Assinaturas existentes antes:'
SELECT p.oid::regprocedure AS assinatura
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_unified_communication_history'
 ORDER BY 1;

DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, integer);
DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, uuid, text, integer);

DO $guarda$
DECLARE
  v_sobras text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ' ORDER BY p.oid::regprocedure::text) INTO v_sobras
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_unified_communication_history';
  IF v_sobras IS NOT NULL THEN
    RAISE EXCEPTION 'FATAL: sobrecarga desconhecida ainda existe (%). Nada foi removido; revise antes.', v_sobras;
  END IF;
END
$guarda$;

\if :aplicar_ok
  NOTIFY pgrst, 'reload schema';
  COMMIT;
  \echo 'APLICADO: public.get_unified_communication_history removida (PostgREST avisado).'
\else
  ROLLBACK;
  \echo 'ENSAIO: nada foi alterado. Para remover de verdade rode com -v aplicar=1.'
\endif
