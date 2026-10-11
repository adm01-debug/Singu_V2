#!/usr/bin/env bash
# Backup Restore Drill — restaura o backup mais recente em instância efêmera,
# roda smoke queries e compara contagens com o snapshot do dump.
# Uso: DRILL_DB_URL=... PROD_DB_URL=... BACKUP_FILE=... SOURCE_COUNTS_FILE=... ./dr/restore-drill.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${PROD_DB_URL:?PROD_DB_URL obrigatório (produção read-only)}"
: "${DRILL_DB_URL:?DRILL_DB_URL obrigatório (instância efêmera de restore)}"
: "${BACKUP_FILE:?BACKUP_FILE obrigatório (arquivo local do backup mais recente)}"
: "${SOURCE_COUNTS_FILE:?SOURCE_COUNTS_FILE obrigatório (manifesto do snapshot)}"
: "${CRITICAL_TABLES:=contacts,deals,interactions,companies,whatsapp_messages,user_roles,profiles}"
: "${DRIFT_MAX_PCT:=0}"
umask 077

OUT_DIR="${DRILL_REPORT_DIR:-$SCRIPT_DIR/out}"
mkdir -p "$OUT_DIR"
REPORT=$(mktemp "$OUT_DIR/restore-drill-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
mv "$REPORT" "$REPORT.md"
REPORT="$REPORT.md"

log() { printf '[restore-drill %s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$REPORT"; }

cleanup() {
  log "🧹 limpando artefatos temporários"
  [[ -n "${RESTORE_LOG:-}" && -f "$RESTORE_LOG" ]] && rm -f "$RESTORE_LOG" || true
  [[ -n "${TMP_DUMP:-}" && -f "$TMP_DUMP" ]] && rm -f "$TMP_DUMP" || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM

log "# Backup Restore Drill — $(date -u +%FT%TZ)"
log "Conexões omitidas; origem e destino são validados antes da restauração."

# ── Fase 1: preflight ────────────────────────────────────────────────────
log "## Fase 1 — preflight"
for bin in psql pg_restore sha256sum awk; do
  command -v "$bin" >/dev/null || { log "✖ falta $bin no PATH"; exit 2; }
done
[[ -f "$BACKUP_FILE" ]] || { log "✖ backup não encontrado: $BACKUP_FILE"; exit 2; }
[[ -f "$SOURCE_COUNTS_FILE" ]] || { log "✖ manifesto não encontrado"; exit 2; }
[[ "$DRIFT_MAX_PCT" =~ ^[0-9]+([.][0-9]+)?$ ]] || { log "✖ limite de divergência inválido"; exit 2; }
declare -A COUNTS
expected_hash=''
snapshot=''
while IFS=$'\t' read -r key value extra; do
  [[ -z "$extra" ]] || { log "✖ manifesto inválido"; exit 2; }
  case "$key" in
    '#sha256')
      [[ -z "$expected_hash" && "$value" =~ ^[a-f0-9]{64}$ ]] || { log "✖ hash inválido"; exit 2; }
      expected_hash="$value" ;;
    '#snapshot')
      [[ -z "$snapshot" && "$value" =~ ^[A-Fa-f0-9]+-[A-Fa-f0-9]+-[0-9]+$ ]] || { log "✖ snapshot inválido"; exit 2; }
      snapshot="$value" ;;
    *)
      [[ "$key" =~ ^[a-z_][a-z0-9_]*$ && "$value" =~ ^(0|[1-9][0-9]*)$ ]] || { log "✖ contagem inválida"; exit 2; }
      [[ -z "${COUNTS[$key]+present}" ]] || { log "✖ tabela duplicada no manifesto"; exit 2; }
      COUNTS[$key]="$value" ;;
  esac
done < "$SOURCE_COUNTS_FILE"
actual_hash=$(sha256sum "$BACKUP_FILE")
[[ -n "$snapshot" && "${actual_hash%% *}" == "$expected_hash" ]] || { log "✖ manifesto não corresponde ao backup"; exit 2; }
IFS=',' read -ra TBLS <<<"$CRITICAL_TABLES"
for t in "${TBLS[@]}"; do
  [[ "$t" =~ ^[a-z_][a-z0-9_]*$ ]] || { log "✖ nome de tabela inválido"; exit 2; }
  [[ -n "${COUNTS[$t]+present}" ]] || { log "✖ tabela ausente no manifesto: $t"; exit 2; }
done
psql "$DRILL_DB_URL" -Atqc "SELECT 1" >/dev/null || { log "✖ DRILL_DB_URL inacessível"; exit 2; }
psql "$PROD_DB_URL"  -Atqc "SELECT 1" >/dev/null || { log "✖ PROD_DB_URL inacessível"; exit 2; }
prod_cluster=$(psql "$PROD_DB_URL" -Atqc 'SELECT system_identifier FROM pg_control_system()' 2>/dev/null) || {
  log "✖ origem exige EXECUTE em pg_catalog.pg_control_system(); consulte docs/dr-drills/README.md"; exit 2; }
drill_cluster=$(psql "$DRILL_DB_URL" -Atqc 'SELECT system_identifier FROM pg_control_system()' 2>/dev/null) || {
  log "✖ destino exige EXECUTE em pg_catalog.pg_control_system()"; exit 2; }
[[ -n "$prod_cluster" && -n "$drill_cluster" && "$prod_cluster" != "$drill_cluster" ]] || {
  log "✖ origem e destino precisam ser instâncias PostgreSQL distintas"; exit 2; }
log "✔ binários e conectividade OK"

# ── Fase 2: restore no drill ─────────────────────────────────────────────
log "## Fase 2 — restore"
START_TS=$(date +%s)
RESTORE_LOG=$(mktemp "$OUT_DIR/.pg-restore-XXXXXX")
LC_ALL=C pg_restore --verbose --no-owner --no-privileges --clean --if-exists \
  --dbname "$DRILL_DB_URL" "$BACKUP_FILE" >"$RESTORE_LOG" 2>&1 || {
    log "✖ pg_restore falhou"
    awk '
      /^pg_restore: creating [A-Z ]+ "[A-Za-z0-9_.]+"$/ { object=$0 }
      /^pg_restore: processing data for table "[A-Za-z0-9_.]+"$/ { object=$0 }
      /pg_restore: error:/ { errors++; if (object != "") { print object; object="" } }
      /permission denied|must be owner/ { permission++ }
      /extension.*not available/ { extension++ }
      /already exists/ { existing++ }
      /does not exist/ { missing++ }
      /violates .*constraint/ { constraint++ }
      /unrecognized configuration parameter/ { config++ }
      END {
        printf "Erros: %d; permissão: %d; extensão: %d; objeto existente: %d; objeto ausente: %d; constraint: %d; configuração: %d\n", errors, permission, extension, existing, missing, constraint, config
      }
    ' "$RESTORE_LOG" | tail -n 40 | tee -a "$REPORT"
    exit 1
  }
ELAPSED=$(( $(date +%s) - START_TS ))
log "✔ restore concluído em ${ELAPSED}s"

# ── Fase 3: smoke queries ────────────────────────────────────────────────
log "## Fase 3 — smoke queries"
psql "$DRILL_DB_URL" -Atqc "SELECT COUNT(*) FROM auth.users" >/dev/null || {
  log "✖ auth.users indisponível"; exit 1; }
psql "$DRILL_DB_URL" -Atqc "SELECT 1 FROM public.user_roles LIMIT 1" >/dev/null || {
  log "✖ public.user_roles indisponível"; exit 1; }
log "✔ smoke queries OK"

# ── Fase 4: row-count parity ─────────────────────────────────────────────
log "## Fase 4 — parity"
drift=0
for t in "${TBLS[@]}"; do
  p="${COUNTS[$t]}"
  d=$(psql "$DRILL_DB_URL" -Atqc "SELECT COUNT(*) FROM public.$t" 2>/dev/null || echo "-1")
  if [[ "$p" == "-1" || "$d" == "-1" ]]; then
    log "✖ $t: falha ao contar (snapshot=$p drill=$d)"; drift=$((drift+1)); continue
  fi
  if [[ "$p" -eq 0 ]]; then
    [[ "$d" -eq 0 ]] && log "· $t: ambos zero" || { log "✖ $t: snapshot=0 drill=$d"; drift=$((drift+1)); }
    continue
  fi
  pct=$(awk -v a="$p" -v b="$d" 'BEGIN{ printf "%.4f", ((a>b?a-b:b-a)/a)*100 }')
  if [[ "$p" == "$d" ]]; then
    cmp=OK
  else
    cmp=$(awk -v a="$p" -v b="$d" -v y="$DRIFT_MAX_PCT" 'BEGIN{ x=((a>b?a-b:b-a)/a)*100; print (y==0 || x>y)?"BAD":"OK" }')
  fi
  log "$([[ $cmp == OK ]] && echo ✔ || echo ✖) $t: snapshot=$p drill=$d drift=${pct}%"
  [[ "$cmp" == "BAD" ]] && drift=$((drift+1))
done

# ── Fase 5: teardown (deixa para o operador; instância efêmera) ─────────
log "## Fase 5 — teardown"
log "ℹ O workflow destrói a instância efêmera após esta validação."

if (( drift > 0 )); then
  log "🚨 $drift tabela(s) com drift > ${DRIFT_MAX_PCT}% — DRILL FALHOU"
  exit 1
fi
log "✔ Restore e paridade das tabelas críticas validados — relatório em $REPORT"