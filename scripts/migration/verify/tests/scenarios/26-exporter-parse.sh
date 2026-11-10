#!/usr/bin/env bash
# Exporter: parse do log do full-audit (FATAL/FAIL/WARNING/WARN-FAIL) → textfile Prometheus.
EXPECTED_EXIT=0
setup(){
  export TEXTFILE_DIR="$SCN_TMP/textfile"
  export AUDIT_LOG_FILE="$SCN_TMP/audit.log"
  mkdir -p "$TEXTFILE_DIR"
}
run_guard(){
  cat >"$SCN_TMP/fake-audit.sh" <<'EOS'
#!/usr/bin/env bash
echo "[full-audit 12:00:00] === FATAL: tables-without-pk.sql ==="
echo "OK sem tabelas sem PK."
echo "[full-audit 12:00:01] === FATAL: invalid-indexes-guard.sql ==="
echo "psql:x.sql:1: ERROR:  INVALID INDEX: 1"
echo "[full-audit 12:00:01] === FAIL: invalid-indexes-guard.sql ==="
echo "[full-audit 12:00:02] === WARN: bloat-monitor.sql ==="
echo "WARNING: bloat >30%"
echo "[full-audit 12:00:03] === WARN: lock-wait-duration-guard.sql ==="
echo "[full-audit 12:00:03] === WARN-FAIL: lock-wait-duration-guard.sql ==="
echo "[full-audit 12:00:04] === WARN: jit-checkpoint-audit.sql ==="
exit 1
EOS
  AUDIT_SCRIPT="$SCN_TMP/fake-audit.sh" bash "$SCRIPT_DIR/../exporter/full-audit-exporter.sh" || return 1
  local prom="$TEXTFILE_DIR/db_guards.prom"
  contem "$prom" '^guard_status\{name="tables-without-pk",severity="fatal"\} 0$' || return 1
  contem "$prom" '^guard_status\{name="invalid-indexes-guard",severity="fatal"\} 2$' || return 1
  contem "$prom" '^guard_status\{name="bloat-monitor",severity="warn"\} 1$' || return 1
  contem "$prom" '^guard_status\{name="lock-wait-duration-guard",severity="warn"\} 1$' || return 1
  contem "$prom" '^guard_status\{name="jit-checkpoint-audit",severity="warn"\} 0$' || return 1
  contem "$prom" '^guard_audit_exit_code 1$' || return 1
  contem "$prom" '^guard_exporter_up 1$' || return 1
  contem "$prom" '^guard_last_run_timestamp_seconds [0-9]+$' || return 1
  # nada de temporário esquecido no diretório do textfile collector
  [[ -z "$(find "$TEXTFILE_DIR" -name '*.tmp')" ]] || { echo "sobrou .tmp"; return 1; }
}
cleanup_scenario(){ rm -rf "$TEXTFILE_DIR"; }
