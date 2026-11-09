#!/usr/bin/env bash
# dead-tuple-ratio-guard.sql — limpo: tabela grande sem dead tuples (não divide por zero
# em banco vazio). Plantado: 75% de dead tuples com autovacuum desligado na tabela;
# limiar de tamanho reduzido por -v min_linhas.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  sql "CREATE TABLE public.vazia(id int PRIMARY KEY);
       CREATE TABLE public.limpa(id int PRIMARY KEY) WITH (autovacuum_enabled = false);
       INSERT INTO public.limpa SELECT g FROM generate_series(1, 4000) g;" || return 1
  espera_ate "SELECT n_live_tup >= 4000 FROM pg_stat_user_tables WHERE relname = 'limpa'" 15
}
setup(){
  sql "CREATE TABLE public.suja(id int PRIMARY KEY) WITH (autovacuum_enabled = false);
       INSERT INTO public.suja SELECT g FROM generate_series(1, 4000) g;" || return 1
  sql "DELETE FROM public.suja WHERE id > 1000" || return 1
  espera_ate "SELECT n_dead_tup >= 3000 FROM pg_stat_user_tables WHERE relname = 'suja'" 15
}
run_guard(){ guard dead-tuple-ratio-guard.sql -v min_linhas=2000 -v max_pct=40; }
