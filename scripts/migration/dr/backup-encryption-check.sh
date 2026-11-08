#!/usr/bin/env bash
# Backup Encryption Verifier — confirma que o backup mais recente é decriptável.
# Dry-run: gpg decrypt (se aplicável) + pg_restore --list. Não escreve dados restaurados.
# Uso: BACKUP_FILE=/path/to/backup.dump [BACKUP_PASSPHRASE=...] ./dr/backup-encryption-check.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${BACKUP_FILE:?BACKUP_FILE obrigatório}"
log() { printf '[backup-enc %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

[[ -f "$BACKUP_FILE" ]] || { log "✖ backup não encontrado: $BACKUP_FILE"; exit 2; }
SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")
log "arquivo=$BACKUP_FILE bytes=$SIZE"
(( SIZE > 1024 )) || { log "✖ arquivo suspeito (<1KB)"; exit 1; }

HEADER=$(head -c 8 "$BACKUP_FILE" | od -An -tx1 | tr -d ' \n')
log "magic=$HEADER"

TMPFILE=""
cleanup() { if [[ -n "$TMPFILE" && -f "$TMPFILE" ]]; then rm -f "$TMPFILE"; fi; }
trap cleanup EXIT
INPUT="$BACKUP_FILE"

if head -c 16 "$BACKUP_FILE" | grep -q "BEGIN PGP" || [[ "${HEADER:0:2}" == "85" ]]; then
  log "detectado GPG-encrypted — testando decrypt"
  command -v gpg >/dev/null || { log "✖ gpg não disponível"; exit 2; }
  TMPFILE=$(mktemp)
  if [[ -n "${BACKUP_PASSPHRASE:-}" ]]; then
    printf '%s' "$BACKUP_PASSPHRASE" \
      | gpg --batch --yes --passphrase-fd 0 --decrypt --output "$TMPFILE" "$BACKUP_FILE" 2>/dev/null \
      || { log "🚨 decrypt falhou — passphrase/KMS inválida"; exit 1; }
  else
    gpg --batch --yes --decrypt --output "$TMPFILE" "$BACKUP_FILE" 2>/dev/null \
      || { log "🚨 decrypt falhou — chave GPG ausente"; exit 1; }
  fi
  INPUT="$TMPFILE"
  log "✔ decrypt OK"
fi

command -v pg_restore >/dev/null || { log "✖ pg_restore não disponível"; exit 2; }
ENTRIES=$(pg_restore --list "$INPUT" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$ENTRIES" -lt 10 ]]; then
  log "🚨 pg_restore --list retornou $ENTRIES entradas — backup corrompido"
  exit 1
fi
log "✔ pg_restore --list OK ($ENTRIES entradas) — backup íntegro e decriptável"