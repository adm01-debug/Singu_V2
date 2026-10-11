#!/usr/bin/env bash
# Backup Restore Drill — restaura o backup mais recente em instância efêmera,
# roda smoke queries, compara row counts com produção e destrói a instância.
# Uso: DRILL_DB_URL=... PROD_DB_URL=... BACKUP_FILE=... ./dr/restore-drill.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${PROD_DB_URL:?PROD_DB_URL obrigatório (produção read-only)}"
: "${DRILL_DB_URL:?DRILL_DB_URL obrigatório (instância efêmera de restore)}"
: "${BACKUP_FILE:?BACKUP_FILE obrigatório (arquivo local do backup mais recente)}"
: "${CRITICAL_TABLES:=contacts,deals,interactions,companies,whatsapp_messages,user_roles,profiles}"
: "${DRIFT_MAX_PCT:=0.01}"

OUT_DIR="$SCRIPT_DIR/out"
mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/restore-drill-$(date -u +%Y%m%dT%H%M%SZ).md"

log() { printf '[restore-drill %s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$REPORT"; }

cleanup() {
  log "🧹 limpando artefatos temporários"
  [[ -n "${RESTORE_LOG:-}" && -f "$RESTORE_LOG" ]] && rm -f "$RESTORE_LOG" || true
  [[ -n "${TMP_DUMP:-}" && -f "$TMP_DUMP" ]] && rm -f "$TMP_DUMP" || true
}
trap cleanup EXIT

log "# Backup Restore Drill — $(date -u +%FT%TZ)"
log "backup=$BACKUP_FILE prod=$(echo "$PROD_DB_URL" | sed 's|://[^@]*@|://***@|') drill=$(echo "$DRILL_DB_URL" | sed 's|://[^@]*@|://***@|')"

# ── Fase 1: preflight ────────────────────────────────────────────────────
log "## Fase 1 — preflight"
for bin in psql pg_restore pg_dump; do
  command -v "$bin" >/dev/null || { log "✖ falta $bin no PATH"; exit 2; }
done
[[ -f "$BACKUP_FILE" ]] || { log "✖ backup não encontrado: $BACKUP_FILE"; exit 2; }
psql "$DRILL_DB_URL" -Atqc "SELECT 1" >/dev/null || { log "✖ DRILL_DB_URL inacessível"; exit 2; }
psql "$PROD_DB_URL"  -Atqc "SELECT 1" >/dev/null || { log "✖ PROD_DB_URL inacessível"; exit 2; }
prod_cluster=$(psql "$PROD_DB_URL" -Atqc 'SELECT system_identifier FROM pg_control_system()')
drill_cluster=$(psql "$DRILL_DB_URL" -Atqc 'SELECT system_identifier FROM pg_control_system()')
[[ -n "$prod_cluster" && -n "$drill_cluster" && "$prod_cluster" != "$drill_cluster" ]] || {
  log "✖ origem e destino precisam ser instâncias PostgreSQL distintas"; exit 2; }
log "✔ binários e conectividade OK"

# ── Fase 2: restore no drill ─────────────────────────────────────────────
log "## Fase 2 — restore"
START_TS=$(date +%s)
RESTORE_LOG=$(mktemp "$OUT_DIR/.pg-restore-XXXXXX")
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname "$DRILL_DB_URL" "$BACKUP_FILE" >"$RESTORE_LOG" 2>&1 || {
    log "✖ pg_restore falhou"; exit 1; }
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
IFS=',' read -ra TBLS <<<"$CRITICAL_TABLES"
drift=0
for t in "${TBLS[@]}"; do
  [[ "$t" =~ ^[a-z_][a-z0-9_]*$ ]] || { log "✖ nome de tabela inválido"; exit 2; }
  p=$(psql "$PROD_DB_URL"  -Atqc "SELECT COUNT(*) FROM public.$t" 2>/dev/null || echo "-1")
  d=$(psql "$DRILL_DB_URL" -Atqc "SELECT COUNT(*) FROM public.$t" 2>/dev/null || echo "-1")
  if [[ "$p" == "-1" || "$d" == "-1" ]]; then
    log "✖ $t: falha ao contar (prod=$p drill=$d)"; drift=$((drift+1)); continue
  fi
  if [[ "$p" -eq 0 ]]; then
    [[ "$d" -eq 0 ]] && log "· $t: ambos zero" || { log "✖ $t: prod=0 drill=$d"; drift=$((drift+1)); }
    continue
  fi
  pct=$(awk -v a="$p" -v b="$d" 'BEGIN{ printf "%.4f", ((a>b?a-b:b-a)/a)*100 }')
  cmp=$(awk -v x="$pct" -v y="$DRIFT_MAX_PCT" 'BEGIN{ print (x>y)?"BAD":"OK" }')
  log "$([[ $cmp == OK ]] && echo ✔ || echo ✖) $t: prod=$p drill=$d drift=${pct}%"
  [[ "$cmp" == "BAD" ]] && drift=$((drift+1))
done

# ── Fase 5: teardown (deixa para o operador; instância efêmera) ─────────
log "## Fase 5 — teardown"
log "ℹ Instância efêmera deve ser destruída pelo orquestrador (Terraform/Nomad/K8s Job)."

if (( drift > 0 )); then
  log "🚨 $drift tabela(s) com drift > ${DRIFT_MAX_PCT}% — DRILL FALHOU"
  exit 1
fi
log "✔ Drill 100% íntegro — relatório em $REPORT"