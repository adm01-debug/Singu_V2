#!/usr/bin/env bash
# multixact-wraparound-guard.sql — idem 40: default passa; limiar -1 falha (age >= 0).
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
run_guard_ok(){ guard multixact-wraparound-guard.sql; }
run_guard(){ guard multixact-wraparound-guard.sql -v max_age=-1; }
