#!/usr/bin/env bash
# logical-publication-guard.sql — o original estourava erro de sintaxe (:'pub' dentro de
# $BODY$ não é interpolado pelo psql). Limpo: publicação com tabela e FOR ALL TABLES.
# Plantado: publicação vazia e publicação inexistente.
EXPECTED_EXIT=0
DOIS_LADOS=1
setup_ok(){
  sql "CREATE TABLE public.t(id int PRIMARY KEY)" || return 1
  psql -X -q -c "CREATE PUBLICATION pub_ok FOR TABLE public.t" -c "CREATE PUBLICATION pub_all FOR ALL TABLES" >/dev/null 2>&1
}
setup(){ psql -X -q -c "CREATE PUBLICATION pub_vazia" >/dev/null 2>&1; }
run_guard_ok(){ guard logical-publication-guard.sql -v pub=pub_ok && guard logical-publication-guard.sql -v pub=pub_all; }
run_guard(){
  espera_saida nonzero guard logical-publication-guard.sql -v pub=pub_vazia >"$SCN_TMP/v.log" 2>&1 || return 1
  contem "$SCN_TMP/v.log" 'publicacao pub_vazia sem tabelas' || return 1
  espera_saida nonzero guard logical-publication-guard.sql >"$SCN_TMP/d.log" 2>&1 || return 1
  contem "$SCN_TMP/d.log" 'publicacao singu_cdc nao existe'
}
