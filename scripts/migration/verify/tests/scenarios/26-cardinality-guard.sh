#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){
  F="$SCRIPT_DIR/../../../../monitoring/prometheus/rules/db-guards.yml"
  grep -q 'record: db_guards:count_by_severity' "$F" || return 1
  grep -q 'record: db_guards:fatal_active' "$F" || return 1
}
cleanup_scenario(){ :; }