#!/usr/bin/env bash
# Reproduz F1: 'idle in transaction (aborted)' era ignorado pelo guard antigo.
EXPECTED_EXIT=nonzero
PIDFILE=/tmp/guard-idle-abt.pid
setup(){
  ( psql -c "BEGIN; SELECT 1/0; SELECT pg_sleep(3600);" & echo $! > $PIDFILE ) >/dev/null 2>&1
  sleep 1
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../idle-in-transaction-guard.sql"; }
cleanup_scenario(){ [[ -f $PIDFILE ]] && kill -TERM "$(cat $PIDFILE)" 2>/dev/null; rm -f $PIDFILE; }