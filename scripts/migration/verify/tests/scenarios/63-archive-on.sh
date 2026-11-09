#!/usr/bin/env bash
# archive-command-health.sql — lado ok: archive_mode=on com archive_command que funciona.
# O original nem compilava aqui ("too many parameters specified for RAISE": '%%%%' + 1 arg),
# ou seja, reprovava todo cluster SAUDÁVEL.
CLUSTER=endurecido
EXPECTED_EXIT=0
setup(){ sql "CREATE TABLE public.t AS SELECT 1 AS a; SELECT pg_switch_wal();" && espera_ate "SELECT archived_count > 0 FROM pg_stat_archiver" 20; }
run_guard(){ guard archive-command-health.sql; }
