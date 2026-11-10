#!/usr/bin/env bash
# datfrozenxid-age-guard.sql — wraparound real não é reproduzível; prova a direção da
# comparação: limiar default passa, limiar 0 falha (todo database tem age > 0).
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
run_guard_ok(){ guard datfrozenxid-age-guard.sql; }
run_guard(){ guard datfrozenxid-age-guard.sql -v max_age=0; }
