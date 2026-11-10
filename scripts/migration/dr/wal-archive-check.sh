#!/usr/bin/env bash
# ============================================================================
# wal-archive-check.sh — WAL Archive Health: alerta se o archiving parou ou
# está falhando (o que encolhe a janela de PITR). Somente leitura.
#
# Uso: SRC_DB_URL=... ARCHIVE_MAX_LAG_SEC=300 ./dr/wal-archive-check.sh
# Ambiente (scripts/migration/.env; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL)  banco vigiado — obrigatória
#   ARCHIVE_MAX_LAG_SEC  idade máxima do último WAL arquivado (padrão 300)
#   FAILED_DELTA_MAX     falhas novas toleradas entre execuções (padrão 0)
#   WAL_ARCHIVE_STATE_DIR  pasta do estado entre execuções
#                          (padrão ~/.local/state/singu-migration, modo 700)
#
# O estado (failed_count anterior) fica em arquivo PRIVADO, um por banco, e é
# validado como número antes de usar — nada em /tmp previsível.
# Exit: 0 saudável · 1 alerta (archiving desligado/atrasado/falhando)
#       · 2 uso/config ou banco inacessível (NÃO é "archiving ok").
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="wal-archive"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
[[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "SRC_DB_URL obrigatório"
ARCHIVE_MAX_LAG_SEC="${ARCHIVE_MAX_LAG_SEC:-300}"
FAILED_DELTA_MAX="${FAILED_DELTA_MAX:-0}"
mig_is_uint "$ARCHIVE_MAX_LAG_SEC" || mig_die 2 "ARCHIVE_MAX_LAG_SEC inválido: $ARCHIVE_MAX_LAG_SEC"
mig_is_uint "$FAILED_DELTA_MAX"    || mig_die 2 "FAILED_DELTA_MAX inválido: $FAILED_DELTA_MAX"
mig_need psql cksum

TARGET="$(mig_target "$SRC_DB_URL")"
row="$(mig_psql "$SRC_DB_URL" -XAtq -F ' ' -v ON_ERROR_STOP=1 -c "
  SELECT archived_count, failed_count,
         COALESCE(EXTRACT(EPOCH FROM last_archived_time)::bigint, 0),
         COALESCE(EXTRACT(EPOCH FROM last_failed_time)::bigint, 0),
         EXTRACT(EPOCH FROM now())::bigint,
         current_setting('archive_mode')
  FROM pg_stat_archiver" 2>/dev/null)" || mig_die 2 "banco inacessível ($TARGET) — saúde do archiving DESCONHECIDA"
read -r archived failed last_archived_epoch last_failed_epoch now archive_mode <<<"$row"
for v in archived failed last_archived_epoch last_failed_epoch now; do
  mig_is_uint "${!v}" || mig_die 2 "resposta inesperada de pg_stat_archiver"
done

lag=$(( now - last_archived_epoch ))   # relógio do servidor, não o local
status=0
if [[ "$archive_mode" == "off" ]]; then
  mig_log "🚨 archive_mode=off — archiving desabilitado (sem PITR)"; status=1
elif (( last_archived_epoch == 0 )); then
  mig_log "archived=$archived failed=$failed"
  mig_log "🚨 last_archived_time é NULL — archiving nunca rodou ou está desabilitado"; status=1
else
  mig_log "archived=$archived failed=$failed last_archived_lag=${lag}s"
  if (( lag > ARCHIVE_MAX_LAG_SEC )); then
    mig_log "🚨 archive lag=${lag}s > ${ARCHIVE_MAX_LAG_SEC}s"; status=1
  else
    mig_log "✔ archive lag OK"
  fi
  if (( last_failed_epoch > last_archived_epoch )); then
    mig_log "🚨 a última tentativa de arquivar FALHOU (falha mais recente que o último sucesso)"; status=1
  fi
fi

# Estado privado por banco (nome derivado do alvo, sem credenciais).
STATE_DIR="${WAL_ARCHIVE_STATE_DIR:-${XDG_STATE_HOME:-${HOME:-/var/tmp}/.local/state}/singu-migration}"
( umask 077; mkdir -p "$STATE_DIR" ) || mig_die 2 "não consigo criar $STATE_DIR"
STATE_FILE="$STATE_DIR/wal-archive-$(printf '%s' "$TARGET" | cksum | cut -d ' ' -f 1).state"
[[ ! -L "$STATE_FILE" ]] || mig_die 2 "$STATE_FILE é um link simbólico — recusando usar"

if [[ -f "$STATE_FILE" ]]; then
  prev_failed="$(head -n 1 "$STATE_FILE" 2>/dev/null || true)"
  if ! mig_is_uint "$prev_failed"; then
    mig_log "⚠ estado anterior inválido — ignorado (novo snapshot)"
  elif (( failed < prev_failed )); then
    mig_log "ℹ contadores zerados no servidor (reset de estatísticas) — novo snapshot"
  else
    delta=$(( failed - prev_failed ))
    if (( delta > FAILED_DELTA_MAX )); then
      mig_log "🚨 failed_count aumentou em ${delta} desde última execução"; status=1
    else
      mig_log "✔ failed_count estável (Δ=${delta})"
    fi
  fi
else
  mig_log "ℹ primeira execução — snapshot inicial"
fi
( umask 077; printf '%s\n' "$failed" > "$STATE_FILE.tmp.$$" ) && mv -f "$STATE_FILE.tmp.$$" "$STATE_FILE"

exit "$status"
