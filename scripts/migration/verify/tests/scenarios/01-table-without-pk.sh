#!/usr/bin/env bash
EXPECTED_EXIT=nonzero
setup()   { psql -c "CREATE TABLE public.t_no_pk(a int);" >/dev/null; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../tables-without-pk.sql"; }
cleanup_scenario(){ psql -c "DROP TABLE IF EXISTS public.t_no_pk;" >/dev/null; }