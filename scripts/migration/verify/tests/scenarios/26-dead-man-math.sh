#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){
  grep -q '(time() - guard_last_run_timestamp_seconds) > 7200' \
    "$SCRIPT_DIR/../../../../monitoring/prometheus/rules/db-guards.yml"
}
cleanup_scenario(){ :; }