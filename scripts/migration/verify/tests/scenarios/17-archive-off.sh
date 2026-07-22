#!/usr/bin/env bash
# Reproduz F4: archive_mode=off era falso-negativo silencioso.
EXPECTED_EXIT=nonzero
setup(){ :; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../archive-command-health.sql"; }
cleanup_scenario(){ :; }