#!/usr/bin/env bash
# ============================================================================
# full-restore.sh — restauração completa do DESTINO a partir do snapshot
# pré-migração. DESTRUTIVO: pg_restore --clean apaga e recria os objetos.
#
# Uso:
#   SNAPSHOT_DIR=/backups/pre-cutover ./rollback/full-restore.sh --dry-run
#   SNAPSHOT_DIR=/backups/pre-cutover ./rollback/full-restore.sh --confirm --i-know-what-im-doing
# Sem flags = dry-run. --dry-run SEMPRE vence, mesmo junto das confirmações.
# Além das duas flags, é preciso digitar RESTAURAR (ou enviar pelo stdin).
#
# Ambiente (scripts/migration/.env; ambiente vence):
#   SNAPSHOT_DIR  pasta com db.dump (obrigatório), storage/ e secrets.env (opcionais)
#   DEST_DB_URL (ou TARGET_DB_URL)  banco que será sobrescrito
#   DEST_REF (ou NEW_REF)  necessário só se houver secrets.env no snapshot
#   RESTORE_ATOMIC=1  restaura em transação única (--single-transaction
#                     --exit-on-error): ou entra tudo, ou nada muda
#
# Antes de tocar em qualquer coisa valida: dump legível (pg_restore --list),
# destino acessível e pré-requisitos dos secrets.
# Exit: 0 ok/dry-run · 1 restauração ou secrets falharam · 2 uso/config/
#       confirmação negada.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="restore"

DRY_FLAG=0; CONFIRM_1=0; CONFIRM_2=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_FLAG=1 ;;
    --confirm) CONFIRM_1=1 ;;
    --i-know-what-im-doing) CONFIRM_2=1 ;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "Flag desconhecida: $arg" ;;
  esac
done
DRY=1
if (( DRY_FLAG == 0 && CONFIRM_1 == 1 )); then DRY=0; fi

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${SNAPSHOT_DIR:-}" ]] || mig_die 2 "SNAPSHOT_DIR obrigatório (dir com db.dump, storage/, secrets.env)"
[[ -n "${DEST_DB_URL:-}" ]]  || mig_die 2 "DEST_DB_URL obrigatório"

DUMP="$SNAPSHOT_DIR/db.dump"
STORAGE_SNAP="$SNAPSHOT_DIR/storage"
SECRETS="$SNAPSHOT_DIR/secrets.env"
TARGET="$(mig_target "$DEST_DB_URL")"
REF="${DEST_REF:-${NEW_REF:-}}"
log() { mig_log "$@"; }

log "Validando snapshot…"
[[ -f "$DUMP" ]] || mig_die 1 "FALTA $DUMP"
[[ -d "$STORAGE_SNAP" ]] || log "AVISO: storage snapshot ausente"
[[ -f "$SECRETS" ]] || log "AVISO: secrets snapshot ausente"
mig_need pg_restore psql
entries="$(pg_restore --list "$DUMP" 2>/dev/null | grep -cv '^;' || true)"
[[ "${entries:-0}" -ge 1 ]] || mig_die 1 "$DUMP não é um dump custom válido (ou está vazio) — nada foi alterado"
log "dump ok ($entries objetos) · alvo: $TARGET"

RESTORE_ARGS=(--clean --if-exists --no-owner --no-privileges)
if [[ "${RESTORE_ATOMIC:-0}" == "1" ]]; then RESTORE_ARGS+=(--single-transaction --exit-on-error); fi

if (( DRY == 1 )); then
  log "DRY-RUN. Comandos que seriam executados:"
  echo "  pg_restore ${RESTORE_ARGS[*]} -d \$DEST_DB_URL $DUMP"
  echo "  storage reverse-copy from $STORAGE_SNAP"
  echo "  ./functions/set-secrets.sh --env-file $SECRETS --project-ref ${REF:-<DEST_REF>}"
  exit 0
fi

if (( CONFIRM_1 == 0 || CONFIRM_2 == 0 )); then
  mig_die 2 "Requer --confirm E --i-know-what-im-doing."
fi
mig_psql "$DEST_DB_URL" -XAtqc "SELECT 1" >/dev/null 2>&1 || mig_die 2 "destino inacessível ($TARGET) — nada foi alterado"
if [[ -f "$SECRETS" ]]; then
  [[ -n "$REF" ]] || mig_die 2 "há secrets.env no snapshot: defina DEST_REF (ou NEW_REF) — nada foi alterado"
  mig_need supabase
fi

read -r -p "Digite 'RESTAURAR' para prosseguir (alvo: $TARGET): " ans || ans=""
[[ "$ans" == "RESTAURAR" ]] || mig_die 2 "Cancelado — nada foi alterado."

log "Restaurando DB…"
if ! mig_pg pg_restore "$DEST_DB_URL" "${RESTORE_ARGS[@]}" "$DUMP"; then
  if [[ "${RESTORE_ATOMIC:-0}" == "1" ]]; then
    mig_die 1 "pg_restore falhou — transação desfeita, destino inalterado"
  fi
  mig_die 1 "pg_restore terminou com erros — destino pode estar PARCIALMENTE restaurado; revise a saída acima"
fi

if [[ -d "$STORAGE_SNAP" ]]; then
  log "Restaure Storage manualmente via storage/copy-objects.ts SRC=$STORAGE_SNAP."
fi

if [[ -f "$SECRETS" ]]; then
  log "Reaplicando secrets…"
  bash "$ROOT_DIR/functions/set-secrets.sh" --env-file "$SECRETS" --project-ref "$REF" --yes \
    || mig_die 1 "DB restaurado, mas a reaplicação dos secrets falhou — rode functions/set-secrets.sh --env-file $SECRETS"
fi

log "Restauração concluída. Rode smoke-tests.ts em seguida."
