#!/usr/bin/env bash
# Gap 24: TLS desabilitado (padrao do sandbox).
# (O lado "ok" está em 64-ssl-on.sh, no cluster endurecido.)
EXPECTED_EXIT=nonzero
requires(){ exige_config ssl off; }
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../ssl-enforcement-audit.sql"; }
cleanup_scenario(){ :; }
