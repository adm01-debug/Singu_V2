#!/usr/bin/env bash
# ============================================================================
# rotate-jwt.sh — guia e TRAVA de segurança da rotação de chave de assinatura
# JWT (fluxo dual-key com overlap de 24h). Ver docs/SIGNING_KEY_ROTATION.md.
#
# O script NÃO cria/promove/remove chaves: essas três ações são feitas no
# painel do Supabase (Auth → JWT Signing Keys) ou pela ferramenta de migração.
# O papel dele é impedir a ordem errada: confere o JWKS público do projeto e os
# prazos antes de liberar cada etapa, e registra os carimbos de tempo.
#
# Uso: ./auth/rotate-jwt.sh [prepare|activate|retire|status|help]
#   prepare   registra o início e as chaves atuais do JWKS; em seguida crie a
#             chave standby no painel
#   activate  só libera se a standby JÁ aparece no JWKS e passaram >= 24h do
#             prepare; em seguida promova a standby no painel
#   retire    só libera >= 24h após o activate e se o JWKS ainda publica ao
#             menos uma chave; em seguida revogue a chave antiga no painel
#   status    mostra os carimbos (não acessa a rede)
#
# Ambiente (scripts/migration/.env; ambiente vence):
#   DEST_SUPABASE_URL          URL do projeto (para ler o JWKS) — obrigatória
#   DEST_ANON_KEY              opcional; enviada como apikey por arquivo 600
#   ROTATE_MIN_WAIT_HOURS      espera mínima entre etapas (padrão 24)
#   ROTATE_STATE_DIR           onde ficam os .rotate-state.json.* (padrão auth/)
#   ROTATE_SKIP_JWKS=1         pula a conferência do JWKS (emergência; avisa)
#
# Falha segura: estado ilegível/corrompido, JWKS inacessível ou prazo não
# cumprido ABORTAM sem registrar nada — nunca "segue em frente" por engano.
# Rodar de novo a mesma etapa já registrada não altera o carimbo original.
# Exit: 0 ok · 1 trava de segurança (prazo, JWKS, estado corrompido) · 2 uso/config.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="rotate-jwt"
log() { mig_log "$@"; }

STAGE="${1:-help}"
usage() {
  cat <<EOF
Uso: $0 [prepare|activate|retire|status]

Fluxo (mínimo 48h ponta a ponta):
  1) prepare   → registra o início; crie a chave standby (ES256) no painel
  2) [wait 24h]
  3) activate  → confere a standby no JWKS; promova standby → current no painel
  4) [wait 24h — grace period]
  5) retire    → confere o JWKS; revogue a chave antiga no painel

Ver runbook completo: docs/SIGNING_KEY_ROTATION.md
EOF
}
case "$STAGE" in
  help|-h|--help) usage; exit 0 ;;
  prepare|activate|retire|status) ;;
  *) usage >&2; exit 2 ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
STATE_DIR="${ROTATE_STATE_DIR:-$SCRIPT_DIR}"
STATE_FILE="$STATE_DIR/.rotate-state.json"
MIN_WAIT="${ROTATE_MIN_WAIT_HOURS:-24}"
mig_is_uint "$MIN_WAIT" || mig_die 2 "ROTATE_MIN_WAIT_HOURS inválido: $MIN_WAIT"

# read_stamp <etapa> — imprime o carimbo ISO da etapa; vazio se não existe;
# aborta (1) se o arquivo existe mas não contém um carimbo válido.
read_stamp() {
  local f="$STATE_FILE.$1" v
  [[ -f "$f" ]] || return 0
  v="$(head -n 1 "$f")"
  if [[ ! "$v" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || ! date -u -d "$v" +%s >/dev/null 2>&1; then
    mig_die 1 "estado corrompido em $f — NÃO prossiga; confira a rotação no painel e corrija o arquivo à mão"
  fi
  printf '%s' "$v"
}
write_stamp() {  # grava atômico: carimbo + linhas extras (kids)
  local f="$STATE_FILE.$1"; shift
  ( umask 077; printf '%s\n' "$(mig_ts)" "$@" > "$f.tmp.$$" ) && mv -f "$f.tmp.$$" "$f"
}
hours_since() { echo $(( ( $(date -u +%s) - $(date -u -d "$1" +%s) ) / 3600 )); }

if [[ "$STAGE" == "status" ]]; then
  for f in prepared activated retired; do
    v="$(read_stamp "$f")"
    log "$f: ${v:-—}"
  done
  exit 0
fi

[[ -n "${DEST_SUPABASE_URL:-}" ]] || mig_die 2 "DEST_SUPABASE_URL obrigatório"
mkdir -p "$STATE_DIR"

# jwks_kids — lista (uma por linha) os kid publicados; aborta (1) se inacessível.
jwks_kids() {
  local body hdr rc=0 url
  mig_need curl jq
  hdr="$(mktemp)"
  if [[ -n "${DEST_ANON_KEY:-}" ]]; then printf 'apikey: %s\n' "$DEST_ANON_KEY" > "$hdr"; fi
  body=""
  for url in "$DEST_SUPABASE_URL/auth/v1/.well-known/jwks.json" "$DEST_SUPABASE_URL/auth/v1/jwks"; do
    if body="$(curl -fsS --max-time 15 --retry 2 -H "@$hdr" "$url" 2>/dev/null)"; then rc=0; break; else rc=1; fi
  done
  rm -f "$hdr"
  (( rc == 0 )) || mig_die 1 "não consegui ler o JWKS de $(mig_target "$DEST_SUPABASE_URL") — etapa NÃO registrada"
  jq -er '.keys | if type == "array" then .[] | (.kid // "sem-kid") else error("sem keys") end' <<<"$body" 2>/dev/null \
    || { [[ "$(jq -r '.keys | length' <<<"$body" 2>/dev/null)" == "0" ]] && return 0; mig_die 1 "JWKS em formato inesperado — etapa NÃO registrada"; }
}

PREPARED="$(read_stamp prepared)"; ACTIVATED="$(read_stamp activated)"

case "$STAGE" in
  prepare)
    if [[ -n "$PREPARED" ]]; then
      log "rotação já preparada em $PREPARED — carimbo mantido (use 'status')"; exit 0
    fi
    KIDS=""
    if [[ "${ROTATE_SKIP_JWKS:-0}" == "1" ]]; then log "⚠ ROTATE_SKIP_JWKS=1 — JWKS não conferido"; else KIDS="$(jwks_kids)"; fi
    log "PREPARE — JWKS atual publica $(grep -c . <<<"$KIDS" || true) chave(s). JWTs antigos continuam válidos."
    # shellcheck disable=SC2086  # um kid por argumento
    write_stamp prepared $KIDS
    rm -f "$STATE_FILE.retired"
    log "→ AGORA crie a chave standby (ES256) no painel: Auth → JWT Signing Keys → Create standby key."
    log "✔ Início registrado. Aguarde ${MIN_WAIT}h antes de 'activate'."
    ;;
  activate)
    [[ -n "$PREPARED" ]] || { log "✖ rode 'prepare' primeiro"; exit 2; }
    if [[ -n "$ACTIVATED" ]]; then log "já ativada em $ACTIVATED — carimbo mantido"; exit 0; fi
    AGE="$(hours_since "$PREPARED")"
    if (( AGE < MIN_WAIT )); then
      log "✖ apenas ${AGE}h desde prepare — aguarde ${MIN_WAIT}h (clientes precisam cachear a chave nova)"; exit 1
    fi
    if [[ "${ROTATE_SKIP_JWKS:-0}" == "1" ]]; then
      log "⚠ ROTATE_SKIP_JWKS=1 — NÃO conferi se a standby existe"
    else
      KIDS="$(jwks_kids)"
      NEW="$(comm -13 <(tail -n +2 "$STATE_FILE.prepared" | LC_ALL=C sort -u) <(LC_ALL=C sort -u <<<"$KIDS") | grep -c . || true)"
      if (( NEW < 1 )); then
        log "✖ nenhuma chave nova no JWKS desde o prepare — a standby NÃO foi criada."
        log "  Promover agora deixaria o projeto sem chave nova válida. Crie a standby e tente de novo."
        exit 1
      fi
      log "✔ standby presente no JWKS ($NEW chave(s) nova(s))"
    fi
    write_stamp activated
    log "→ AGORA promova a standby no painel: Auth → JWT Signing Keys → Rotate keys."
    log "✔ Ativação registrada. Monitore erros de verificação por ${MIN_WAIT}h antes de 'retire'."
    ;;
  retire)
    [[ -n "$ACTIVATED" ]] || { log "✖ rode 'activate' primeiro"; exit 2; }
    AGE="$(hours_since "$ACTIVATED")"
    if (( AGE < MIN_WAIT )); then
      log "✖ apenas ${AGE}h desde activate — aguarde ${MIN_WAIT}h (grace period)"
      exit 1
    fi
    if [[ "${ROTATE_SKIP_JWKS:-0}" == "1" ]]; then
      log "⚠ ROTATE_SKIP_JWKS=1 — JWKS não conferido"
    else
      KIDS="$(jwks_kids)"
      N="$(grep -c . <<<"$KIDS" || true)"
      if (( N < 1 )); then
        log "✖ o JWKS não publica nenhuma chave — revogar a antiga agora deixaria o projeto SEM chave válida"; exit 1
      fi
      log "✔ JWKS publica $N chave(s)"
    fi
    write_stamp retired
    rm -f "$STATE_FILE.prepared" "$STATE_FILE.activated"
    log "→ AGORA revogue a chave antiga no painel: Auth → JWT Signing Keys → Revoke."
    log "✔ Rotação concluída e registrada."
    ;;
esac
