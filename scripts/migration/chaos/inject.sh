#!/usr/bin/env bash
# ============================================================================
# inject.sh — Chaos Drill: injeta falhas controladas em STAGING para validar a
# resposta do time. NUNCA rode em produção.
#
# Uso (a partir de scripts/migration):
#   export STAGING_CONFIRM=1
#   SCENARIO=kill-drain ./chaos/inject.sh
#   SCENARIO=revoke-grant DRY_RUN=1 ./chaos/inject.sh   # só mostra o que faria
# Cenários: kill-drain | corrupt-checkpoint | revoke-grant | slot-full |
#           dns-stale | resume-drain (desfaz slot-full)
# Ambiente (scripts/migration/.env; ambiente vence):
#   STAGING_CONFIRM=1   obrigatório — confirma que os alvos são STAGING
#   SRC_DB_URL, DEST_DB_URL  alvos (staging)
#   CDC_SLOT            slot do drain alvo (padrão migration_slot)
#   CHAOS_REVOKE_SEC    duração do revoke-grant (padrão 60)
#   PROD_REFS           refs/hosts de produção, separados por espaço, que o
#                       script se recusa a tocar (soma-se ao project_id de
#                       supabase/config.toml)
#   DRY_RUN=1           não injeta nada
# Travas: exige STAGING_CONFIRM=1 exato e aborta se SRC/DEST apontarem para um
# ref de produção. revoke-grant devolve o grant sozinho (processo destacado) e
# só se ele existia antes.
# Exit: 0 injetado (ou dry-run) · 1 a injeção falhou · 2 uso/config/trava.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="chaos"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (use variáveis de ambiente; veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
mig_alias DEST_DB_URL TARGET_DB_URL
[[ "${STAGING_CONFIRM:-}" == "1" ]] || mig_die 2 "exporte STAGING_CONFIRM=1 e confirme que SRC_DB_URL/DEST_DB_URL apontam para STAGING"
[[ -n "${SCENARIO:-}" ]]    || mig_die 2 "defina SCENARIO=<kill-drain|corrupt-checkpoint|revoke-grant|slot-full|dns-stale|resume-drain>"
[[ -n "${SRC_DB_URL:-}" ]]  || mig_die 2 "defina SRC_DB_URL (staging)"
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL (staging)"
CDC_SLOT="${CDC_SLOT:-migration_slot}"
CHAOS_REVOKE_SEC="${CHAOS_REVOKE_SEC:-60}"
DRY_RUN="${DRY_RUN:-0}"
[[ "$CDC_SLOT" =~ ^[a-z0-9_]{1,63}$ ]] || mig_die 2 "CDC_SLOT inválido"
mig_is_uint "$CHAOS_REVOKE_SEC" || mig_die 2 "CHAOS_REVOKE_SEC inválido: $CHAOS_REVOKE_SEC"

# Trava de produção: ref canônico do repo + PROD_REFS.
prod_refs="${PROD_REFS:-}"
cfg="$ROOT_DIR/../../supabase/config.toml"
if [[ -f "$cfg" ]]; then
  ref="$(sed -n 's/^project_id[[:space:]]*=[[:space:]]*"\([a-z0-9]*\)".*/\1/p' "$cfg" | head -n 1)"
  prod_refs+=" $ref"
fi
for ref in $prod_refs; do
  if [[ "$SRC_DB_URL$DEST_DB_URL${DEST_SUPABASE_URL:-}" == *"$ref"* ]]; then
    mig_die 2 "RECUSADO: uma das URLs aponta para produção ($ref). Chaos drill é só em STAGING."
  fi
done

log() { mig_log "$@"; }
dry() { [[ "$DRY_RUN" == "1" ]]; }
PATTERN="pg_recvlogical.*--slot[ =]${CDC_SLOT}( |\$)"

case "$SCENARIO" in
  kill-drain)
    log "→ matando pg_recvlogical do slot $CDC_SLOT"
    if dry; then log "[dry-run] pkill -TERM -f '$PATTERN'"
    else pkill -TERM -f "$PATTERN" || log "nenhum drain rodando"; fi
    log "esperado: cdc/lag-watch.sh detecta lag crescente em <30s"
    ;;
  corrupt-checkpoint)
    log "→ corrompendo _migration_cdc_checkpoint (inserindo LSN inválido) em $(mig_target "$DEST_DB_URL")"
    if dry; then log "[dry-run] INSERT lsn='CHAOS/BADLSN'"
    else
      mig_psql "$DEST_DB_URL" -Xq -v ON_ERROR_STOP=1 \
        -c "INSERT INTO public._migration_cdc_checkpoint(lsn) VALUES ('CHAOS/BADLSN') ON CONFLICT DO NOTHING" \
        || mig_die 1 "não consegui inserir (rodou cdc/checkpoint.sql no destino?)"
    fi
    log "esperado: cdc/replay.ts ignora LSN inválido, continua idempotente"
    log "reverter: DELETE FROM public._migration_cdc_checkpoint WHERE lsn = 'CHAOS/BADLSN'"
    ;;
  revoke-grant)
    log "→ revogando SELECT em public.contacts (destino) por ${CHAOS_REVOKE_SEC}s"
    if dry; then log "[dry-run] REVOKE SELECT ON public.contacts FROM authenticated; GRANT de volta após ${CHAOS_REVOKE_SEC}s"
    else
      had="$(mig_psql "$DEST_DB_URL" -XAtq -v ON_ERROR_STOP=1 \
        -c "SELECT count(*) FROM information_schema.role_table_grants WHERE grantee = 'authenticated' AND table_schema = 'public' AND table_name = 'contacts' AND privilege_type = 'SELECT'")" \
        || mig_die 1 "não consegui consultar o destino"
      if [[ "$had" == "0" ]]; then
        log "authenticated já não tinha SELECT em public.contacts — nada a revogar"
      else
        mig_psql "$DEST_DB_URL" -Xq -v ON_ERROR_STOP=1 -c "REVOKE SELECT ON public.contacts FROM authenticated" \
          || mig_die 1 "REVOKE falhou"
        # restauração destacada do terminal: sobrevive a Ctrl+C/fechamento da sessão
        (
          trap '' HUP INT TERM
          sleep "$CHAOS_REVOKE_SEC"
          if mig_psql "$DEST_DB_URL" -Xq -v ON_ERROR_STOP=1 -c "GRANT SELECT ON public.contacts TO authenticated"; then
            log "grant restaurado"
          else
            mig_err "🚨 NÃO consegui restaurar o grant — rode: GRANT SELECT ON public.contacts TO authenticated;"
          fi
        ) </dev/null &
        disown
      fi
    fi
    log "esperado: smoke-tests.ts falha em <10s; erro de permissão logado"
    log "reverter antes do prazo: GRANT SELECT ON public.contacts TO authenticated;"
    ;;
  slot-full)
    log "→ pausando drain (SIGSTOP) para inflar o slot $CDC_SLOT"
    if dry; then log "[dry-run] pkill -STOP -f '$PATTERN'"
    else pkill -STOP -f "$PATTERN" || log "nenhum drain rodando"; fi
    log "esperado: lag-watch.sh detecta lag_bytes crescente; AUTO_DRAIN reanima"
    log "reverter: SCENARIO=resume-drain ./chaos/inject.sh"
    ;;
  resume-drain)
    log "→ retomando drain pausado (SIGCONT) do slot $CDC_SLOT"
    if dry; then log "[dry-run] pkill -CONT -f '$PATTERN'"
    else pkill -CONT -f "$PATTERN" || log "nenhum drain pausado"; fi
    ;;
  dns-stale)
    log "→ simulação (dry): rode verify/dns-multi-region.sh com EXPECTED errado"
    log "esperado: script sai com código 1 e lista resolvers divergentes"
    ;;
  *)
    mig_die 2 "SCENARIO desconhecido: $SCENARIO" ;;
esac

log "✔ Cenário '$SCENARIO' $(dry && echo 'simulado (dry-run)' || echo 'injetado'). Verifique docs/CHAOS_DRILL.md para resposta esperada."
