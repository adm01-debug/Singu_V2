#!/usr/bin/env bash
# rls-coverage.sql (chamado pelo CI). Limpo: RLS + policy, tabela interna (_prefixo) e
# partição-filha (herda a policy da pai) não contam. Plantado: tabela sem RLS.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE TABLE public.protegida(id int PRIMARY KEY);
ALTER TABLE public.protegida ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.protegida FOR SELECT USING (true);
CREATE TABLE public._interna(id int PRIMARY KEY);
CREATE TABLE public.part(id int, d date, PRIMARY KEY (id, d)) PARTITION BY RANGE (d);
ALTER TABLE public.part ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.part FOR SELECT USING (true);
CREATE TABLE public.part_2026 PARTITION OF public.part FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
SQL
}
setup(){ sql "CREATE TABLE public.exposta(id int PRIMARY KEY)"; }
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$VERIFY_DIR/rls-coverage.sql"; }   # igual ao ci.yml
