#!/usr/bin/env bash
# index-corruption-amcheck.sql — limpo: amcheck real sobre índices íntegros. Plantado:
# bt_index_check trocado por um dublê que acusa corrupção (não dá para corromper um índice
# de verdade sem mexer nos arquivos do cluster).
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){ exige_extensao_disponivel amcheck; }
setup_ok(){
  sql "CREATE EXTENSION amcheck;
       CREATE TABLE public.t(id int PRIMARY KEY, v text);
       INSERT INTO public.t SELECT g, 'v' || g FROM generate_series(1, 500) g;
       CREATE INDEX t_v ON public.t(v);"
}
setup(){
  sql "CREATE OR REPLACE FUNCTION public.bt_index_check(index regclass, heapallindexed boolean)
       RETURNS void LANGUAGE plpgsql AS \$f\$ BEGIN RAISE EXCEPTION 'corrupcao simulada em %', index; END \$f\$;"
}
run_guard(){ guard index-corruption-amcheck.sql; }
