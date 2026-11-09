#!/usr/bin/env bash
# long-running-tx-guard.sql — plantado: transação de cliente aberta; limiar por -v max_min.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup(){
  bg_abre longa || return 1
  bg_envia longa "BEGIN;"
  bg_envia longa "SELECT txid_current();"
  espera_ate "SELECT count(*) = 1 FROM pg_stat_activity WHERE application_name = 'guardtest-longa' AND datname = current_database() AND xact_start IS NOT NULL" 10 || return 1
  sleep 2.2
}
run_guard(){ guard long-running-tx-guard.sql -v max_min=0.03 -v list_min=0; }
cleanup_scenario(){ bg_fecha longa; }
