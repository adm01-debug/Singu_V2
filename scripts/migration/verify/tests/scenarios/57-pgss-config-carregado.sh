#!/usr/bin/env bash
# pg-stat-statements-config.sql — lado ok: extensão instalada e carregada; e as três
# consultas que dependem dela (reset-guard, plan-cache-bloat, query-plan-regression) rodam
# de verdade, inclusive com a extensão fora do search_path (como no Supabase: schema extensions).
EXPECTED_EXIT=0
requires(){ exige_pgss_carregado; }
setup(){ sql "CREATE SCHEMA extensions; CREATE EXTENSION pg_stat_statements SCHEMA extensions; SELECT count(*) FROM pg_class;"; }
run_guard(){
  guard pg-stat-statements-config.sql || return 1
  guard plan-cache-bloat.sql -v min_calls=1 >"$SCN_TMP/plan.log" 2>&1 || { cat "$SCN_TMP/plan.log"; return 1; }
  nao_contem "$SCN_TMP/plan.log" 'SKIP' || return 1
  guard query-plan-regression.sql -v min_calls=1 >"$SCN_TMP/qpr.log" 2>"$SCN_TMP/qpr.err" || { cat "$SCN_TMP/qpr.err"; return 1; }
  contem "$SCN_TMP/qpr.log" '"queryid"' || return 1
  guard pg-stat-statements-reset-guard.sql -v min_janela_min=0 2>&1 | tee "$SCN_TMP/reset.log"
  contem "$SCN_TMP/reset.log" 'stats_reset='
}
