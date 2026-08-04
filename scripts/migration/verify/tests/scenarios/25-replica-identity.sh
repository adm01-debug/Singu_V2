#!/usr/bin/env bash
# 25d: cria publication sobre tabela sem PK e sem REPLICA IDENTITY FULL.
EXPECTED_EXIT=nonzero
setup(){
  psql -c "CREATE TABLE public.t_no_ri(a int, b text);" >/dev/null
  psql -c "CREATE PUBLICATION pub_gap25 FOR TABLE public.t_no_ri;" >/dev/null
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../logical-replica-identity.sql"; }
cleanup_scenario(){
  psql -c "DROP PUBLICATION IF EXISTS pub_gap25;" >/dev/null
  psql -c "DROP TABLE IF EXISTS public.t_no_ri;" >/dev/null
}