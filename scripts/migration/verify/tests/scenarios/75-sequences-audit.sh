#!/usr/bin/env bash
# sequences-audit.sql (gerador) + sequences-gap-check.sql: o SQL gerado tem de ser válido —
# inclusive com nome em maiúsculas e tabela em schema diferente da sequence — e, aplicado,
# tem de zerar o gap que o gap-check acusava.
EXPECTED_EXIT=0
setup(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE TABLE public.a(id serial PRIMARY KEY);
CREATE TABLE public."Mista"("Id" serial PRIMARY KEY);
CREATE SEQUENCE public."Seq B";
CREATE TABLE public.b(id bigint PRIMARY KEY DEFAULT nextval('public."Seq B"'));
ALTER SEQUENCE public."Seq B" OWNED BY public.b.id;
INSERT INTO public.a(id) VALUES (50);
INSERT INTO public."Mista"("Id") VALUES (70);
INSERT INTO public.b(id) VALUES (90);
CREATE TABLE public.vazia(id serial PRIMARY KEY);
SQL
}
run_guard(){
  espera_saida nonzero guard sequences-gap-check.sql >"$SCN_TMP/antes.log" 2>&1 || return 1
  contem "$SCN_TMP/antes.log" 'SEQUENCE GAP: 3 sequence' || return 1
  psql -X -Atq -v ON_ERROR_STOP=1 -f "$VERIFY_DIR/sequences-audit.sql" >"$SCN_TMP/fix.sql" || return 1
  [[ "$(grep -c '^SELECT setval' "$SCN_TMP/fix.sql")" == 4 ]] || { echo "esperava 4 setval"; cat "$SCN_TMP/fix.sql"; return 1; }
  psql -X -q -v ON_ERROR_STOP=1 -f "$SCN_TMP/fix.sql" >/dev/null || { echo "SQL gerado inválido"; cat "$SCN_TMP/fix.sql"; return 1; }
  guard sequences-gap-check.sql >"$SCN_TMP/depois.log" 2>&1 || { cat "$SCN_TMP/depois.log"; return 1; }
  sql "INSERT INTO public.a DEFAULT VALUES; INSERT INTO public.\"Mista\" DEFAULT VALUES; INSERT INTO public.b DEFAULT VALUES;"
}
