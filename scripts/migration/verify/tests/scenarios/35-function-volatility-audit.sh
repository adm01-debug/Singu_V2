#!/usr/bin/env bash
# function-volatility-audit.sql — está na lista FATAL mas só fazia SELECT (nunca falhava).
# Limpo: índice sobre function IMMUTABLE. Plantado: ALTER FUNCTION ... VOLATILE depois do
# CREATE INDEX (o Postgres aceita) — o índice passa a depender de function não-imutável.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  sql "CREATE FUNCTION public.norm(t text) RETURNS text LANGUAGE sql IMMUTABLE AS 'SELECT lower(t)';
       CREATE TABLE public.t(id int PRIMARY KEY, nome text);
       CREATE INDEX t_norm ON public.t (public.norm(nome));
       CREATE FUNCTION public.solta() RETURNS int LANGUAGE sql VOLATILE AS 'SELECT 1';"
}
setup(){ sql "ALTER FUNCTION public.norm(text) VOLATILE"; }
run_guard(){ guard function-volatility-audit.sql; }
