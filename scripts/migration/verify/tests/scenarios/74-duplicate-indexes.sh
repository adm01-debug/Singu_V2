#!/usr/bin/env bash
# duplicate-indexes.sql — o original agrupava por pg_get_indexdef(), que contém o NOME do
# índice: dois índices idênticos nunca eram apontados. Aqui: par idêntico é listado junto;
# índice com ordenação diferente, predicado diferente ou outra coluna NÃO entra no grupo.
EXPECTED_EXIT=0
setup(){
  sql "CREATE TABLE public.t(id int PRIMARY KEY, a int, b int);
       CREATE INDEX t_a_1 ON public.t(a);
       CREATE INDEX t_a_2 ON public.t(a);
       CREATE INDEX t_a_desc ON public.t(a DESC);
       CREATE INDEX t_a_parcial ON public.t(a) WHERE b > 0;
       CREATE INDEX t_b ON public.t(b);"
}
run_guard(){
  guard duplicate-indexes.sql >"$SCN_TMP/saida.log" 2>&1 || { cat "$SCN_TMP/saida.log"; return 1; }
  contem "$SCN_TMP/saida.log" '\{t_a_1,t_a_2\}' || return 1
  nao_contem "$SCN_TMP/saida.log" 't_a_desc|t_a_parcial|\{.*t_b' || return 1
  contem "$SCN_TMP/saida.log" '\(1 row\)'
}
