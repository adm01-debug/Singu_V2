#!/usr/bin/env bash
# Reproduz F2: SECDEF com search_path=public era aceito.
# Lado limpo: search_path='' (gravado como search_path="") e pg_catalog-first têm de passar
# — o guard antigo reprovava o search_path vazio, que é justamente o recomendado.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  sql "CREATE FUNCTION public.f_vazio() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = '' AS 'SELECT 1';
       CREATE FUNCTION public.f_cat() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS 'SELECT 1';
       CREATE FUNCTION public.f_invoker() RETURNS int LANGUAGE sql AS 'SELECT 1';"
}
setup(){
  psql -c "CREATE OR REPLACE FUNCTION public.f_bad() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS 'SELECT 1';" >/dev/null
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../function-search-path-reset-audit.sql"; }
cleanup_scenario(){ psql -c "DROP FUNCTION IF EXISTS public.f_bad();" >/dev/null; }
