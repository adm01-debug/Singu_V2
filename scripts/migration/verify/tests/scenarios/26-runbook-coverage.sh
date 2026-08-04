#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){ bash "$SCRIPT_DIR/../../../../scripts/monitoring/check-runbook-coverage.sh"; }
cleanup_scenario(){ :; }