#!/usr/bin/env bash
# relfrozenxid-table-guard.sql — idem 40, por tabela.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
run_guard_ok(){ guard relfrozenxid-table-guard.sql; }
run_guard(){ guard relfrozenxid-table-guard.sql -v max_age=0 -v warn_age=0; }
