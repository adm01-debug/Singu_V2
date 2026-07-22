#!/usr/bin/env bash
# Reproduz F2: SECDEF com search_path=public era aceito.
EXPECTED_EXIT=nonzero
setup(){
  psql -c "CREATE OR REPLACE FUNCTION public.f_bad() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS 'SELECT 1';" >/dev/null
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../function-search-path-reset-audit.sql"; }
cleanup_scenario(){ psql -c "DROP FUNCTION IF EXISTS public.f_bad();" >/dev/null; }