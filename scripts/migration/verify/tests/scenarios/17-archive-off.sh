#!/usr/bin/env bash
# Reproduz F4: archive_mode=off era falso-negativo silencioso.
# (O lado "ok" está em 63-archive-on.sh, no cluster endurecido.)
EXPECTED_EXIT=nonzero
requires(){ exige_config archive_mode off; }
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../archive-command-health.sql"; }
cleanup_scenario(){ :; }
