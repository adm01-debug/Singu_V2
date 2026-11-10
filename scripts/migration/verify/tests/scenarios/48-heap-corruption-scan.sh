#!/usr/bin/env bash
# heap-corruption-scan.sql — limpo: pg_visibility real sobre tabela íntegra (o cenário
# 25-heap-corruption cobre o SKIP sem a extensão). Plantado: pg_check_visible trocado por
# um dublê que devolve um TID "inconsistente".
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){ exige_extensao_disponivel pg_visibility; }
setup_ok(){
  sql "CREATE EXTENSION pg_visibility;
       CREATE TABLE public.t(id int PRIMARY KEY, v text);
       INSERT INTO public.t SELECT g, 'v' || g FROM generate_series(1, 500) g;" || return 1
  sql "VACUUM public.t"
}
setup(){
  sql "CREATE OR REPLACE FUNCTION public.pg_check_visible(regclass, OUT t_ctid tid)
       RETURNS SETOF tid LANGUAGE sql AS \$f\$ SELECT '(0,1)'::tid \$f\$;"
}
run_guard(){ guard heap-corruption-scan.sql; }
