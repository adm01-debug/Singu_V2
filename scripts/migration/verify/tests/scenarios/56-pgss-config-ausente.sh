#!/usr/bin/env bash
# pg-stat-statements-config.sql — a extensão é o próprio objeto da checagem: sem ela, falha
# com mensagem própria (não erro cru). Também falha se instalada mas não carregada — antes
# respondia "OK config track=<NULL>".
EXPECTED_EXIT=0
run_guard(){
  espera_saida nonzero guard pg-stat-statements-config.sql >"$SCN_TMP/a.log" 2>&1 || return 1
  contem "$SCN_TMP/a.log" 'pg_stat_statements NAO instalado' || return 1
  if [[ "$(config shared_preload_libraries)" != *pg_stat_statements* ]]; then
    sql "CREATE EXTENSION pg_stat_statements" || return 1
    espera_saida nonzero guard pg-stat-statements-config.sql >"$SCN_TMP/b.log" 2>&1 || return 1
    contem "$SCN_TMP/b.log" 'instalado mas NAO carregado'
  fi
}
