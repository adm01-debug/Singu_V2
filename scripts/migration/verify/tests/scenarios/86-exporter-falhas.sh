#!/usr/bin/env bash
# full-audit-exporter.sh quando a auditoria NÃO roda: nunca publica arquivo vazio/parcial.
# Publica guard_exporter_error 1, omite guard_exporter_up (dispara absent()) e repete os
# status + timestamp da última auditoria válida. Também: execução concorrente e diretório
# sem permissão.
EXPECTED_EXIT=0
setup(){ export TEXTFILE_DIR="$SCN_TMP/tf"; mkdir -p "$TEXTFILE_DIR"; }
run_guard(){
  local exp="$VERIFY_DIR/exporter/full-audit-exporter.sh" prom="$TEXTFILE_DIR/db_guards.prom" ts
  cat >"$SCN_TMP/ok.sh" <<'EOS'
echo "[full-audit 10:00:00] === FATAL: tables-without-pk.sql ==="
echo "[full-audit 10:00:00] === FAIL: tables-without-pk.sql ==="
echo "[full-audit 10:00:01] === WARN: bloat-monitor.sql ==="
exit 1
EOS
  printf 'echo "[full-audit 10:00:00] === ERRO DE CONEXAO: destino inacessivel ==="\nexit 3\n' >"$SCN_TMP/semdb.sh"
  printf 'sleep 30\n' >"$SCN_TMP/lento.sh"
  # 1) auditoria válida
  AUDIT_SCRIPT="$SCN_TMP/ok.sh" espera_saida 0 bash "$exp" || return 1
  valida_prom "$prom" || return 1
  contem "$prom" '^guard_exporter_up 1$' && contem "$prom" '^guard_exporter_error 0$' || return 1
  ts="$(grep -E '^guard_last_run_timestamp_seconds ' "$prom")"
  sleep 1.1
  # 2) sem conexão: saída 3, arquivo completo, status/timestamp preservados
  AUDIT_SCRIPT="$SCN_TMP/semdb.sh" espera_saida 3 bash "$exp" 2>/dev/null || return 1
  valida_prom "$prom" || return 1
  contem "$prom" '^guard_exporter_error 1$' && contem "$prom" '^guard_audit_exit_code 3$' || return 1
  nao_contem "$prom" '^guard_exporter_up' || return 1
  contem "$prom" '^guard_status\{name="tables-without-pk",severity="fatal"\} 2$' || return 1
  [[ "$(grep -E '^guard_last_run_timestamp_seconds ' "$prom")" == "$ts" ]] || { echo "timestamp avançou sem auditoria válida"; return 1; }
  # 3) script ausente e estouro de tempo
  AUDIT_SCRIPT="$SCN_TMP/nao-existe.sh" espera_saida 3 bash "$exp" 2>/dev/null || return 1
  contem "$prom" '^guard_audit_exit_code 127$' || return 1
  AUDIT_SCRIPT="$SCN_TMP/lento.sh" AUDIT_TIMEOUT_SECONDS=1 espera_saida 3 bash "$exp" 2>/dev/null || return 1
  contem "$prom" '^guard_audit_exit_code 124$' && valida_prom "$prom" || return 1
  # 4) primeira execução já falhando (sem arquivo anterior): ainda assim válido
  rm -f "$prom"
  AUDIT_SCRIPT="$SCN_TMP/semdb.sh" espera_saida 3 bash "$exp" 2>/dev/null || return 1
  valida_prom "$prom" && nao_contem "$prom" '^guard_(status|last_run|exporter_up)' || return 1
  # 5) concorrência: com uma execução em andamento, a segunda sai 0 sem tocar no arquivo
  AUDIT_SCRIPT="$SCN_TMP/ok.sh" bash "$exp" || return 1
  cp "$prom" "$SCN_TMP/antes.prom"
  AUDIT_SCRIPT="$SCN_TMP/lento.sh" AUDIT_TIMEOUT_SECONDS=3 bash "$exp" >/dev/null 2>&1 &
  local lenta=$!
  sleep 0.7
  AUDIT_SCRIPT="$SCN_TMP/semdb.sh" espera_saida 0 bash "$exp" 2>"$SCN_TMP/conc.err" || return 1
  contem "$SCN_TMP/conc.err" 'outra execucao' || return 1
  cmp -s "$prom" "$SCN_TMP/antes.prom" || { echo "arquivo alterado durante execução concorrente"; return 1; }
  wait "$lenta"
  # 6) permissões do arquivo publicado e nenhum temporário esquecido
  [[ "$(stat -c %a "$prom")" == 644 ]] || { echo "modo $(stat -c %a "$prom") != 644"; return 1; }
  [[ -z "$(find "$TEXTFILE_DIR" -name '.db_guards.??????')" ]] || { echo "sobrou temporário"; return 1; }
  # 7) diretório inexistente/não gravável → saída 1 (quando não somos root, que ignora permissão)
  if [[ $EUID -ne 0 ]]; then
    mkdir "$SCN_TMP/ro" && chmod 555 "$SCN_TMP/ro"
    TEXTFILE_DIR="$SCN_TMP/ro" AUDIT_SCRIPT="$SCN_TMP/ok.sh" espera_saida 1 bash "$exp" 2>/dev/null || return 1
  fi
  TEXTFILE_DIR="/proc/nao-existe" AUDIT_SCRIPT="$SCN_TMP/ok.sh" espera_saida 1 bash "$exp" 2>/dev/null
}
