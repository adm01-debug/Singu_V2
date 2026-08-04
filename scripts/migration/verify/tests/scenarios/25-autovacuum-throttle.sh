#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../autovacuum-throttle-audit.sql"; }
cleanup_scenario(){ :; }