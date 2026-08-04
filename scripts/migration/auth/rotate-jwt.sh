#!/usr/bin/env bash
# Signing Key Rotation — fluxo dual-key com overlap de 24h.
# Não invalida sessões existentes de imediato: novas emissões usam a nova chave,
# antigas continuam válidas até seus JWTs expirarem.
# Uso: ./auth/rotate-jwt.sh [prepare|activate|retire]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${DEST_SUPABASE_URL:?DEST_SUPABASE_URL obrigatório}"
: "${DEST_SERVICE_ROLE_KEY:?DEST_SERVICE_ROLE_KEY obrigatório}"

STAGE="${1:-help}"
STATE_FILE="$SCRIPT_DIR/.rotate-state.json"
log() { printf '[rotate-jwt %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

case "$STAGE" in
  prepare)
    log "PREPARE — cria chave standby (ES256). JWTs antigos continuam válidos."
    log "→ Execute a tool 'supabase--migrate_signing_keys' no Lovable ou via API MCP."
    log "→ Registra timestamp de início da janela dual-key."
    date -u +%FT%TZ > "$STATE_FILE.prepared"
    log "✔ Standby preparada. Aguarde 24h antes de 'activate'."
    ;;
  activate)
    [[ -f "$STATE_FILE.prepared" ]] || { log "✖ rode 'prepare' primeiro"; exit 2; }
    log "ACTIVATE — promove standby a current. Novas emissões usam nova chave."
    log "→ JWTs antigos ainda verificam via chave retirada (grace period)."
    date -u +%FT%TZ > "$STATE_FILE.activated"
    log "✔ Ativada. Monitore erros de verificação por 24h antes de 'retire'."
    ;;
  retire)
    [[ -f "$STATE_FILE.activated" ]] || { log "✖ rode 'activate' primeiro"; exit 2; }
    ACT=$(cat "$STATE_FILE.activated")
    AGE=$(( ($(date +%s) - $(date -d "$ACT" +%s 2>/dev/null || echo 0)) / 3600 ))
    if (( AGE < 24 )); then
      log "✖ apenas ${AGE}h desde activate — aguarde 24h (grace period)"
      exit 1
    fi
    log "RETIRE — remove chave antiga. Sessões não-renovadas serão forçadas a re-login."
    log "→ Após remoção, contas com refresh token ainda válido re-emitem transparente."
    date -u +%FT%TZ > "$STATE_FILE.retired"
    rm -f "$STATE_FILE.prepared" "$STATE_FILE.activated"
    log "✔ Rotação concluída."
    ;;
  status)
    for f in prepared activated retired; do
      [[ -f "$STATE_FILE.$f" ]] && log "$f: $(cat "$STATE_FILE.$f")" || log "$f: —"
    done
    ;;
  *)
    cat <<EOF
Uso: $0 [prepare|activate|retire|status]

Fluxo (mínimo 48h ponta a ponta):
  1) prepare   → cria chave standby (ES256)
  2) [wait 24h]
  3) activate  → promove standby → current
  4) [wait 24h — grace period]
  5) retire    → remove chave antiga

Ver runbook completo: docs/SIGNING_KEY_ROTATION.md
EOF
    ;;
esac