#!/usr/bin/env bash
# wal-level-logical-guard.sql — lado ok: wal_level=logical com folga de slots/senders.
CLUSTER=endurecido
EXPECTED_EXIT=0
run_guard(){ guard wal-level-logical-guard.sql; }
