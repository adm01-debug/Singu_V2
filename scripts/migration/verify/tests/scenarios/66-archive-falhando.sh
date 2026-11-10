#!/usr/bin/env bash
# archive-command-health.sql — archive_mode=on mas o archive_command falha: a taxa de falha
# passa do limiar. Altera archive_command SÓ no sandbox endurecido (descartável) e desfaz.
CLUSTER=endurecido
EXPECTED_EXIT=nonzero
setup(){
  sql "SELECT pg_stat_reset_shared('archiver')" || return 1
  psql -X -q -c "ALTER SYSTEM SET archive_command = '/bin/false'" -c "SELECT pg_reload_conf()" >/dev/null || return 1
  sql "CREATE TABLE public.t AS SELECT 1 AS a; SELECT pg_switch_wal();" || return 1
  espera_ate "SELECT failed_count > 0 FROM pg_stat_archiver" 30
}
run_guard(){ guard archive-command-health.sql -v max_falha_pct=5; }
cleanup_scenario(){
  psql -X -q -c "ALTER SYSTEM SET archive_command = '/bin/true'" -c "SELECT pg_reload_conf()" >/dev/null 2>&1
  sleep 1
  psql -X -q -c "SELECT pg_stat_reset_shared('archiver')" >/dev/null 2>&1 || true
}
