#!/usr/bin/env bash
# tables-without-pk.sql — limpo: tabela com PK passa; plantado: tabela sem PK falha.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){ psql -c "CREATE TABLE public.t_com_pk(a int PRIMARY KEY);" >/dev/null; }
setup()   { psql -c "CREATE TABLE public.t_no_pk(a int);" >/dev/null; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../tables-without-pk.sql"; }
cleanup_scenario(){ psql -c "DROP TABLE IF EXISTS public.t_no_pk, public.t_com_pk;" >/dev/null; }
