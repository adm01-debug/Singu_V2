#!/usr/bin/env bash
# full-audit.sh — Orquestrador da bateria de guards/audits SQL no destino.
#
# Uso:
#   DEST_DB_URL=... ./full-audit.sh          roda FATAL + WARN contra o destino
#   ./full-audit.sh --listar                 imprime "<classe> <arquivo>" de cada lista
#   ./full-audit.sh --verificar-lista        confere que TODO *.sql do diretório está em
#                                            exatamente uma lista (FATAL, WARN ou FORA)
#   ./full-audit.sh --help
#
# Variáveis de ambiente:
#   DEST_DB_URL              (obrigatória) URL de conexão do destino; também lida de ../.env
#                            (o que já estiver no ambiente vence o arquivo)
#   PGCONNECT_TIMEOUT        default 10 (segundos)
#   GUARD_STATEMENT_TIMEOUT  opcional (ex.: 60s) — statement_timeout aplicado a cada guard
#
# Classes:
#   FATAL  psql -v ON_ERROR_STOP=1; saída != 0 imprime "=== FAIL: <arquivo> ===" e derruba o audit.
#   WARN   idem, mas saída != 0 vira "=== WARN-FAIL: <arquivo> ===" e NÃO derruba o audit
#          (o exporter trata WARN-FAIL e linhas "WARNING:" como estado 1).
#   FORA   arquivos que não entram na bateria (motivo ao lado de cada um).
#
# Códigos de saída: 0 = sem FATAL; 1 = algum FATAL falhou; 2 = erro de uso/config ou lista
# inconsistente (--verificar-lista); 3 = não conectou no destino (nenhum guard foi rodado).
# Só leitura: nenhum arquivo das listas FATAL/WARN altera o banco.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# Variável já definida no ambiente vence o ../.env (dá para apontar para outro banco, ou
# testar, sem editar o arquivo).
_SRC_AMBIENTE="${SRC_DB_URL:-}"; _DEST_AMBIENTE="${DEST_DB_URL:-}"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"
[[ -n "$_SRC_AMBIENTE" ]]  && SRC_DB_URL="$_SRC_AMBIENTE"
[[ -n "$_DEST_AMBIENTE" ]] && DEST_DB_URL="$_DEST_AMBIENTE"

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
  cron-timezone-audit.sql
  mv-refresh-audit.sql
  toast-storage-audit.sql
  replication-lag-guard.sql
  sequences-gap-check.sql
  rls-coverage.sql
)
# Fora da bateria (não são chamados aqui de propósito):
FORA=(
  extensions-parity.sql          # snapshot para diff manual origem x destino
  extensions-versions.sql        # consumido por extensions-versions.sh
  grants-parity.sql              # consumido por grants-parity.sh
  triggers-parity.sql            # consumido por triggers-parity.sh
  tz-locale-parity.sql           # consumido por tz-locale-parity.sh
  query-plan-regression.sql      # baseline para diff pré x pós; sem veredito
  sequences-audit.sql            # gerador de SQL de correção
  logical-publication-guard.sql  # exige -v pub=<publicação>; roda na ORIGEM
  schema-freeze-guard.sql        # grava snapshot; só na janela de freeze
  fk-integrity.sql               # varre todas as FKs; pesado — rodar após o import
)

# Confere FATAL/WARN/FORA contra os *.sql do diretório. Imprime um problema por linha.
verificar_lista() {
  local f n problemas=0
  local -A visto=()
  for f in "${FATAL[@]}" "${WARN[@]}" "${FORA[@]}"; do
    visto[$f]=$(( ${visto[$f]:-0} + 1 ))
    [[ -f "$SCRIPT_DIR/$f" ]] || { echo "LISTADO-INEXISTENTE $f"; problemas=$((problemas + 1)); }
  done
  for f in "${!visto[@]}"; do
    n=${visto[$f]}
    [[ $n -eq 1 ]] || { echo "LISTADO-$n-VEZES $f"; problemas=$((problemas + 1)); }
  done
  for f in "$SCRIPT_DIR"/*.sql; do
    f="$(basename "$f")"
    [[ -n "${visto[$f]:-}" ]] || { echo "NAO-LISTADO $f"; problemas=$((problemas + 1)); }
  done
  return $(( problemas > 0 ))
}

case "${1:-}" in
  "") ;;
  -h|--help) sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
  --listar)
    printf 'FATAL %s\n' "${FATAL[@]}"; printf 'WARN %s\n' "${WARN[@]}"; printf 'FORA %s\n' "${FORA[@]}"; exit 0 ;;
  --verificar-lista)
    if verificar_lista; then
      echo "OK listas cobrem todos os *.sql (${#FATAL[@]} FATAL, ${#WARN[@]} WARN, ${#FORA[@]} FORA)."; exit 0
    fi
    echo "ERRO: listas do full-audit.sh fora de sincronia com o diretório." >&2; exit 2 ;;
  *) echo "ERRO: argumento desconhecido: $1 (veja --help)" >&2; exit 2 ;;
esac

if [[ -z "${DEST_DB_URL:-}" ]]; then
  echo "ERRO: DEST_DB_URL obrigatorio (veja --help)" >&2; exit 2
fi
command -v psql >/dev/null || { echo "ERRO: psql nao encontrado no PATH" >&2; exit 2; }

export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"
export PGAPPNAME="${PGAPPNAME:-full-audit}"
if [[ -n "${GUARD_STATEMENT_TIMEOUT:-}" ]]; then
  export PGOPTIONS="${PGOPTIONS:-} -c statement_timeout=${GUARD_STATEMENT_TIMEOUT}"
fi

# Sem conexão não adianta rodar 60+ arquivos: cada um "falharia" e geraria alarme falso.
if ! psql "$DEST_DB_URL" -X -Atqc "SELECT 1" >/dev/null; then
  log "ERRO DE CONEXAO: destino inacessivel — nenhum guard executado"
  exit 3
fi

if ! FORA_DE_SINCRONIA="$(verificar_lista)"; then
  echo "WARNING: listas do full-audit.sh fora de sincronia: ${FORA_DE_SINCRONIA//$'\n'/; }"
fi

FAILED=0
for f in "${FATAL[@]}"; do
  log "FATAL: $f"
  if ! psql "$DEST_DB_URL" -X -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/$f"; then
    log "FAIL: $f"; FAILED=$((FAILED+1))
  fi
done

WARNED=0
for f in "${WARN[@]}"; do
  log "WARN: $f"
  if ! psql "$DEST_DB_URL" -X -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/$f"; then
    log "WARN-FAIL: $f"; WARNED=$((WARNED+1))
  fi
done

if [[ "$FAILED" -gt 0 ]]; then
  log "AUDIT FAILED: $FAILED check(s) fatal(is), $WARNED warn(s) com saida != 0"
  exit 1
fi
log "OK Audit completo (SQL): 0 fatal, $WARNED warn(s) com saida != 0. Rode pitr-window-verifier.sh, connection-pool-exhaustion-canary.sh e timeline-divergence-guard.sh separadamente."
