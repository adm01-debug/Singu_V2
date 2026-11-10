#!/usr/bin/env bash
# 25d: cria publication sobre tabela sem PK e sem REPLICA IDENTITY FULL.
# Limpo: publicadas com PK, com REPLICA IDENTITY FULL e com USING INDEX passam.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<'SQL'
CREATE TABLE public.t_pk(a int PRIMARY KEY);
CREATE TABLE public.t_full(a int); ALTER TABLE public.t_full REPLICA IDENTITY FULL;
CREATE TABLE public.t_idx(a int NOT NULL); CREATE UNIQUE INDEX t_idx_u ON public.t_idx(a);
ALTER TABLE public.t_idx REPLICA IDENTITY USING INDEX t_idx_u;
CREATE PUBLICATION pub_ok FOR TABLE public.t_pk, public.t_full, public.t_idx;
SQL
}
setup(){
  psql -c "CREATE TABLE public.t_no_ri(a int, b text);" >/dev/null
  psql -c "CREATE PUBLICATION pub_gap25 FOR TABLE public.t_no_ri;" >/dev/null 2>&1
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../logical-replica-identity.sql"; }
cleanup_scenario(){
  psql -c "DROP PUBLICATION IF EXISTS pub_gap25;" >/dev/null
  psql -c "DROP TABLE IF EXISTS public.t_no_ri;" >/dev/null
}
