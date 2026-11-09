#!/usr/bin/env bash
# collation-version-mismatch.sql — plantado: collation ICU própria com collversion adulterada
# no catálogo deste banco (equivale ao estado após upgrade de ICU/glibc sem REFRESH VERSION).
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){
  [[ "$(sql_at "SELECT count(*) > 0 FROM pg_collation WHERE collprovider = 'i'")" == t ]] || { echo "servidor sem suporte a ICU"; return 1; }
  [[ "$(sql_at "SELECT rolsuper FROM pg_roles WHERE rolname = current_user")" == t ]] || { echo "exige superuser (UPDATE em pg_collation)"; return 1; }
}
setup_ok(){ sql "CREATE COLLATION public.col_teste (provider = icu, locale = 'pt-BR')"; }
setup(){ sql "UPDATE pg_collation SET collversion = '0.0.0' WHERE collname = 'col_teste'"; }
run_guard(){ guard collation-version-mismatch.sql; }
