#!/usr/bin/env bash
# full-audit.sh — Orquestrador da bateria 16/10 no destino.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${DEST_DB_URL:?DEST_DB_URL obrigatorio}"

log() { printf '\n[full-audit %s] === %s ===\n' "$(date -u +%H:%M:%S)" "$*"; }

FATAL=(
  invalid-indexes-guard.sql
  tables-without-pk.sql
  not-valid-constraints.sql
  security-definer-audit.sql
  replication-slots-guard.sql
  long-running-tx-guard.sql
  prepared-xacts-guard.sql
  function-volatility-audit.sql
  idle-in-transaction-guard.sql
  function-search-path-reset-audit.sql
  multixact-wraparound-guard.sql
  datfrozenxid-age-guard.sql
  access-exclusive-locks-guard.sql
  wal-level-logical-guard.sql
  sequence-overflow-guard.sql
  index-corruption-amcheck.sql
  archive-command-health.sql
  dead-tuple-ratio-guard.sql
  checksum-failures-guard.sql
  relfrozenxid-table-guard.sql
  replication-slot-idle-guard.sql
  ssl-enforcement-audit.sql
  heap-corruption-scan.sql
  orphaned-large-objects.sql
  collation-version-mismatch.sql
  logical-replica-identity.sql
)
WARN=(
  autovacuum-audit.sql
  bloat-monitor.sql
  fdw-credentials-audit.sql
  pg-stat-statements-config.sql
  log-retention-audit.sql
  unused-indexes.sql
  duplicate-indexes.sql
  rls-force-audit.sql
  statement-timeout-audit.sql
  publication-tables-coverage.sql
  role-membership-parity.sql
  jit-checkpoint-audit.sql
  toast-compression-audit.sql
  public-role-privileges-audit.sql
  logical-vs-physical-drift.sql
  cron-job-failover-guard.sql
  autovacuum-worker-saturation.sql
  hot-standby-feedback-audit.sql
  extension-minor-version-parity.sql
  deadlock-frequency-monitor.sql
  temp-file-usage-audit.sql
  bgwriter-efficiency-audit.sql
  fillfactor-hot-audit.sql
  subscription-lag-guard.sql
  cache-hit-ratio-audit.sql
  lock-wait-duration-guard.sql
  superuser-count-audit.sql
  pg-hba-permissive-audit.sql
  seq-scan-large-tables-audit.sql
  pg-stat-statements-reset-guard.sql
  synchronous-commit-drift-audit.sql
  wal-sender-timeout-guard.sql
  extension-upgrade-available-audit.sql
  pitr-retention-window.sql
  password-encryption-audit.sql
  autovacuum-throttle-audit.sql
  plan-cache-bloat.sql
)

FAILED=0
for f in "${FATAL[@]}"; do
  log "FATAL: $f"
  if ! psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/$f"; then
    log "FAIL: $f"; FAILED=$((FAILED+1))
  fi
done

for f in "${WARN[@]}"; do
  log "WARN: $f"
  psql "$DEST_DB_URL" -f "$SCRIPT_DIR/$f" || true
done

if [[ "$FAILED" -gt 0 ]]; then
  log "AUDIT FAILED: $FAILED check(s) fatal(is)"
  exit 1
fi
log "OK Audit 22/10 completo (SQL). Rode pitr-window-verifier.sh, connection-pool-exhaustion-canary.sh e timeline-divergence-guard.sh separadamente."