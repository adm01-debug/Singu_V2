#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){ :; }
run_guard(){
  F="$SCRIPT_DIR/../../../../monitoring/alertmanager/alertmanager.yml"
  grep -q 'maintenance="true"' "$F" || return 1
  grep -q "receiver: 'null'" "$F" || return 1
  grep -q "inhibit_rules:" "$F" || return 1
}
cleanup_scenario(){ :; }