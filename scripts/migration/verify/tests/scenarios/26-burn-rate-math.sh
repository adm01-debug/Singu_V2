#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){
  F="$SCRIPT_DIR/../../../../monitoring/prometheus/rules/slo-burn-rate.yml"
  grep -q '14.4 \* 0.005' "$F" || return 1
  grep -q '6 \* 0.005' "$F" || return 1
}
cleanup_scenario(){ :; }