#!/usr/bin/env bash
# rls-coverage.sql — RLS ligada mas sem nenhuma policy também reprova; e a contagem do
# erro tem de ser o total de tabelas com lacuna (2), não 1.
EXPECTED_EXIT=0
setup(){
  sql "CREATE TABLE public.sem_policy(id int PRIMARY KEY); ALTER TABLE public.sem_policy ENABLE ROW LEVEL SECURITY;
       CREATE TABLE public.sem_rls(id int PRIMARY KEY);"
}
run_guard(){
  espera_saida nonzero psql -X -v ON_ERROR_STOP=1 -f "$VERIFY_DIR/rls-coverage.sql" >"$SCN_TMP/saida.log" 2>&1 || return 1
  contem "$SCN_TMP/saida.log" 'RLS COVERAGE FAILED: 2 tabela' || return 1
  contem "$SCN_TMP/saida.log" 'sem_policy .*NO_POLICY' || return 1
  contem "$SCN_TMP/saida.log" 'sem_rls .*RLS_DISABLED'
}
