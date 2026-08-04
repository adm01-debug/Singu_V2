#!/usr/bin/env bash
# Gap 21: slot inativo retendo WAL.
EXPECTED_EXIT=nonzero
setup(){
  psql -c "SELECT pg_create_physical_replication_slot('gap21_slot');" >/dev/null
  psql -c "SELECT pg_advance_replication_slot('gap21_slot', '0/1');" >/dev/null 2>&1 || true
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../replication-slot-idle-guard.sql"; }
cleanup_scenario(){ psql -c "SELECT pg_drop_replication_slot('gap21_slot');" >/dev/null 2>&1 || true; }