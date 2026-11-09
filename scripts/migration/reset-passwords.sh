#!/usr/bin/env bash
# ============================================================================
# reset-passwords.sh
# ----------------------------------------------------------------------------
# Wrapper para reset-passwords.ts: carrega o env, grava log JSONL e dispara os
# e-mails de recuperação de senha para os usuários migrados (DESTINO).
#
# Uso:
#   ./scripts/migration/reset-passwords.sh --dry-run    # simulação (nada é enviado)
#   ./scripts/migration/reset-passwords.sh              # execução real (pede confirmação)
#   ./scripts/migration/reset-passwords.sh --yes        # execução real sem pergunta
#   (demais argumentos são repassados ao reset-passwords.ts)
#
# Ambiente (scripts/migration/env.migration ou .env; ambiente vence):
#   TARGET_SUPABASE_URL      (ou DEST_SUPABASE_URL)
#   TARGET_SERVICE_ROLE_KEY  (ou DEST_SERVICE_ROLE_KEY)
#   TARGET_SITE_URL          URL do app para o link de recuperação
#   LOG_DIR                  pasta dos logs (padrão scripts/migration/logs)
#   CONFIRM=<host do projeto> confirma sem terminal
#
# A execução real ENVIA E-MAIL a todos os usuários marcados: exige --yes,
# CONFIRM=<host> ou confirmação no terminal. O log contém e-mails (permissão 600).
# Exit: 0 ok · 1 o disparo falhou (código do deno) · 2 uso/config/confirmação.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"
MIG_TAG="reset-passwords"

DRY_RUN=0; PASS=()
for arg in "$@"; do
  case "$arg" in
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    --yes)     MIG_YES=1 ;;
    --dry-run) DRY_RUN=1; PASS+=("$arg") ;;
    *)         PASS+=("$arg") ;;
  esac
done

mig_load_env "${SCRIPT_DIR}/env.migration" "${SCRIPT_DIR}/.env"
mig_alias TARGET_SUPABASE_URL DEST_SUPABASE_URL
mig_alias TARGET_SERVICE_ROLE_KEY DEST_SERVICE_ROLE_KEY
[[ -n "${TARGET_SUPABASE_URL:-}" ]]     || mig_die 2 "TARGET_SUPABASE_URL (ou DEST_SUPABASE_URL) não definido — copie env.example → env.migration e preencha"
[[ -n "${TARGET_SERVICE_ROLE_KEY:-}" ]] || mig_die 2 "TARGET_SERVICE_ROLE_KEY (ou DEST_SERVICE_ROLE_KEY) não definido"
[[ -n "${TARGET_SITE_URL:-}" ]]         || mig_die 2 "TARGET_SITE_URL não definido"
export TARGET_SUPABASE_URL TARGET_SERVICE_ROLE_KEY TARGET_SITE_URL
mig_need deno tee

HOST="$(mig_target "$TARGET_SUPABASE_URL")"
if (( DRY_RUN == 0 )); then
  mig_confirm "Isto ENVIA e-mail de recuperação de senha aos usuários marcados em $HOST." "$HOST"
fi

umask 077
LOG_DIR="${LOG_DIR:-${SCRIPT_DIR}/logs}"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/reset-passwords-$(date -u +%Y%m%dT%H%M%SZ)-$$.jsonl"

mig_log "[info] Iniciando disparo$( (( DRY_RUN )) && echo ' (dry-run)') em $HOST. Logs em ${LOG_FILE}"

rc=0
deno run --allow-env --allow-net "${SCRIPT_DIR}/reset-passwords.ts" "${PASS[@]}" | tee "${LOG_FILE}" || rc=$?
if (( rc != 0 )); then
  mig_die 1 "disparo terminou com erro (código $rc) — veja ${LOG_FILE}; é seguro rodar de novo (o .ts pula quem já recebeu)"
fi
mig_log "[info] Concluído. Consulte ${LOG_FILE} e a tabela migration_password_reset_log."
