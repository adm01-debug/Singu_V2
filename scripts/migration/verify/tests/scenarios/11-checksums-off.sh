#!/usr/bin/env bash
# Reproduz F3: cluster sem data_checksums era silenciosamente aprovado.
# (O lado "ok" está em 62-checksums-on.sh, no cluster endurecido.)
EXPECTED_EXIT=nonzero
requires(){ exige_config data_checksums off; }
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../checksum-failures-guard.sql"; }
cleanup_scenario(){ :; }
