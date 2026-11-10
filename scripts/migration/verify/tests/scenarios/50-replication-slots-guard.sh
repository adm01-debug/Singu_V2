#!/usr/bin/env bash
# replication-slots-guard.sql — mesmo desenho do 21, com o limiar próprio deste guard.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){ [[ "$(config max_replication_slots)" -ge 2 ]] || { echo "exige max_replication_slots >= 2"; return 1; }; }
setup_ok(){ sql "SELECT pg_create_physical_replication_slot('${SCN_ID}_vazio')"; }
setup(){
  sql "SELECT pg_create_physical_replication_slot('${SCN_ID}_retem', true)" || return 1
  sql "CREATE TABLE public.t_wal AS SELECT g, repeat('x', 200) AS pad FROM generate_series(1, 30000) g" || return 1
  sql "SELECT pg_switch_wal()"
}
run_guard(){ guard replication-slots-guard.sql -v max_retido_mb=1; }
cleanup_scenario(){
  psql -X -q -c "SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots
                  WHERE slot_name LIKE '${SCN_ID}\\_%' AND NOT active" >/dev/null 2>&1 || true
}
