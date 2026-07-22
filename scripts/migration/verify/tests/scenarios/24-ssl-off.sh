#!/usr/bin/env bash
# Gap 24: TLS desabilitado (padrao do sandbox).
EXPECTED_EXIT=nonzero
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../ssl-enforcement-audit.sql"; }
cleanup_scenario(){ :; }