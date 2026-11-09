-- test_unified_comm2.sql — teste automático do contrato da RPC public.get_unified_communication_history.
--
-- Propósito: chamar a função de verdade e FALHAR se ela não cumprir o contrato que o app usa:
--   assinatura (uuid, integer) chamável; as 6 colunas esperadas, com os tipos certos; respeita
--   p_limit; devolve do mais recente para o mais antigo. (Para só olhar os dados: test_unified_comm.sql;
--   para conferir permissões e sobrecargas: check_unified_comm.sql.)
-- Uso:
--   psql "$SUPABASE_DB_URL" -X -f scripts/test_unified_comm2.sql                      # empresa neutra (0 linhas)
--   psql "$SUPABASE_DB_URL" -X -v company_id=<uuid> -f scripts/test_unified_comm2.sql  # com dados reais
-- Parâmetro: company_id (opcional). Sem ele usa o UUID zerado: valida a chamada e o formato sem
--   depender de dado de cliente.
-- Risco: nenhum — somente leitura (transação READ ONLY); não imprime dados, só contagens.
-- Saída: "OK test_unified_comm2: N linha(s)" (código 0) ou "FATAL: ..." (código 3). A versão antiga
--   engolia o erro e saía com 0 mesmo quando a função falhava.
\set ON_ERROR_STOP on
\pset pager off
\if :{?company_id}
\else
  \set company_id '00000000-0000-0000-0000-000000000000'
\endif
SELECT set_config('singu.company_id', :'company_id', false) \gset _cfg_

BEGIN TRANSACTION READ ONLY;
DO $teste$
DECLARE
  c_colunas CONSTANT text := 'interaction_id uuid, interaction_type text, channel text, summary text, '
                          || 'interaction_date timestamp with time zone, user_name text';
  v_id       uuid;
  v_oid      oid := to_regprocedure('public.get_unified_communication_history(uuid, integer)');
  v_colunas  text;
  v_total    int;
  v_limitado int;
  v_fora     int;
BEGIN
  IF current_setting('singu.company_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'FATAL: -v company_id deve ser um UUID.';
  END IF;
  v_id := current_setting('singu.company_id')::uuid;
  IF v_oid IS NULL THEN
    RAISE EXCEPTION 'FATAL: public.get_unified_communication_history(uuid, integer) nao existe.';
  END IF;

  SELECT string_agg(a.nome || ' ' || format_type(a.tipo, NULL), ', ' ORDER BY a.ord) INTO v_colunas
    FROM pg_catalog.pg_proc p,
         unnest(p.proargnames, p.proargmodes, p.proallargtypes) WITH ORDINALITY AS a(nome, modo, tipo, ord)
   WHERE p.oid = v_oid AND a.modo = 't';
  IF v_colunas IS DISTINCT FROM c_colunas THEN
    RAISE EXCEPTION E'FATAL: colunas de retorno fora do contrato.\n  atual:    %\n  esperado: %', v_colunas, c_colunas;
  END IF;

  BEGIN
    SELECT count(*) INTO v_total FROM public.get_unified_communication_history(v_id, 50);
    SELECT count(*) INTO v_limitado FROM public.get_unified_communication_history(v_id, 1);
    SELECT count(*) INTO v_fora
      FROM (SELECT interaction_date AS d, lag(interaction_date) OVER () AS anterior
              FROM public.get_unified_communication_history(v_id, 50)) s
     WHERE s.anterior IS NOT NULL AND s.d > s.anterior;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FATAL: a chamada falhou: % %', SQLSTATE, SQLERRM;
  END;
  IF v_total > 50 OR v_limitado > 1 THEN
    RAISE EXCEPTION 'FATAL: p_limit nao respeitado (pediu 50 -> %, pediu 1 -> %).', v_total, v_limitado;
  END IF;
  IF v_fora > 0 THEN
    RAISE EXCEPTION 'FATAL: % linha(s) fora da ordem (esperado: mais recente primeiro).', v_fora;
  END IF;
  RAISE NOTICE 'OK test_unified_comm2: % linha(s) com p_limit=50, % com p_limit=1.', v_total, v_limitado;
END
$teste$;
ROLLBACK;
\echo 'OK test_unified_comm2.'
