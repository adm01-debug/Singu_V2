#!/usr/bin/env bash
# pitr-window-verifier.sh no cluster com arquivamento de verdade: WAL recém-arquivado → 0;
# com RPO_HOURS=0 qualquer idade estoura → 1.
CLUSTER=endurecido
EXPECTED_EXIT=0
setup(){ sql "CREATE TABLE public.t AS SELECT 1 AS a; SELECT pg_switch_wal();" && espera_ate "SELECT last_archived_time IS NOT NULL FROM pg_stat_archiver" 20; }
run_guard(){
  export DEST_DB_URL; DEST_DB_URL="$(db_url)"
  espera_saida 0 bash "$VERIFY_DIR/pitr-window-verifier.sh" || return 1
  sleep 1
  RPO_HOURS=0 espera_saida 1 bash "$VERIFY_DIR/pitr-window-verifier.sh"
}
