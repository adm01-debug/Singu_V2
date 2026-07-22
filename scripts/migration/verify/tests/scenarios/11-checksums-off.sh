#!/usr/bin/env bash
# Reproduz F3: cluster sem data_checksums era silenciosamente aprovado.
EXPECTED_EXIT=nonzero
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../checksum-failures-guard.sql"; }
cleanup_scenario(){ :; }