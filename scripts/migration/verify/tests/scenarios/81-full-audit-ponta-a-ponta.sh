#!/usr/bin/env bash
# full-audit.sh contra um banco real com dados saudáveis: roda TODOS os arquivos das listas,
# os únicos FAIL são os de config do cluster, nenhum WARN quebra por erro cru, e o código de
# saída acompanha os FAIL. Depois planta uma tabela sem PK: o FAIL aparece e a saída é 1.
EXPECTED_EXIT=0
setup(){ psql -X -q -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/fixtures/dados.sql" >/dev/null 2>&1; }
run_guard(){
  local log="$SCN_TMP/audit.log" rc n_listados n_rodados inesperados warnfail
  ( cd / && DEST_DB_URL="$(db_url)" bash "$VERIFY_DIR/full-audit.sh" ) >"$log" 2>&1; rc=$?
  n_listados="$(bash "$VERIFY_DIR/full-audit.sh" --listar | grep -c -E '^(FATAL|WARN) ')"
  n_rodados="$(grep -c -E '=== (FATAL|WARN): .*\.sql ===$' "$log")"
  [[ "$n_listados" == "$n_rodados" ]] || { echo "rodou $n_rodados de $n_listados"; return 1; }
  inesperados="$(grep -E '=== FAIL: ' "$log" | grep -v -E 'FAIL: (archive-command-health|checksum-failures-guard|ssl-enforcement-audit|wal-level-logical-guard)\.sql' || true)"
  [[ -z "$inesperados" ]] || { echo "FAIL inesperado: $inesperados"; grep -B3 -E '=== FAIL: ' "$log" | grep ERROR; return 1; }
  # WARN-FAIL só é aceitável para pg-stat-statements-config (extensão ausente/não carregada)
  warnfail="$(grep -E '=== WARN-FAIL: ' "$log" | grep -v 'pg-stat-statements-config.sql' || true)"
  [[ -z "$warnfail" ]] || { echo "WARN-FAIL inesperado: $warnfail"; return 1; }
  if grep -q '=== FAIL: ' "$log"; then [[ $rc -eq 1 ]] || { echo "rc=$rc com FAIL"; return 1; }
  else [[ $rc -eq 0 ]] || { echo "rc=$rc sem FAIL"; tail -5 "$log"; return 1; }; fi
  nao_contem "$log" 'fora de sincronia' || return 1
  sql "CREATE TABLE public.sem_pk(a int)" || return 1
  DEST_DB_URL="$(db_url)" espera_saida 1 bash "$VERIFY_DIR/full-audit.sh" >"$log.2" 2>&1 || return 1
  contem "$log.2" '=== FAIL: tables-without-pk.sql ===' || return 1
  contem "$log.2" '=== WARN-FAIL: rls-coverage.sql ==='
}
