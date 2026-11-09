#!/usr/bin/env bash
# Exporter de verdade: full-audit.sh real contra um banco com dados → textfile válido, uma
# série por guard da bateria, e cada nome usado pelas regras db-guards.yml realmente emitido.
EXPECTED_EXIT=0
setup(){
  export TEXTFILE_DIR="$SCN_TMP/tf"; mkdir -p "$TEXTFILE_DIR"
  psql -X -q -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/fixtures/dados.sql" >/dev/null 2>&1
}
run_guard(){
  local prom="$TEXTFILE_DIR/db_guards.prom" n m
  DEST_DB_URL="$(db_url)" bash "$VERIFY_DIR/exporter/full-audit-exporter.sh" || return 1
  valida_prom "$prom" || return 1
  n="$(grep -c '^guard_status{' "$prom")"
  m="$(bash "$VERIFY_DIR/full-audit.sh" --listar | grep -c -E '^(FATAL|WARN) ')"
  [[ "$n" == "$m" ]] || { echo "$n séries guard_status para $m guards"; return 1; }
  contem "$prom" '^guard_status\{name="tables-without-pk",severity="fatal"\} 0$' || return 1
  contem "$prom" '^guard_status\{name="autovacuum-audit",severity="warn"\} 1$' || return 1   # fixture tem autovacuum desligado
  contem "$prom" '^guard_exporter_up 1$' || return 1
  # toda métrica guard_* citada nas regras de alerta existe no arquivo publicado
  for m in $(grep -ohE '\bguard_[a-z_]+' "$REPO_ROOT/monitoring/prometheus/rules/db-guards.yml" | sort -u); do
    grep -q "^$m[ {]" "$prom" || { echo "regra usa $m, exporter não emite"; return 1; }
  done
}
