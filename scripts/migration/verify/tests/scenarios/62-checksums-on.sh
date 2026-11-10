#!/usr/bin/env bash
# checksum-failures-guard.sql — lado ok: cluster criado com --data-checksums.
CLUSTER=endurecido
EXPECTED_EXIT=0
run_guard(){ guard checksum-failures-guard.sql; }
