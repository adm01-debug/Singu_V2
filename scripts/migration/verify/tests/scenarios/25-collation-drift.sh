#!/usr/bin/env bash
# 25c: sem drift real (sandbox limpo) o guard sai 0. Valida caminho happy.
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../collation-version-mismatch.sql"; }
cleanup_scenario(){ :; }