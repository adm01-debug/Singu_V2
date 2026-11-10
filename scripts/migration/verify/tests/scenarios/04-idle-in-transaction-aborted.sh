#!/usr/bin/env bash
# Reproduz F1: 'idle in transaction (aborted)' era ignorado pelo guard antigo.
# A sessão fica aberta de verdade (psql lendo de um FIFO); o limiar é reduzido por
# -v max_min para não precisar esperar 30 minutos.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup(){
  bg_abre idle || return 1
  bg_envia idle "BEGIN;"
  bg_envia idle "SELECT 1/0;"
  espera_ate "SELECT count(*) = 1 FROM pg_stat_activity
               WHERE application_name = 'guardtest-idle' AND datname = current_database()
                 AND state = 'idle in transaction (aborted)'" 10 || return 1
  sleep 2.2
}
run_guard(){ guard idle-in-transaction-guard.sql -v max_min=0.03; }
cleanup_scenario(){ bg_fecha idle; }
