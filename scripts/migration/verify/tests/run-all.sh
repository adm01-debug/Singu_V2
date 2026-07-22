#!/usr/bin/env bash
# run-all.sh — orquestra a suíte de cenários e agrega o resultado.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIOS_DIR="$SCRIPT_DIR/scenarios"
OUT_DIR="$SCRIPT_DIR/out"
mkdir -p "$OUT_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_MD="$OUT_DIR/report-$STAMP.md"
REPORT_JSON="$OUT_DIR/report-$STAMP.json"

ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) ONLY="$2"; shift 2 ;;
    *) echo "arg desconhecido: $1"; exit 2 ;;
  esac
done

command -v docker >/dev/null || { echo "✖ docker requerido"; exit 2; }
command -v psql   >/dev/null || { echo "✖ psql requerido"; exit 2; }

: "${PG_IMAGE:=postgres:15-alpine}"
CID=""

cleanup() { [[ -n "$CID" ]] && docker rm -f "$CID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "▶ subindo sandbox ($PG_IMAGE)"
CID=$(docker run -d --rm -e POSTGRES_PASSWORD=guard -p 54329:5432 \
  "$PG_IMAGE" -c wal_level=logical -c shared_preload_libraries=pg_stat_statements)

export PGHOST=127.0.0.1 PGPORT=54329 PGUSER=postgres PGPASSWORD=guard PGDATABASE=postgres
for i in $(seq 1 30); do
  psql -Atqc "SELECT 1" >/dev/null 2>&1 && break
  sleep 1
done

PASS=0; FAIL=0
declare -a ROWS=()

run_one() {
  local f="$1" name status expected observed
  name="$(basename "$f" .sh)"
  # shellcheck disable=SC1090
  source "$f"
  expected="${EXPECTED_EXIT:-0}"
  setup || true
  set +e; run_guard >"$OUT_DIR/$name.log" 2>&1; observed=$?; set -e
  cleanup_scenario || true
  unset -f setup run_guard cleanup_scenario 2>/dev/null || true

  if [[ "$expected" == "nonzero" ]]; then
    [[ "$observed" -ne 0 ]] && status="PASS" || status="FAIL"
  else
    [[ "$observed" -eq "$expected" ]] && status="PASS" || status="FAIL"
  fi
  [[ "$status" == PASS ]] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
  printf '| %-4s | %-45s | %-8s | %-8s | %s |\n' \
    "$status" "$name" "$expected" "$observed" "out/$name.log" >> "$REPORT_MD"
  ROWS+=("{\"scenario\":\"$name\",\"expected\":\"$expected\",\"observed\":$observed,\"status\":\"$status\"}")
}

{
  echo "# Guard Validation Report — $STAMP"
  echo
  echo "| stat | scenario                                      | expected | observed | log |"
  echo "| ---- | --------------------------------------------- | -------- | -------- | --- |"
} > "$REPORT_MD"

shopt -s nullglob
for f in "$SCENARIOS_DIR"/*.sh; do
  base="$(basename "$f" .sh)"
  num="${base%%-*}"
  if [[ -n "$ONLY" && ",$ONLY," != *",$num,"* ]]; then continue; fi
  echo "▶ $base"
  run_one "$f"
done

{
  echo
  echo "**Total:** $((PASS+FAIL)) — ✅ $PASS PASS · ❌ $FAIL FAIL"
} >> "$REPORT_MD"

printf '{"stamp":"%s","pass":%d,"fail":%d,"scenarios":[%s]}\n' \
  "$STAMP" "$PASS" "$FAIL" "$(IFS=,; echo "${ROWS[*]}")" > "$REPORT_JSON"

echo
echo "═════════════════════════════════════════════"
echo " ✅ $PASS · ❌ $FAIL — relatório: $REPORT_MD"
echo "═════════════════════════════════════════════"
[[ "$FAIL" -eq 0 ]]