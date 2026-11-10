#!/usr/bin/env bash
# Roda os testes de scripts/monitoring/ (runbook coverage, exporters contra este Postgres e
# regras de alerta com promtool) dentro da mesma suíte — um comando prova o grupo inteiro.
EXPECTED_EXIT=0
run_guard(){
  local m="$REPO_ROOT/scripts/monitoring"
  bash "$m/check-runbook-coverage.test.sh" || return 1
  MONITORING_TEST_DB_PREFIX="${PGDATABASE}_mon" bash "$m/exporters.test.sh" >"$SCN_TMP/exporters.log" 2>&1 || { cat "$SCN_TMP/exporters.log"; return 1; }
  tail -n 1 "$SCN_TMP/exporters.log"
  contem "$SCN_TMP/exporters.log" '^exporters.test: [0-9]+ ok, 0 falha' || return 1    # rodou de verdade (não PULADO)
  bash "$m/alerts.test.sh"
}
