#!/usr/bin/env bash
# 25e: WARN nao interrompe; guard sempre exit 0.
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../pitr-retention-window.sql"; }
cleanup_scenario(){ :; }