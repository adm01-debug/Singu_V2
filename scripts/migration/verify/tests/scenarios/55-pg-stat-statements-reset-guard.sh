#!/usr/bin/env bash
# pg-stat-statements-reset-guard.sql — plantado: pg_stat_statements_reset() agora → janela
# menor que 60 min. Limpo: mesma situação com -v min_janela_min=0 (qualquer janela serve).
# (Sem a extensão/biblioteca o guard faz SKIP — coberto pela fumaça 70/71.)
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){ exige_pgss_carregado; }
setup_ok(){ sql "CREATE EXTENSION pg_stat_statements"; }
setup(){ sql "SELECT pg_stat_statements_reset()"; }
run_guard_ok(){ guard pg-stat-statements-reset-guard.sql -v min_janela_min=0; }
run_guard(){ guard pg-stat-statements-reset-guard.sql; }
