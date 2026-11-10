#!/usr/bin/env bash
# wal-level-logical-guard.sql — lado ruim: cluster com wal_level != logical.
# (O lado "ok" está em 61-wal-level-logical-ok.sh, no cluster endurecido.)
EXPECTED_EXIT=nonzero
requires(){ [[ "$(config wal_level)" != logical ]] || { echo "cluster já está em wal_level=logical"; return 1; }; }
run_guard(){ guard wal-level-logical-guard.sql; }
