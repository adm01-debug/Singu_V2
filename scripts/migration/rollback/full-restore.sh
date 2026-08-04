#!/usr/bin/env bash
# full-restore.sh — Restauração completa a partir de snapshot pré-migração.
# Uso:
#   ./rollback/full-restore.sh --dry-run
#   ./rollback/full-restore.sh --confirm --i-know-what-im-doing
set -euo pipefail

DRY=1; CONFIRM_1=0; CONFIRM_2=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    --confirm) DRY=0; CONFIRM_1=1 ;;
    --i-know-what-im-doing) CONFIRM_2=1 ;;
    *) echo "Flag desconhecida: $arg"; exit 2 ;;
  esac
done

: "${SNAPSHOT_DIR:?SNAPSHOT_DIR obrigatório (dir com db.dump, storage/, secrets.env)}"
: "${DEST_DB_URL:?DEST_DB_URL obrigatório}"

DUMP="$SNAPSHOT_DIR/db.dump"
STORAGE_SNAP="$SNAPSHOT_DIR/storage"
SECRETS="$SNAPSHOT_DIR/secrets.env"

log(){ printf '[restore %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

log "Validando snapshot…"
[[ -f "$DUMP" ]] || { log "FALTA $DUMP"; exit 1; }
[[ -d "$STORAGE_SNAP" ]] || log "AVISO: storage snapshot ausente"
[[ -f "$SECRETS" ]] || log "AVISO: secrets snapshot ausente"

if (( DRY == 1 )); then
  log "DRY-RUN. Comandos que seriam executados:"
  echo "  pg_restore --clean --if-exists --no-owner --no-privileges -d \$DEST_DB_URL $DUMP"
  echo "  storage reverse-copy from $STORAGE_SNAP"
  echo "  SECRETS_ENV=$SECRETS ./functions/set-secrets.sh"
  exit 0
fi

if (( CONFIRM_1 == 0 || CONFIRM_2 == 0 )); then
  log "Requer --confirm E --i-know-what-im-doing."
  exit 2
fi

read -r -p "Digite 'RESTAURAR' para prosseguir: " ans
[[ "$ans" == "RESTAURAR" ]] || { log "Cancelado."; exit 1; }

log "Restaurando DB…"
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DEST_DB_URL" "$DUMP"

if [[ -d "$STORAGE_SNAP" ]]; then
  log "Restaure Storage manualmente via storage/copy-objects.ts SRC=$STORAGE_SNAP."
fi

if [[ -f "$SECRETS" ]]; then
  log "Reaplicando secrets…"
  SECRETS_ENV="$SECRETS" ./functions/set-secrets.sh
fi

log "Restauração concluída. Rode smoke-tests.ts em seguida."