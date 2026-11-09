#!/usr/bin/env bash
# connection-pool-exhaustion-canary.sh, planner-stats-freshness.sh e
# timeline-divergence-guard.sh contra um banco real — os dois lados de cada um.
EXPECTED_EXIT=0
setup(){ sql "CREATE TABLE public.t(id int PRIMARY KEY); INSERT INTO public.t SELECT g FROM generate_series(1, 100) g;"; }
run_guard(){
  export DEST_DB_URL SRC_DB_URL; DEST_DB_URL="$(db_url)"; SRC_DB_URL="$DEST_DB_URL"
  local c="$VERIFY_DIR/connection-pool-exhaustion-canary.sh" p="$VERIFY_DIR/planner-stats-freshness.sh" t="$VERIFY_DIR/timeline-divergence-guard.sh"
  # canário: 100% nunca é ultrapassado; 0% sempre é (há ao menos a própria conexão)
  THRESHOLD_PCT=100 espera_saida 0 bash "$c" >"$SCN_TMP/c0.log" 2>&1 || { cat "$SCN_TMP/c0.log"; return 1; }
  contem "$SCN_TMP/c0.log" 'OK pool saudavel' || return 1
  THRESHOLD_PCT=0 espera_saida 1 bash "$c" >"$SCN_TMP/c1.log" 2>&1 || { cat "$SCN_TMP/c1.log"; return 1; }
  contem "$SCN_TMP/c1.log" 'WARN: uso de pool' || return 1
  nao_contem "$SCN_TMP/c1.log" 'OK pool saudavel' || return 1      # antes imprimia WARN e OK juntos, saindo 0
  THRESHOLD_PCT=abc espera_saida 2 bash "$c" >/dev/null 2>&1 || return 1
  DEST_DB_URL="postgresql://x@127.0.0.1:1/x" PGCONNECT_TIMEOUT=2 espera_saida 2 bash "$c" >"$SCN_TMP/c2.log" 2>&1 || return 1
  contem "$SCN_TMP/c2.log" 'canario nao avaliado' || return 1
  # planner-stats: sem ANALYZE a tabela nunca analisada reprova; com ANALYZE passa
  espera_saida 1 bash "$p" --sem-analyze >"$SCN_TMP/p1.log" 2>&1 || { cat "$SCN_TMP/p1.log"; return 1; }
  contem "$SCN_TMP/p1.log" 'ALERTA 1 tabela' || return 1
  espera_saida 0 bash "$p" >"$SCN_TMP/p0.log" 2>&1 || { cat "$SCN_TMP/p0.log"; return 1; }
  MAX_AGE_HOURS="1; DROP TABLE public.t" espera_saida 2 bash "$p" >/dev/null 2>&1 || return 1
  [[ "$(sql_at 'SELECT count(*) FROM public.t')" == 100 ]] || return 1
  espera_saida 2 bash "$p" --apaga-tudo >/dev/null 2>&1 || return 1
  # timeline: mesmo cluster nos dois lados → alinhadas; psql dublê devolvendo timelines diferentes → 1
  espera_saida 0 bash "$t" >"$SCN_TMP/t0.log" 2>&1 || { cat "$SCN_TMP/t0.log"; return 1; }
  (
    dubla psql <<'EOS'
case "$*" in *origem*) echo 3 ;; *destino*) echo 4 ;; *vazio*) echo "" ;; *) exit 2 ;; esac
EOS
    SRC_DB_URL=origem DEST_DB_URL=destino espera_saida 1 bash "$t" >"$SCN_TMP/t1.log" 2>&1 || exit 1
    contem "$SCN_TMP/t1.log" 'FATAL: timelines divergentes' || exit 1
    SRC_DB_URL=origem DEST_DB_URL=vazio espera_saida 2 bash "$t" >/dev/null 2>&1 || exit 1
    SRC_DB_URL=origem DEST_DB_URL=quebrado espera_saida 2 bash "$t" >"$SCN_TMP/t2.log" 2>&1 || exit 1
    contem "$SCN_TMP/t2.log" 'nao li o timeline do DESTINO'
  ) || return 1
}
