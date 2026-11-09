#!/usr/bin/env bash
# full-audit.sh no cluster endurecido com dados saudáveis: ZERO FAIL e saída 0 — prova de que
# a bateria FATAL inteira passa num banco bem configurado (sem falso-positivo).
CLUSTER=endurecido
EXPECTED_EXIT=0
setup(){
  psql -X -q -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/fixtures/dados.sql" >/dev/null 2>&1 || return 1
  sql "CREATE EXTENSION pg_stat_statements; SELECT pg_switch_wal();" || return 1
  espera_ate "SELECT archived_count > 0 FROM pg_stat_archiver" 20
}
run_guard(){
  DEST_DB_URL="$(db_url)" bash "$VERIFY_DIR/full-audit.sh" >"$SCN_TMP/audit.log" 2>&1; local rc=$?
  grep -E '=== (FAIL|WARN-FAIL): |ERROR' "$SCN_TMP/audit.log"
  [[ $rc -eq 0 ]] || { tail -3 "$SCN_TMP/audit.log"; return 1; }
  nao_contem "$SCN_TMP/audit.log" '=== (FAIL|WARN-FAIL): '
}
