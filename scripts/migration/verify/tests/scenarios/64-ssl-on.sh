#!/usr/bin/env bash
# ssl-enforcement-audit.sql — lado ok: ssl=on e todas as conexões TCP de cliente com TLS.
CLUSTER=endurecido
EXPECTED_EXIT=0
run_guard(){ guard ssl-enforcement-audit.sql; }
