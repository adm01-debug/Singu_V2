#!/usr/bin/env bash
# invalid-indexes-guard.sql (chamado pelo CI). Limpo: índices válidos. Plantado: um
# CREATE UNIQUE INDEX CONCURRENTLY que falha por duplicata deixa o índice INVALID.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){ sql "CREATE TABLE public.t(a int PRIMARY KEY, b int); CREATE INDEX t_b ON public.t(b); INSERT INTO public.t VALUES (1,1),(2,1);"; }
setup(){
  psql -X -q -c "CREATE UNIQUE INDEX CONCURRENTLY t_b_u ON public.t(b)" >/dev/null 2>&1
  [[ "$(sql_at "SELECT count(*) FROM pg_index WHERE indexrelid = 'public.t_b_u'::regclass AND NOT indisvalid")" == 1 ]]
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$VERIFY_DIR/invalid-indexes-guard.sql"; }   # igual ao ci.yml
