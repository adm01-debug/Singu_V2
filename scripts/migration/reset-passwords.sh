#!/usr/bin/env bash
# ============================================================================
# reset-passwords.sh
# ----------------------------------------------------------------------------
# Wrapper para reset-passwords.ts com carregamento de env e logging em arquivo.
#
# Uso:
#   ./scripts/migration/reset-passwords.sh              # execução real
#   ./scripts/migration/reset-passwords.sh --dry-run    # simulação
#
# Requer env.migration na raiz de scripts/migration/ com:
#   TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY, TARGET_SITE_URL
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="${SCRIPT_DIR}/env.migration"
LOG_DIR="${SCRIPT_DIR}/logs"
mkdir -p "${LOG_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[fatal] Arquivo ${ENV_FILE} não encontrado. Copie env.example → env.migration e preencha."
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "${ENV_FILE}"; set +a

: "${TARGET_SUPABASE_URL:?TARGET_SUPABASE_URL não definido em env.migration}"
: "${TARGET_SERVICE_ROLE_KEY:?TARGET_SERVICE_ROLE_KEY não definido em env.migration}"
: "${TARGET_SITE_URL:?TARGET_SITE_URL não definido em env.migration}"

if ! command -v deno >/dev/null 2>&1; then
  echo "[fatal] Deno não encontrado. Instale via: curl -fsSL https://deno.land/install.sh | sh"
  exit 1
fi

TS="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_FILE="${LOG_DIR}/reset-passwords-${TS}.jsonl"

echo "[info] Iniciando disparo. Logs em ${LOG_FILE}"

deno run \
  --allow-env \
  --allow-net \
  "${SCRIPT_DIR}/reset-passwords.ts" \
  "$@" \
  | tee "${LOG_FILE}"

echo "[info] Concluído. Consulte ${LOG_FILE} e a tabela migration_password_reset_log."