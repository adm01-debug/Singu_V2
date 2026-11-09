#!/usr/bin/env bash
# Backup Encryption Verifier — confirma que o backup é decriptável e íntegro.
# Dry-run: decripta (se preciso) para um temporário privado + pg_restore --list.
# Não restaura nada e não imprime conteúdo do backup.
#
# Uso: BACKUP_FILE=/path/to/backup.dump [BACKUP_PASSPHRASE=...] ./dr/backup-encryption-check.sh
# Formatos: dump custom do pg_dump em claro; GPG (binário ou ASCII-armored,
#   simétrico ou por chave); age (AGE_IDENTITY_FILE=<chave>); openssl enc
#   ("Salted__"; BACKUP_OPENSSL_ARGS, padrão "-aes-256-cbc -pbkdf2").
# A senha nunca vai para a linha de comando (entra por descritor de arquivo).
# Além do índice (--list), lê o arquivo INTEIRO (pg_restore -f /dev/null) para
# pegar truncamento/corrupção na área de dados; BACKUP_DEEP_CHECK=0 desliga.
# Exit: 0 íntegro e decriptável · 1 decrypt falhou / backup corrompido ou vazio
#       · 2 uso: BACKUP_FILE ausente, arquivo inexistente ou ferramenta ausente.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

case "${1:-}" in
  -h|--help) sed -n '2,/^[^#]/{/^#/!d;s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; exit 0 ;;
esac

# Lê KEY=VALUE de scripts/migration/.env sem executar o arquivo; ambiente vence.
load_env() {
  local line key val
  [[ -f "$1" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    key="${BASH_REMATCH[2]}"; val="${BASH_REMATCH[3]}"
    if [[ "$val" =~ ^\"(.*)\"[[:space:]]*(#.*)?$ || "$val" =~ ^\'(.*)\'[[:space:]]*(#.*)?$ ]]; then val="${BASH_REMATCH[1]}"
    else val="${val%%[[:space:]]#*}"; val="${val%"${val##*[![:space:]]}"}"; fi
    [[ -n "${!key+x}" ]] || export "$key=$val"
  done < "$1"
}
load_env "$ROOT_DIR/.env"

: "${BACKUP_FILE:?BACKUP_FILE obrigatório}"
log() { printf '[backup-enc %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

[[ -f "$BACKUP_FILE" ]] || { log "✖ backup não encontrado: $BACKUP_FILE"; exit 2; }
SIZE=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
log "arquivo=$BACKUP_FILE bytes=$SIZE"
(( SIZE > 1024 )) || { log "✖ arquivo suspeito (<1KB)"; exit 1; }

HEADER=$(head -c 8 "$BACKUP_FILE" | od -An -tx1 | tr -d ' \n')
log "magic=$HEADER"

TMPDIR_PRIV=""
cleanup() { if [[ -n "$TMPDIR_PRIV" ]]; then rm -rf "$TMPDIR_PRIV"; fi; }
trap cleanup EXIT
trap 'exit 130' INT TERM
INPUT="$BACKUP_FILE"

# Detecção pelo conteúdo. OpenPGP binário: 1º byte = tag do pacote
# (84/85/86 chave pública, 8c/8d/8e simétrico, c1/c3 formato novo).
KIND="plain"
FIRST16="$(head -c 64 "$BACKUP_FILE" | tr -d '\0' | head -c 40 || true)"
case "${HEADER:0:2}" in 84|85|86|8c|8d|8e|c1|c3) KIND="gpg" ;; esac
[[ "$FIRST16" == *"BEGIN PGP"* ]] && KIND="gpg"
[[ "$FIRST16" == "age-encryption.org/v1"* ]] && KIND="age"
[[ "$FIRST16" == "-----BEGIN AGE ENCRYPTED FILE"* ]] && KIND="age"
[[ "$FIRST16" == "Salted__"* ]] && KIND="openssl"

if [[ "$KIND" != "plain" ]]; then
  umask 077
  TMPDIR_PRIV="$(mktemp -d)"
  INPUT="$TMPDIR_PRIV/backup.dump"
  ok=0
  case "$KIND" in
    gpg)
      log "detectado GPG-encrypted — testando decrypt"
      command -v gpg >/dev/null || { log "✖ gpg não disponível"; exit 2; }
      if [[ -n "${BACKUP_PASSPHRASE:-}" ]]; then
        printf '%s' "$BACKUP_PASSPHRASE" \
          | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --decrypt --output "$INPUT" "$BACKUP_FILE" 2>/dev/null \
          && ok=1
        (( ok )) || { log "🚨 decrypt falhou — passphrase/KMS inválida"; exit 1; }
      else
        gpg --batch --yes --decrypt --output "$INPUT" "$BACKUP_FILE" 2>/dev/null && ok=1
        (( ok )) || { log "🚨 decrypt falhou — chave GPG ausente"; exit 1; }
      fi ;;
    age)
      log "detectado age-encrypted — testando decrypt"
      command -v age >/dev/null || { log "✖ age não disponível"; exit 2; }
      [[ -n "${AGE_IDENTITY_FILE:-}" && -f "${AGE_IDENTITY_FILE:-}" ]] || { log "✖ defina AGE_IDENTITY_FILE (chave privada age)"; exit 2; }
      age --decrypt -i "$AGE_IDENTITY_FILE" -o "$INPUT" "$BACKUP_FILE" 2>/dev/null && ok=1
      (( ok )) || { log "🚨 decrypt falhou — identidade age não abre este backup"; exit 1; } ;;
    openssl)
      log "detectado openssl enc — testando decrypt"
      command -v openssl >/dev/null || { log "✖ openssl não disponível"; exit 2; }
      [[ -n "${BACKUP_PASSPHRASE:-}" ]] || { log "✖ defina BACKUP_PASSPHRASE"; exit 2; }
      read -ra OSSL_ARGS <<<"${BACKUP_OPENSSL_ARGS:--aes-256-cbc -pbkdf2}"
      openssl enc -d "${OSSL_ARGS[@]}" -pass fd:3 -in "$BACKUP_FILE" -out "$INPUT" 3<<<"$BACKUP_PASSPHRASE" 2>/dev/null && ok=1
      (( ok )) || { log "🚨 decrypt falhou — passphrase/cifra inválida"; exit 1; } ;;
  esac
  log "✔ decrypt OK"
fi

command -v pg_restore >/dev/null || { log "✖ pg_restore não disponível"; exit 2; }
if ! TOC="$(pg_restore --list "$INPUT" 2>/dev/null)"; then
  log "🚨 pg_restore --list falhou — não é um dump custom válido (corrompido, truncado ou cifrado em formato desconhecido)"
  exit 1
fi
# linhas iniciadas por ';' são cabeçalho/comentário; o resto são objetos do dump
ENTRIES=$(printf '%s\n' "$TOC" | grep -cv '^;' || true)
if [[ "$ENTRIES" -lt 1 ]]; then
  log "🚨 pg_restore --list retornou 0 objetos — backup vazio"
  exit 1
fi
if [[ "${BACKUP_DEEP_CHECK:-1}" != "0" ]]; then
  # converte o dump inteiro em SQL descartado: valida todos os blocos de dados sem tocar em banco
  if ! pg_restore -f /dev/null "$INPUT" 2>/dev/null; then
    log "🚨 leitura completa do dump falhou — arquivo truncado ou corrompido na área de dados"
    exit 1
  fi
fi
log "✔ pg_restore --list OK ($ENTRIES entradas) — backup íntegro e decriptável"
