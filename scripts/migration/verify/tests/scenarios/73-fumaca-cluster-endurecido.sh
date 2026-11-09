#!/usr/bin/env bash
# No cluster endurecido (TLS, checksums, archive, wal_level=logical, pg_stat_statements
# carregado) e com dados saudáveis, os guards de config de cluster também têm de PASSAR:
# as únicas falhas toleradas são as de parâmetro obrigatório (publicação/snapshot).
CLUSTER=endurecido
EXPECTED_EXIT=0
setup(){
  psql -X -q -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/fixtures/dados.sql" >/dev/null 2>&1 || return 1
  sql "CREATE EXTENSION pg_stat_statements; SELECT pg_switch_wal();" || return 1
  espera_ate "SELECT archived_count > 0 FROM pg_stat_archiver" 20
}
run_guard(){
  fumaca_sql >"$SCN_TMP/fumaca.out" 2>&1; local rc=$?
  cat "$SCN_TMP/fumaca.out"
  [[ $rc -eq 0 ]] || return 1
  nao_contem "$SCN_TMP/fumaca.out" '^ok\*    (archive-command-health|checksum-failures-guard|ssl-enforcement-audit|wal-level-logical-guard|pg-stat-statements-config)'
}
