#!/usr/bin/env bash
EXPECTED_EXIT=0
setup(){
  export TEXTFILE_DIR="$(mktemp -d)"
  export AUDIT_LOG_FILE="$TEXTFILE_DIR/audit.log"
}
run_guard(){
  cat >"$TEXTFILE_DIR/fake-audit.sh" <<'EOF'
#!/usr/bin/env bash
echo "[full-audit 12:00:00] === FATAL: tables-without-pk.sql ==="
echo "OK sem tabelas sem PK."
echo "[full-audit 12:00:01] === WARN: bloat-monitor.sql ==="
echo "WARNING: bloat >30%"
exit 0
EOF
  chmod +x "$TEXTFILE_DIR/fake-audit.sh"
  EXP="$SCRIPT_DIR/../../exporter/full-audit-exporter.sh"
  sed "s|\$SCRIPT_DIR/../full-audit.sh|$TEXTFILE_DIR/fake-audit.sh|" "$EXP" >"$TEXTFILE_DIR/exp.sh"
  chmod +x "$TEXTFILE_DIR/exp.sh"
  bash "$TEXTFILE_DIR/exp.sh" || return 1
  grep -q 'guard_status{name="tables-without-pk"' "$TEXTFILE_DIR/db_guards.prom" || return 1
  grep -q 'guard_status{name="bloat-monitor",severity="warn"} 1' "$TEXTFILE_DIR/db_guards.prom" || return 1
  grep -q 'guard_exporter_up 1' "$TEXTFILE_DIR/db_guards.prom" || return 1
}
cleanup_scenario(){ rm -rf "$TEXTFILE_DIR"; }