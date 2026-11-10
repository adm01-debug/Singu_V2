#!/usr/bin/env bash
# sequences-gap-check.sql — o original (a) estourava "relation _seq_gap_report does not
# exist" (TEMP ... ON COMMIT DROP em autocommit) e (b) reprovaria toda tabela saudável
# (last_value == MAX(id) depois de N inserts é o estado NORMAL).
# Limpo: serial, identity, nome com maiúscula e sequence ainda não usada com tabela vazia.
# Plantado: linha inserida com id explícito à frente da sequence (pós-import típico).
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE TABLE public.a(id serial PRIMARY KEY, v int);
INSERT INTO public.a(v) SELECT g FROM generate_series(1, 5) g;
CREATE TABLE public.b(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v int);
INSERT INTO public.b(v) VALUES (1), (2);
CREATE TABLE public."Mista"("Id" serial PRIMARY KEY);
INSERT INTO public."Mista" DEFAULT VALUES;
CREATE TABLE public.vazia(id serial PRIMARY KEY);
SQL
}
setup(){ sql "INSERT INTO public.a(id, v) VALUES (100, 0)"; }
run_guard(){ guard sequences-gap-check.sql; }
