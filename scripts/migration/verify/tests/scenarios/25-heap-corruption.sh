#!/usr/bin/env bash
# 25a: sem pg_visibility, guard faz skip (exit 0). Cobre caminho seguro.
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../heap-corruption-scan.sql"; }
cleanup_scenario(){ :; }